import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import {
  GamificationActionType,
  AuditEntityType,
  AuditAction,
} from '@prisma/client';
import {
  GamificationProfileResponse,
  BadgeResponse,
  PointConfigResponse,
} from './dto';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
  ) {}

  // ============================================
  // CORE ACTION HANDLER (called by other services)
  // ============================================

  async onActionCompleted(
    orgId: string,
    actionType: GamificationActionType,
    userId: string,
    entityType?: string,
    entityId?: string,
    isFirstAttempt = true,
  ): Promise<void> {
    try {
      const tp = this.prisma.forTenant(orgId);

      // 1. Look up PointConfig for actionType
      const pointConfig = await tp.pointConfig.findFirst({
        where: { actionType },
      });

      if (!pointConfig || !pointConfig.isActive) {
        this.logger.debug(
          `No active point config found for action: ${actionType}`,
        );
        return;
      }

      // 2. Calculate quality multiplier
      const qualityMultiplier = isFirstAttempt ? 1.0 : 0.5;
      const finalPoints = Math.round(pointConfig.points * qualityMultiplier);

      // 3. Create PointTransaction
      const transaction = await tp.pointTransaction.create({
        data: {
          userId,
          actionType,
          points: finalPoints,
          entityType,
          entityId,
          notes: pointConfig.description,
          isFirstAttempt,
          qualityMultiplier,
        },
      });

      // 4. Upsert UserPoints (increment total/weekly/monthly)
      const userPoints = await tp.userPoints.upsert({
        where: { userId },
        create: {
          userId,
          totalPoints: finalPoints,
          weeklyPoints: finalPoints,
          monthlyPoints: finalPoints,
        },
        update: {
          totalPoints: { increment: finalPoints },
          weeklyPoints: { increment: finalPoints },
          monthlyPoints: { increment: finalPoints },
        },
      });

      this.logger.log(
        `User ${userId} earned ${finalPoints} points for ${actionType}${!isFirstAttempt ? ' (resubmission, 50% multiplier)' : ''}. Total: ${userPoints.totalPoints}`,
      );

      // 5. Check and award badges
      const newBadges = await this.checkAndAwardBadges(orgId, userId);

      // 6. Emit WebSocket events
      this.eventsGateway.emitToUser(userId, 'gamification:points_awarded', {
        actionType,
        points: finalPoints,
        totalPoints: userPoints.totalPoints,
        weeklyPoints: userPoints.weeklyPoints,
        monthlyPoints: userPoints.monthlyPoints,
        transactionId: transaction.id,
        qualityMultiplier,
      });

      // Emit badge earned events if any
      if (newBadges.length > 0) {
        for (const badge of newBadges) {
          this.eventsGateway.emitToUser(userId, 'gamification:badge_earned', {
            badgeId: badge.id,
            badgeName: badge.name,
            badgeDescription: badge.description,
            badgeIconUrl: badge.iconUrl,
          });

          this.logger.log(`User ${userId} earned badge: ${badge.name}`);
        }
      }

      // 7. Async store/dept aggregation (fire-and-forget)
      this.aggregateStoreAndDeptPoints(orgId, userId, finalPoints).catch((err) => {
        this.logger.error(`Store/dept aggregation failed: ${err.message}`);
      });
    } catch (error) {
      this.logger.error(
        `Error processing gamification action: ${error.message}`,
        error.stack,
      );
    }
  }

  // ============================================
  // STORE & DEPARTMENT POINT AGGREGATION
  // ============================================

  private async aggregateStoreAndDeptPoints(
    orgId: string,
    userId: string,
    points: number,
  ): Promise<void> {
    const tp = this.prisma.forTenant(orgId);

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { storeId: true, departmentId: true },
    });

    if (!user?.storeId) return;

    // Update store points
    await this.updateStorePointsIncrement(orgId, user.storeId, points);

    // Update department points if user has a department
    if (user.departmentId) {
      await this.updateDeptPointsIncrement(
        orgId,
        user.storeId,
        user.departmentId,
        points,
      );
    }
  }

  private async updateStorePointsIncrement(
    orgId: string,
    storeId: string,
    points: number,
  ): Promise<void> {
    const employeeCount = await this.getActiveEmployeeCount(orgId, storeId);
    const count = employeeCount || 1;

    // Atomic upsert with per-capita computed inline — no read-then-write race
    await this.prisma.$executeRaw`
      INSERT INTO "StorePoints" ("storeId", "organizationId", "totalPoints", "weeklyPoints", "monthlyPoints",
        "activeEmployeeCount", "perCapitaTotal", "perCapitaWeekly", "perCapitaMonthly")
      VALUES (${storeId}, ${orgId}, ${points}, ${points}, ${points},
        ${employeeCount}, ${points}::float / ${count}, ${points}::float / ${count}, ${points}::float / ${count})
      ON CONFLICT ("storeId") DO UPDATE SET
        "totalPoints" = "StorePoints"."totalPoints" + ${points},
        "weeklyPoints" = "StorePoints"."weeklyPoints" + ${points},
        "monthlyPoints" = "StorePoints"."monthlyPoints" + ${points},
        "activeEmployeeCount" = ${employeeCount},
        "perCapitaTotal" = ("StorePoints"."totalPoints" + ${points})::float / ${count},
        "perCapitaWeekly" = ("StorePoints"."weeklyPoints" + ${points})::float / ${count},
        "perCapitaMonthly" = ("StorePoints"."monthlyPoints" + ${points})::float / ${count}
    `;
  }

  private async updateDeptPointsIncrement(
    orgId: string,
    storeId: string,
    departmentId: string,
    points: number,
  ): Promise<void> {
    const employeeCount = await this.getDeptEmployeeCount(orgId, storeId, departmentId);
    const count = employeeCount || 1;

    // Atomic upsert with per-capita computed inline — no read-then-write race
    await this.prisma.$executeRaw`
      INSERT INTO "DepartmentPoints" ("storeId", "departmentId", "organizationId", "totalPoints", "weeklyPoints", "monthlyPoints",
        "activeEmployeeCount", "perCapitaTotal", "perCapitaWeekly", "perCapitaMonthly")
      VALUES (${storeId}, ${departmentId}, ${orgId}, ${points}, ${points}, ${points},
        ${employeeCount}, ${points}::float / ${count}, ${points}::float / ${count}, ${points}::float / ${count})
      ON CONFLICT ("storeId", "departmentId") DO UPDATE SET
        "totalPoints" = "DepartmentPoints"."totalPoints" + ${points},
        "weeklyPoints" = "DepartmentPoints"."weeklyPoints" + ${points},
        "monthlyPoints" = "DepartmentPoints"."monthlyPoints" + ${points},
        "activeEmployeeCount" = ${employeeCount},
        "perCapitaTotal" = ("DepartmentPoints"."totalPoints" + ${points})::float / ${count},
        "perCapitaWeekly" = ("DepartmentPoints"."weeklyPoints" + ${points})::float / ${count},
        "perCapitaMonthly" = ("DepartmentPoints"."monthlyPoints" + ${points})::float / ${count}
    `;
  }

  async getActiveEmployeeCount(orgId: string, storeId: string): Promise<number> {
    const tp = this.prisma.forTenant(orgId);
    return tp.user.count({
      where: { storeId, isActive: true },
    });
  }

  async getDeptEmployeeCount(
    orgId: string,
    storeId: string,
    departmentId: string,
  ): Promise<number> {
    const tp = this.prisma.forTenant(orgId);
    return tp.user.count({
      where: { storeId, departmentId, isActive: true },
    });
  }

  // ============================================
  // BADGE CHECKING LOGIC
  // ============================================

  private async checkAndAwardBadges(orgId: string, userId: string): Promise<any[]> {
    const tp = this.prisma.forTenant(orgId);

    const earnedBadgeIds = await tp.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });

    const earnedIds = earnedBadgeIds.map((ub) => ub.badgeId);

    const availableBadges = await tp.badge.findMany({
      where: {
        isActive: true,
        id: { notIn: earnedIds },
      },
    });

    const newBadges = [];

    for (const badge of availableBadges) {
      const criteria = badge.criteria as any;

      if (!criteria || !criteria.type) {
        continue;
      }

      let meetsRequirement = false;

      switch (criteria.type) {
        case 'count': {
          const count = await tp.pointTransaction.count({
            where: {
              userId,
              actionType: criteria.actionType as GamificationActionType,
            },
          });
          meetsRequirement = count >= (criteria.threshold || 0);
          break;
        }

        case 'total_points': {
          const userPoints = await tp.userPoints.findUnique({
            where: { userId },
          });
          meetsRequirement =
            (userPoints?.totalPoints || 0) >= (criteria.threshold || 0);
          break;
        }

        case 'streak': {
          // Count consecutive days with at least one transaction of the given type
          const transactions = await tp.pointTransaction.findMany({
            where: {
              userId,
              actionType: criteria.actionType as GamificationActionType,
            },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
          });

          let streakDays = 0;
          if (transactions.length > 0) {
            const uniqueDays = new Set(
              transactions.map((t) => t.createdAt.toISOString().split('T')[0]),
            );
            const sortedDays = Array.from(uniqueDays).sort().reverse();

            // Check if the streak includes today or yesterday (still active)
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(
              Date.now() - 86400000,
            ).toISOString().split('T')[0];

            if (sortedDays[0] === today || sortedDays[0] === yesterday) {
              streakDays = 1;
              for (let i = 1; i < sortedDays.length; i++) {
                const prev = new Date(sortedDays[i - 1]);
                const curr = new Date(sortedDays[i]);
                const diffMs = prev.getTime() - curr.getTime();
                if (diffMs <= 86400000 * 1.5) {
                  // Allow ~1 day gap (handles timezone edge cases)
                  streakDays++;
                } else {
                  break;
                }
              }
            }
          }
          meetsRequirement = streakDays >= (criteria.threshold || 0);
          break;
        }

        default:
          this.logger.warn(
            `Unknown badge criteria type: ${criteria.type} for badge ${badge.id}`,
          );
      }

      if (meetsRequirement) {
        await tp.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  // ============================================
  // PROFILE
  // ============================================

  async getMyProfile(orgId: string, userId: string): Promise<GamificationProfileResponse> {
    const tp = this.prisma.forTenant(orgId);

    const userPoints = await tp.userPoints.findUnique({
      where: { userId },
    });

    const totalPoints = userPoints?.totalPoints || 0;
    const weeklyPoints = userPoints?.weeklyPoints || 0;
    const monthlyPoints = userPoints?.monthlyPoints || 0;

    const rank = await this.calculateUserRank(orgId, userId, totalPoints);

    const userBadges = await tp.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
    });

    const badges: BadgeResponse[] = userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description || undefined,
      iconUrl: ub.badge.iconUrl || undefined,
      criteria: ub.badge.criteria as any,
      earnedCount: 1,
      isEarned: true,
      earnedAt: ub.earnedAt,
    }));

    return {
      totalPoints,
      weeklyPoints,
      monthlyPoints,
      rank,
      badges,
    };
  }

  async getUserProfile(orgId: string, userId: string): Promise<GamificationProfileResponse> {
    const tp = this.prisma.forTenant(orgId);

    const user = await tp.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.getMyProfile(orgId, userId);
  }

  private async calculateUserRank(
    orgId: string,
    userId: string,
    userTotalPoints: number,
  ): Promise<number> {
    const tp = this.prisma.forTenant(orgId);

    const usersWithMorePoints = await tp.userPoints.count({
      where: {
        totalPoints: { gt: userTotalPoints },
      },
    });

    return usersWithMorePoints + 1;
  }

  // ============================================
  // THREE LEADERBOARD TYPES
  // ============================================

  async getLeaderboard(
    orgId: string,
    type: 'individual' | 'store' | 'department',
    period: 'weekly' | 'monthly' | 'allTime',
    filters: {
      storeId?: string;
      regionId?: string;
      role?: string;
      tier?: string;
      departmentId?: string;
    } = {},
  ) {
    switch (type) {
      case 'individual':
        return this.getIndividualLeaderboard(orgId, period, filters);
      case 'store':
        return this.getStoreLeaderboard(orgId, period, filters);
      case 'department':
        return this.getDepartmentLeaderboard(orgId, period, filters);
      default:
        return this.getIndividualLeaderboard(orgId, period, filters);
    }
  }

  private async getIndividualLeaderboard(
    orgId: string,
    period: 'weekly' | 'monthly' | 'allTime',
    filters: { storeId?: string; regionId?: string; role?: string },
  ) {
    const tp = this.prisma.forTenant(orgId);

    const pointsField =
      period === 'weekly'
        ? 'weeklyPoints'
        : period === 'monthly'
          ? 'monthlyPoints'
          : 'totalPoints';

    const userWhere: any = {};
    if (filters.storeId) {
      userWhere.storeId = filters.storeId;
    }
    if (filters.regionId) {
      userWhere.store = { regionId: filters.regionId };
    }
    if (filters.role) {
      userWhere.role = filters.role;
    }

    const userPoints = await tp.userPoints.findMany({
      where: Object.keys(userWhere).length > 0 ? { user: userWhere } : {},
      orderBy: { [pointsField]: 'desc' },
      take: 100,
      include: {
        user: {
          include: {
            store: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    const entries = userPoints.map((up, index) => ({
      userId: up.userId,
      userName: up.user.name,
      role: up.user.role,
      storeName: up.user.store?.name || undefined,
      departmentName: up.user.department?.name || undefined,
      totalPoints: up.totalPoints,
      weeklyPoints: up.weeklyPoints,
      monthlyPoints: up.monthlyPoints,
      rank: index + 1,
    }));

    return {
      entries,
      period,
      type: 'individual' as const,
    };
  }

  private async getStoreLeaderboard(
    orgId: string,
    period: 'weekly' | 'monthly' | 'allTime',
    filters: { regionId?: string; tier?: string },
  ) {
    const tp = this.prisma.forTenant(orgId);

    const perCapitaField =
      period === 'weekly'
        ? 'perCapitaWeekly'
        : period === 'monthly'
          ? 'perCapitaMonthly'
          : 'perCapitaTotal';

    const where: any = {};
    if (filters.regionId) {
      where.store = { region: { id: filters.regionId } };
    }
    if (filters.tier) {
      where.store = { ...(where.store || {}), tier: filters.tier };
    }

    const storePoints = await tp.storePoints.findMany({
      where,
      orderBy: { [perCapitaField]: 'desc' },
      take: 100,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            code: true,
            tier: true,
            region: { select: { id: true, name: true } },
          },
        },
      },
    });

    const entries = storePoints.map((sp, index) => ({
      storeId: sp.storeId,
      storeName: sp.store.name,
      storeCode: sp.store.code,
      tier: sp.store.tier,
      regionName: sp.store.region?.name || undefined,
      weeklyPoints: sp.weeklyPoints,
      monthlyPoints: sp.monthlyPoints,
      totalPoints: sp.totalPoints,
      perCapitaScore:
        period === 'weekly'
          ? sp.perCapitaWeekly
          : period === 'monthly'
            ? sp.perCapitaMonthly
            : sp.perCapitaTotal,
      complianceRate:
        period === 'weekly'
          ? sp.weeklyComplianceRate ?? null
          : period === 'monthly'
            ? sp.monthlyComplianceRate ?? null
            : null, // No all-time compliance rate — only weekly/monthly are tracked
      employeeCount: sp.activeEmployeeCount,
      rank: index + 1,
    }));

    return {
      entries,
      period,
      type: 'store' as const,
    };
  }

  private async getDepartmentLeaderboard(
    orgId: string,
    period: 'weekly' | 'monthly' | 'allTime',
    filters: { storeId?: string; departmentId?: string },
  ) {
    const tp = this.prisma.forTenant(orgId);

    const perCapitaField =
      period === 'weekly'
        ? 'perCapitaWeekly'
        : period === 'monthly'
          ? 'perCapitaMonthly'
          : 'perCapitaTotal';

    const where: any = {};
    if (filters.storeId) {
      where.storeId = filters.storeId;
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    const deptPoints = await tp.departmentPoints.findMany({
      where,
      orderBy: { [perCapitaField]: 'desc' },
      take: 100,
      include: {
        store: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    const entries = deptPoints.map((dp, index) => ({
      departmentId: dp.departmentId,
      departmentName: dp.department.name,
      storeId: dp.storeId,
      storeName: dp.store.name,
      weeklyPoints: dp.weeklyPoints,
      monthlyPoints: dp.monthlyPoints,
      totalPoints: dp.totalPoints,
      perCapitaScore:
        period === 'weekly'
          ? dp.perCapitaWeekly
          : period === 'monthly'
            ? dp.perCapitaMonthly
            : dp.perCapitaTotal,
      employeeCount: dp.activeEmployeeCount,
      rank: index + 1,
    }));

    return {
      entries,
      period,
      type: 'department' as const,
    };
  }

  // ============================================
  // COMPLIANCE SCORING
  // ============================================

  async calculateStoreCompliance(
    orgId: string,
    storeId: string,
    period: 'weekly' | 'monthly',
  ): Promise<number> {
    const tp = this.prisma.forTenant(orgId);

    const now = new Date();
    let startDate: Date;

    if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Count tasks assigned vs completed
    const [tasksAssigned, tasksCompleted] = await Promise.all([
      tp.taskAssignment.count({
        where: {
          storeId,
          assignedAt: { gte: startDate },
        },
      }),
      tp.taskAssignment.count({
        where: {
          storeId,
          assignedAt: { gte: startDate },
          status: { in: ['COMPLETED', 'VERIFIED'] },
        },
      }),
    ]);

    // Count checklists due vs submitted
    const [checklistsDue, checklistsCompleted] = await Promise.all([
      tp.checklistSubmission.count({
        where: {
          storeId,
          createdAt: { gte: startDate },
        },
      }),
      tp.checklistSubmission.count({
        where: {
          storeId,
          createdAt: { gte: startDate },
          status: 'COMPLETED',
        },
      }),
    ]);

    // Count audits scheduled vs completed
    const [auditsScheduled, auditsCompleted] = await Promise.all([
      tp.storeAudit.count({
        where: {
          storeId,
          scheduledDate: { gte: startDate },
        },
      }),
      tp.storeAudit.count({
        where: {
          storeId,
          scheduledDate: { gte: startDate },
          status: 'COMPLETED',
        },
      }),
    ]);

    const totalAssigned = tasksAssigned + checklistsDue + auditsScheduled;
    const totalCompleted = tasksCompleted + checklistsCompleted + auditsCompleted;

    if (totalAssigned === 0) return 100; // No work assigned = 100% compliant
    return Math.round((totalCompleted / totalAssigned) * 100);
  }

  async updateStoreCompliance(orgId: string, storeId: string): Promise<void> {
    const tp = this.prisma.forTenant(orgId);

    const [weeklyRate, monthlyRate] = await Promise.all([
      this.calculateStoreCompliance(orgId, storeId, 'weekly'),
      this.calculateStoreCompliance(orgId, storeId, 'monthly'),
    ]);

    await tp.storePoints.upsert({
      where: { storeId },
      create: {
        storeId,
        weeklyComplianceRate: weeklyRate,
        monthlyComplianceRate: monthlyRate,
        activeEmployeeCount: await this.getActiveEmployeeCount(orgId, storeId),
      },
      update: {
        weeklyComplianceRate: weeklyRate,
        monthlyComplianceRate: monthlyRate,
      },
    });
  }

  async getStoreComplianceData(orgId: string, storeId: string) {
    const tp = this.prisma.forTenant(orgId);

    const store = await tp.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const sp = await tp.storePoints.findUnique({
      where: { storeId },
    });

    return {
      storeId,
      storeName: store.name,
      weeklyComplianceRate: sp?.weeklyComplianceRate ?? null,
      monthlyComplianceRate: sp?.monthlyComplianceRate ?? null,
    };
  }

  // ============================================
  // BADGES
  // ============================================

  async getAllBadges(orgId: string, userId?: string): Promise<BadgeResponse[]> {
    const tp = this.prisma.forTenant(orgId);

    const badges = await tp.badge.findMany({
      where: { isActive: true },
      include: {
        userBadges: {
          select: { userId: true, earnedAt: true },
        },
      },
    });

    return badges.map((badge) => {
      const earnedCount = badge.userBadges.length;
      const userBadge = userId
        ? badge.userBadges.find((ub) => ub.userId === userId)
        : undefined;

      return {
        id: badge.id,
        name: badge.name,
        description: badge.description || undefined,
        iconUrl: badge.iconUrl || undefined,
        criteria: badge.criteria as any,
        earnedCount,
        isEarned: !!userBadge,
        earnedAt: userBadge?.earnedAt,
      };
    });
  }

  // ============================================
  // POINT CONFIGS (Admin)
  // ============================================

  async getPointConfigs(orgId: string): Promise<PointConfigResponse[]> {
    const tp = this.prisma.forTenant(orgId);

    const configs = await tp.pointConfig.findMany({
      orderBy: { actionType: 'asc' },
    });

    return configs.map((config) => ({
      actionType: config.actionType,
      points: config.points,
      description: config.description || undefined,
      isActive: config.isActive,
    }));
  }

  async updatePointConfig(
    orgId: string,
    actionType: GamificationActionType,
    points: number,
    description: string | undefined,
    userId: string,
  ): Promise<PointConfigResponse> {
    const tp = this.prisma.forTenant(orgId);

    const existingConfig = await tp.pointConfig.findFirst({
      where: { actionType },
    });

    if (!existingConfig) {
      throw new NotFoundException(
        `Point config for ${actionType} not found`,
      );
    }

    const updated = await tp.pointConfig.update({
      where: { id: existingConfig.id },
      data: {
        points,
        description: description !== undefined ? description : undefined,
      },
    });

    await this.auditService.log(orgId, {
      entityType: AuditEntityType.POINT_TRANSACTION,
      entityId: actionType,
      action: AuditAction.UPDATED,
      performedById: userId,
      performedByRole: 'OPERATIONS_MANAGER',
      previousValue: {
        points: existingConfig.points,
        description: existingConfig.description,
      },
      newValue: { points, description },
      notes: `Updated point config for ${actionType}`,
    });

    this.logger.log(
      `Point config for ${actionType} updated to ${points} points by user ${userId}`,
    );

    return {
      actionType: updated.actionType,
      points: updated.points,
      description: updated.description || undefined,
      isActive: updated.isActive,
    };
  }
}
