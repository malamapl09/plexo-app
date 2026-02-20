import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

const ROLE_DATA = [
  { key: 'OPERATIONS_MANAGER', label: 'Operations Manager', description: 'Full access to all system features', color: 'blue', level: 100, sortOrder: 1 },
  { key: 'HQ_TEAM', label: 'HQ Team', description: 'Central headquarters team', color: 'purple', level: 80, sortOrder: 2 },
  { key: 'REGIONAL_SUPERVISOR', label: 'Regional Supervisor', description: 'Supervises stores by region', color: 'green', level: 60, sortOrder: 3 },
  { key: 'STORE_MANAGER', label: 'Store Manager', description: 'Full management of a single store', color: 'orange', level: 40, sortOrder: 4 },
  { key: 'DEPT_SUPERVISOR', label: 'Department Supervisor', description: 'Supervises a department within a store', color: 'gray', level: 20, sortOrder: 5 },
];

const DEFAULT_MODULE_ACCESS: Record<string, Record<string, boolean>> = {
  OPERATIONS_MANAGER:  { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: true, gamification: true, reports: true, stores: true, users: true, training: true },
  HQ_TEAM:             { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: true, gamification: true, reports: true, stores: false, users: false, training: true },
  REGIONAL_SUPERVISOR: { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: false, gamification: true, reports: true, stores: false, users: false, training: true },
  STORE_MANAGER:       { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: false, gamification: true, reports: false, stores: false, users: false, training: true },
  DEPT_SUPERVISOR:     { tasks: true, receiving: true, issues: true, verification: false, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: false, gamification: true, reports: false, stores: false, users: false, training: false },
};

const POINT_CONFIGS = [
  { actionType: 'TASK_COMPLETED', points: 10, description: 'Complete a task' },
  { actionType: 'ON_TIME_COMPLETION', points: 5, description: 'Complete a task before deadline' },
  { actionType: 'ISSUE_REPORTED', points: 5, description: 'Report an issue' },
  { actionType: 'ISSUE_RESOLVED', points: 15, description: 'Resolve an issue' },
  { actionType: 'CHECKLIST_COMPLETED', points: 10, description: 'Complete a checklist' },
  { actionType: 'AUDIT_COMPLETED', points: 20, description: 'Complete an audit' },
  { actionType: 'TRAINING_COMPLETED', points: 25, description: 'Complete a training course' },
  { actionType: 'CAMPAIGN_SUBMITTED', points: 10, description: 'Submit a campaign' },
  { actionType: 'PERFECT_DAY', points: 50, description: 'Complete all tasks in a day' },
];

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async createOrganization(dto: CreateOrganizationDto) {
    const tempPassword = crypto.randomBytes(4).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Check slug uniqueness inside transaction to prevent TOCTOU race
      const existingSlug = await tx.organization.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug) {
        throw new ConflictException(`Organization slug "${dto.slug}" is already taken`);
      }

      // 2. Create the organization
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: dto.domain,
          logoUrl: dto.logoUrl,
          primaryColor: dto.primaryColor ?? '#4F46E5',
          timezone: dto.timezone ?? 'America/Santo_Domingo',
          locale: dto.locale ?? 'es',
          plan: dto.plan ?? 'free',
        },
      });

      // 3. Create default roles
      await tx.role.createMany({
        data: ROLE_DATA.map((role) => ({ ...role, organizationId: org.id })),
      });

      // 4. Create default RoleModuleAccess (75 rows: 5 roles x 15 modules)
      const moduleAccessRows = Object.entries(DEFAULT_MODULE_ACCESS).flatMap(
        ([role, moduleMap]) =>
          Object.entries(moduleMap).map(([mod, hasAccess]) => ({
            role,
            module: mod,
            hasAccess,
            organizationId: org.id,
          })),
      );
      await tx.roleModuleAccess.createMany({ data: moduleAccessRows });

      // 5. Create admin user with isSuperAdmin
      const adminUser = await tx.user.create({
        data: {
          email: dto.adminEmail.toLowerCase(),
          passwordHash,
          name: dto.adminName,
          role: 'OPERATIONS_MANAGER',
          isSuperAdmin: true,
          organizationId: org.id,
        },
      });

      // 6. Create default gamification PointConfigs
      await tx.pointConfig.createMany({
        data: POINT_CONFIGS.map((config) => ({
          actionType: config.actionType,
          points: config.points,
          description: config.description,
          organizationId: org.id,
        })),
      });

      return { org, adminUser };
    });

    // Send welcome email outside the transaction (non-critical)
    try {
      await this.emailService.sendWelcome(
        dto.adminEmail,
        dto.name,
        tempPassword,
      );
    } catch (err) {
      // Log but don't fail — email is best-effort
      console.warn(`[PlatformService] Welcome email failed for ${dto.adminEmail}:`, err?.message);
    }

    return {
      id: result.org.id,
      name: result.org.name,
      slug: result.org.slug,
      domain: result.org.domain,
      plan: result.org.plan,
      isActive: result.org.isActive,
      createdAt: result.org.createdAt,
      adminUser: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        name: result.adminUser.name,
      },
    };
  }

  async listOrganizations() {
    const orgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            stores: true,
          },
        },
      },
    });

    return orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      domain: org.domain,
      plan: org.plan,
      isActive: org.isActive,
      primaryColor: org.primaryColor,
      timezone: org.timezone,
      locale: org.locale,
      createdAt: org.createdAt,
      _count: org._count,
    }));
  }

  async getOrganization(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            stores: true,
            roles: true,
            tasks: true,
            issues: true,
            storeAudits: true,
            trainingCourses: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${id} not found`);
    }

    return org;
  }

  async updateOrganization(id: string, dto: UpdateOrganizationDto) {
    await this.getOrganization(id); // throws 404 if not found

    return this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name,
        domain: dto.domain,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        timezone: dto.timezone,
        locale: dto.locale,
        isActive: dto.isActive,
        plan: dto.plan,
        settings: dto.settings,
      },
    });
  }

  // ── P2: Enhanced Platform Stats ──────────────────────────────────
  async getStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrgs,
      activeOrgs,
      totalUsers,
      totalStores,
      newOrgsThisMonth,
      loginsToday,
      tasksCompletedToday,
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isPlatformAdmin: false } }),
      this.prisma.store.count(),
      this.prisma.organization.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.auditLog.count({ where: { action: 'LOGIN', createdAt: { gte: startOfToday } } }),
      this.prisma.taskAssignment.count({ where: { status: 'COMPLETED', completedAt: { gte: startOfToday } } }),
    ]);

    return { totalOrgs, activeOrgs, totalUsers, totalStores, newOrgsThisMonth, loginsToday, tasksCompletedToday };
  }

  // ── P6: Audit Log Viewer ───────────────────────────────────────
  async getOrganizationAuditLogs(
    orgId: string,
    query: { page?: number; limit?: number; entityType?: string; action?: string },
  ) {
    await this.getOrganization(orgId); // 404 check

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const where: { organizationId: string; entityType?: string; action?: string } = { organizationId: orgId };
    if (query.entityType) where.entityType = query.entityType;
    if (query.action) where.action = query.action;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          performedBy: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── P3: Organization Activity Timeline ─────────────────────────
  async getOrganizationActivity(orgId: string) {
    await this.getOrganization(orgId); // 404 check

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentLogs, activityByDay, recentLogins] = await Promise.all([
      // Recent audit logs
      this.prisma.auditLog.findMany({
        where: { organizationId: orgId, createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          performedBy: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      // Activity by day (raw SQL)
      this.prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*)::int as count
        FROM audit_logs
        WHERE "organizationId" = ${orgId} AND "createdAt" >= ${thirtyDaysAgo}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
        ORDER BY date
      `,
      // Recent logins
      this.prisma.auditLog.findMany({
        where: { organizationId: orgId, action: 'LOGIN', createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          performedBy: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return { recentLogs, activityByDay, recentLogins };
  }

  // ── Shared helper for P1 + P4 ─────────────────────────────────
  private async _getLastLoginsByOrg(orgIds: string[]): Promise<Map<string, Date>> {
    if (orgIds.length === 0) return new Map();

    const rows = await this.prisma.$queryRaw<{ organizationId: string; last_login: Date }[]>`
      SELECT DISTINCT ON ("organizationId") "organizationId", "createdAt" as last_login
      FROM audit_logs
      WHERE action = 'LOGIN' AND "organizationId" = ANY(${orgIds}::uuid[])
      ORDER BY "organizationId", "createdAt" DESC
    `;

    const map = new Map<string, Date>();
    for (const row of rows) {
      map.set(row.organizationId, row.last_login);
    }
    return map;
  }

  // ── P4: Alerts & Notifications ─────────────────────────────────
  async getAlerts() {
    const orgs = await this.prisma.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true, plan: true, createdAt: true },
    });
    if (orgs.length === 0) return [];

    const orgIds = orgs.map((o) => o.id);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const [lastLogins, taskCounts, checklistCounts, auditCounts, userCounts] = await Promise.all([
      this._getLastLoginsByOrg(orgIds),
      this.prisma.task.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds } }, _count: true }),
      this.prisma.checklistSubmission.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds } }, _count: true }),
      this.prisma.storeAudit.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds } }, _count: true }),
      this.prisma.user.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds }, isPlatformAdmin: false }, _count: true }),
    ]);

    const taskMap = new Map(taskCounts.map((r) => [r.organizationId, r._count]));
    const clMap = new Map(checklistCounts.map((r) => [r.organizationId, r._count]));
    const auditMap = new Map(auditCounts.map((r) => [r.organizationId, r._count]));
    const userCountMap = new Map(userCounts.map((r) => [r.organizationId, r._count]));

    const alerts: { type: string; severity: string; orgId: string; orgName: string; message: string }[] = [];

    for (const org of orgs) {
      // Inactive org alert
      const lastLogin = lastLogins.get(org.id);
      if (!lastLogin || lastLogin < sevenDaysAgo) {
        alerts.push({
          type: 'inactive',
          severity: 'warning',
          orgId: org.id,
          orgName: org.name,
          message: lastLogin
            ? `Sin logins desde ${lastLogin.toISOString().split('T')[0]}`
            : 'Nunca ha tenido un login',
        });
      }

      // Low adoption (skip if created < 3 days ago)
      if (org.createdAt < threeDaysAgo) {
        const tasks = taskMap.get(org.id) || 0;
        const checklists = clMap.get(org.id) || 0;
        const audits = auditMap.get(org.id) || 0;
        if (tasks === 0 && checklists === 0 && audits === 0) {
          alerts.push({
            type: 'low_adoption',
            severity: 'info',
            orgId: org.id,
            orgName: org.name,
            message: 'Sin tareas, checklists ni auditorias creadas',
          });
        }
      }

      // Plan upsell opportunity
      if (org.plan === 'free' && (userCountMap.get(org.id) || 0) > 10) {
        alerts.push({
          type: 'plan_opportunity',
          severity: 'info',
          orgId: org.id,
          orgName: org.name,
          message: `Plan free con ${userCountMap.get(org.id)} usuarios — considerar upgrade`,
        });
      }
    }

    // Sort: warnings first
    alerts.sort((a, b) => {
      if (a.severity === 'warning' && b.severity !== 'warning') return -1;
      if (a.severity !== 'warning' && b.severity === 'warning') return 1;
      return 0;
    });

    return alerts;
  }

  // ── P1: Organization Health Dashboard ──────────────────────────
  async getOrganizationHealth() {
    const orgs = await this.prisma.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, plan: true },
    });
    if (orgs.length === 0) return [];

    const orgIds = orgs.map((o) => o.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      lastLogins,
      activeUsers7dRows,
      activeUsers30dRows,
      userCounts,
      taskCountRows,
      issueCountRows,
      checklistCountRows,
      auditCountRows,
      trainingCountRows,
      taskTotalRows,
      taskCompletedRows,
    ] = await Promise.all([
      this._getLastLoginsByOrg(orgIds),
      // Active users 7d
      this.prisma.$queryRaw<{ organizationId: string; count: number }[]>`
        SELECT "organizationId", COUNT(DISTINCT "performedById")::int as count
        FROM audit_logs
        WHERE action = 'LOGIN' AND "createdAt" >= ${sevenDaysAgo} AND "organizationId" = ANY(${orgIds}::uuid[])
        GROUP BY "organizationId"
      `,
      // Active users 30d
      this.prisma.$queryRaw<{ organizationId: string; count: number }[]>`
        SELECT "organizationId", COUNT(DISTINCT "performedById")::int as count
        FROM audit_logs
        WHERE action = 'LOGIN' AND "createdAt" >= ${thirtyDaysAgo} AND "organizationId" = ANY(${orgIds}::uuid[])
        GROUP BY "organizationId"
      `,
      // User counts
      this.prisma.user.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds }, isPlatformAdmin: false }, _count: true }),
      // Module adoption: tasks
      this.prisma.task.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds } }, _count: true }),
      // Module adoption: issues
      this.prisma.issue.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds } }, _count: true }),
      // Module adoption: checklists
      this.prisma.checklistSubmission.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds } }, _count: true }),
      // Module adoption: audits
      this.prisma.storeAudit.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds } }, _count: true }),
      // Module adoption: training
      this.prisma.trainingCourse.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds } }, _count: true }),
      // Task completion 30d — total
      this.prisma.taskAssignment.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds }, createdAt: { gte: thirtyDaysAgo } }, _count: true }),
      // Task completion 30d — completed
      this.prisma.taskAssignment.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds }, status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } }, _count: true }),
    ]);

    const toMap = <T extends { organizationId: string; _count: number }>(rows: T[]) =>
      new Map(rows.map((r) => [r.organizationId, r._count]));
    const toMapRaw = (rows: { organizationId: string; count: number }[]) =>
      new Map(rows.map((r) => [r.organizationId, r.count]));

    const au7d = toMapRaw(activeUsers7dRows);
    const au30d = toMapRaw(activeUsers30dRows);
    const users = toMap(userCounts);
    const tasks = toMap(taskCountRows);
    const issues = toMap(issueCountRows);
    const checklists = toMap(checklistCountRows);
    const audits = toMap(auditCountRows);
    const training = toMap(trainingCountRows);
    const taskTotal = toMap(taskTotalRows);
    const taskCompleted = toMap(taskCompletedRows);

    return orgs.map((org) => {
      const total = taskTotal.get(org.id) || 0;
      const completed = taskCompleted.get(org.id) || 0;
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        lastLogin: lastLogins.get(org.id) || null,
        activeUsers7d: au7d.get(org.id) || 0,
        activeUsers30d: au30d.get(org.id) || 0,
        totalUsers: users.get(org.id) || 0,
        moduleAdoption: {
          tasks: (tasks.get(org.id) || 0) > 0,
          issues: (issues.get(org.id) || 0) > 0,
          checklists: (checklists.get(org.id) || 0) > 0,
          audits: (audits.get(org.id) || 0) > 0,
          training: (training.get(org.id) || 0) > 0,
        },
        taskCompletionRate: total > 0 ? Math.round((completed / total) * 100) : null,
      };
    });
  }

  // ── P5: Cross-Org Benchmarking ─────────────────────────────────
  async getBenchmarks() {
    const orgs = await this.prisma.organization.findMany({
      where: { isActive: true },
      select: { id: true, name: true, plan: true },
    });
    if (orgs.length === 0) return [];

    const orgIds = orgs.map((o) => o.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      userCounts,
      taskTotalRows,
      taskCompletedRows,
      auditScoreRows,
      enrollTotalRows,
      enrollCompletedRows,
      engagedUserRows,
    ] = await Promise.all([
      this.prisma.user.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds }, isPlatformAdmin: false }, _count: true }),
      // Task completion 30d
      this.prisma.taskAssignment.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds }, createdAt: { gte: thirtyDaysAgo } }, _count: true }),
      this.prisma.taskAssignment.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds }, status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } }, _count: true }),
      // Average audit score 30d
      this.prisma.storeAudit.groupBy({
        by: ['organizationId'],
        where: { organizationId: { in: orgIds }, status: 'COMPLETED', completedAt: { gte: thirtyDaysAgo } },
        _avg: { overallScore: true },
      }),
      // Training completion
      this.prisma.trainingEnrollment.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds } }, _count: true }),
      this.prisma.trainingEnrollment.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds }, status: 'COMPLETED' }, _count: true }),
      // Gamification engagement (users with totalPoints > 0)
      this.prisma.userPoints.groupBy({ by: ['organizationId'], where: { organizationId: { in: orgIds }, totalPoints: { gt: 0 } }, _count: true }),
    ]);

    const toMap = <T extends { organizationId: string; _count: number }>(rows: T[]) =>
      new Map(rows.map((r) => [r.organizationId, r._count]));

    const users = toMap(userCounts);
    const taskTotal = toMap(taskTotalRows);
    const taskCompleted = toMap(taskCompletedRows);
    const auditScoreMap = new Map(auditScoreRows.map((r) => [r.organizationId, r._avg.overallScore]));
    const enrollTotal = toMap(enrollTotalRows);
    const enrollCompleted = toMap(enrollCompletedRows);
    const engaged = toMap(engagedUserRows);

    return orgs.map((org) => {
      const tt = taskTotal.get(org.id) || 0;
      const tc = taskCompleted.get(org.id) || 0;
      const et = enrollTotal.get(org.id) || 0;
      const ec = enrollCompleted.get(org.id) || 0;
      const totalUsers = users.get(org.id) || 0;
      const engagedUsers = engaged.get(org.id) || 0;

      return {
        orgId: org.id,
        orgName: org.name,
        plan: org.plan,
        totalUsers,
        metrics: {
          taskCompletionRate: tt > 0 ? Math.round((tc / tt) * 100) : null,
          avgAuditScore: auditScoreMap.get(org.id) != null ? Math.round(auditScoreMap.get(org.id)!) : null,
          trainingCompletionRate: et > 0 ? Math.round((ec / et) * 100) : null,
          gamificationEngagement: totalUsers > 0 ? Math.round((engagedUsers / totalUsers) * 100) : null,
        },
      };
    });
  }
}
