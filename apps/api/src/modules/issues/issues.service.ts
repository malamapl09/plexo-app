import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { VerificationService } from '../verification/verification.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CorrectiveActionsService } from '../corrective-actions/corrective-actions.service';
import { GamificationService } from '../gamification/gamification.service';
import { IssueCategory, IssueStatus, Priority, GamificationActionType } from '@prisma/client';
import {
  CreateIssueDto,
  UpdateIssueDto,
  AssignIssueDto,
  RecategorizeIssueDto,
  ResolveIssueDto,
  IssueQueryDto,
  IssueResponseDto,
  IssueListResponseDto,
  IssueDashboardDto,
  IssueCategoryStatsDto,
} from './dto';

// Escalation time in hours by priority
const ESCALATION_HOURS: Record<Priority, number> = {
  HIGH: 4,
  MEDIUM: 24,
  LOW: 72,
};

// Category labels in Spanish
const CATEGORY_LABELS: Record<IssueCategory, string> = {
  MAINTENANCE: 'Mantenimiento',
  CLEANING: 'Limpieza',
  SECURITY: 'Seguridad',
  IT_SYSTEMS: 'Sistemas IT',
  PERSONNEL: 'Personal',
  INVENTORY: 'Inventario',
};

@Injectable()
export class IssuesService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
    private verificationService: VerificationService,
    private notificationsService: NotificationsService,
    private correctiveActionsService: CorrectiveActionsService,
    private gamificationService: GamificationService,
  ) {}

  async create(orgId: string, dto: CreateIssueDto, reporterId: string, reporterRole: string): Promise<IssueResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    // Verify store exists
    const store = await tp.store.findUnique({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }

    const issue = await tp.issue.create({
      data: {
        storeId: dto.storeId,
        category: dto.category,
        priority: dto.priority,
        title: dto.title,
        description: dto.description,
        status: IssueStatus.REPORTED,
        reportedById: reporterId,
        photoUrls: dto.photoUrls || [],
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    let response = this.mapToResponse(issue);

    // Emit WebSocket event
    this.eventsGateway.emitIssueCreated(response);

    // Auto-assign to best-fit user
    const assigneeId = await this.findBestAssignee(orgId, dto.storeId, dto.category);
    if (assigneeId) {
      const updatedIssue = await tp.issue.update({
        where: { id: issue.id },
        data: {
          assignedToId: assigneeId,
          status: IssueStatus.ASSIGNED,
        },
        include: {
          store: { select: { id: true, name: true, code: true } },
          reportedBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      });
      response = this.mapToResponse(updatedIssue);
      this.eventsGateway.emitIssueAssigned(response);
      this.notificationsService.notifyIssueAssigned(orgId, issue.id, issue.title, assigneeId);
    }

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ISSUE',
      entityId: issue.id,
      action: 'CREATED',
      performedById: reporterId,
      performedByRole: reporterRole,
      newValue: { title: dto.title, category: dto.category, priority: dto.priority, storeId: dto.storeId },
    });

    // Gamification: award points for reporting an issue
    await this.gamificationService.onActionCompleted(
      orgId,
      GamificationActionType.ISSUE_REPORTED,
      reporterId,
      'ISSUE',
      issue.id,
    );

    // Auto-create CAPA for HIGH priority issues
    if (dto.priority === Priority.HIGH) {
      await this.correctiveActionsService.createFromIssue(
        orgId,
        issue.id,
        dto.storeId,
        reporterId,
      );
    }

    return response;
  }

  async findAll(
    orgId: string,
    query: IssueQueryDto,
    user: { id: string; role: string; storeId?: string },
  ): Promise<IssueListResponseDto> {
    const tp = this.prisma.forTenant(orgId);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (user.role === 'STORE_MANAGER' || user.role === 'DEPT_SUPERVISOR') {
      if (!user.storeId) {
        throw new ForbiddenException('Usuario no asignado a ninguna tienda');
      }
      where.storeId = user.storeId;
    } else if (query.storeId) {
      where.storeId = query.storeId;
    }

    // Region filter
    if (query.regionId) {
      where.store = { regionId: query.regionId };
    }

    // Category filter
    if (query.category) {
      where.category = query.category;
    }

    // Status filter
    if (query.status) {
      where.status = query.status;
    }

    // Priority filter
    if (query.priority) {
      where.priority = query.priority;
    }

    // Reporter filter
    if (query.reportedById) {
      where.reportedById = query.reportedById;
    }

    // Assigned user filter
    if (query.assignedToId) {
      where.assignedToId = query.assignedToId;
    }

    // Escalated only filter
    if (query.escalatedOnly) {
      where.escalatedAt = { not: null };
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const [issues, total] = await Promise.all([
      tp.issue.findMany({
        where,
        include: {
          store: {
            select: { id: true, name: true, code: true },
          },
          reportedBy: {
            select: { id: true, name: true },
          },
          assignedTo: {
            select: { id: true, name: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      tp.issue.count({ where }),
    ]);

    return {
      data: issues.map((i) => this.mapToResponse(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(orgId: string, id: string): Promise<IssueResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const issue = await tp.issue.findUnique({
      where: { id },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    if (!issue) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    return this.mapToResponse(issue);
  }

  async update(orgId: string, id: string, dto: UpdateIssueDto, userId: string, userRole: string): Promise<IssueResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.issue.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    if (existing.status === IssueStatus.RESOLVED) {
      throw new BadRequestException('No se puede modificar una incidencia resuelta');
    }

    // Validate status transition
    if (dto.status) {
      this.validateStatusTransition(existing.status, dto.status);
    }

    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;
    }

    if (dto.priority) {
      updateData.priority = dto.priority;
    }

    if (dto.assignedToId) {
      // Verify user exists
      const user = await tp.user.findUnique({
        where: { id: dto.assignedToId },
      });
      if (!user) {
        throw new NotFoundException('Usuario asignado no encontrado');
      }
      updateData.assignedToId = dto.assignedToId;
      if (existing.status === IssueStatus.REPORTED) {
        updateData.status = IssueStatus.ASSIGNED;
      }
    }

    if (dto.photoUrls) {
      updateData.photoUrls = [...existing.photoUrls, ...dto.photoUrls];
    }

    const issue = await tp.issue.update({
      where: { id },
      data: updateData,
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    const response = this.mapToResponse(issue);

    // Emit WebSocket event
    this.eventsGateway.emitIssueUpdated(response);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ISSUE',
      entityId: id,
      action: 'UPDATED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { status: existing.status, priority: existing.priority },
      newValue: dto,
    });

    return response;
  }

  async assign(orgId: string, id: string, dto: AssignIssueDto, userId: string, userRole: string): Promise<IssueResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.issue.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    if (existing.status === IssueStatus.RESOLVED) {
      throw new BadRequestException('No se puede asignar una incidencia resuelta');
    }

    // Verify user exists
    const user = await tp.user.findUnique({
      where: { id: dto.assignedToId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const issue = await tp.issue.update({
      where: { id },
      data: {
        assignedToId: dto.assignedToId,
        status: IssueStatus.ASSIGNED,
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    const response = this.mapToResponse(issue);

    // Emit WebSocket event for assignment
    this.eventsGateway.emitIssueAssigned(response);

    // Send push notification to assignee
    this.notificationsService.notifyIssueAssigned(orgId, id, existing.title, dto.assignedToId);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ISSUE',
      entityId: id,
      action: 'ASSIGNED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { assignedToId: existing.assignedToId },
      newValue: { assignedToId: dto.assignedToId },
      fieldChanged: 'assignedToId',
    });

    return response;
  }

  async recategorize(orgId: string, id: string, dto: RecategorizeIssueDto, userId: string, userRole: string): Promise<IssueResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.issue.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    const openStatuses: IssueStatus[] = [IssueStatus.REPORTED, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS];
    if (!openStatuses.includes(existing.status)) {
      throw new BadRequestException('Solo se pueden recategorizar incidencias abiertas');
    }

    // Update category
    const updatedData: any = { category: dto.category };

    // Auto-reassign based on new category
    const assigneeId = await this.findBestAssignee(orgId, existing.storeId, dto.category);
    if (assigneeId) {
      updatedData.assignedToId = assigneeId;
      updatedData.status = IssueStatus.ASSIGNED;
    } else {
      updatedData.assignedToId = null;
      updatedData.status = IssueStatus.REPORTED;
    }

    const issue = await tp.issue.update({
      where: { id },
      data: updatedData,
      include: {
        store: { select: { id: true, name: true, code: true } },
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    const response = this.mapToResponse(issue);

    // Emit WebSocket event
    this.eventsGateway.emitIssueUpdated(response);

    // Notify new assignee
    if (assigneeId) {
      this.eventsGateway.emitIssueAssigned(response);
      this.notificationsService.notifyIssueAssigned(orgId, id, existing.title, assigneeId);
    }

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ISSUE',
      entityId: id,
      action: 'UPDATED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { category: existing.category },
      newValue: { category: dto.category, assignedToId: assigneeId },
      fieldChanged: 'category',
    });

    return response;
  }

  async startProgress(orgId: string, id: string, userId: string, userRole: string): Promise<IssueResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.issue.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    if (existing.status !== IssueStatus.ASSIGNED) {
      throw new BadRequestException('Solo se pueden iniciar incidencias asignadas');
    }

    const issue = await tp.issue.update({
      where: { id },
      data: {
        status: IssueStatus.IN_PROGRESS,
        assignedToId: existing.assignedToId || userId,
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    const response = this.mapToResponse(issue);

    // Emit WebSocket event
    this.eventsGateway.emitIssueUpdated(response);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ISSUE',
      entityId: id,
      action: 'STATUS_CHANGED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { status: 'ASSIGNED' },
      newValue: { status: 'IN_PROGRESS' },
      fieldChanged: 'status',
    });

    return response;
  }

  async resolve(
    orgId: string,
    id: string,
    dto: ResolveIssueDto,
    userId: string,
    userRole: string,
  ): Promise<IssueResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.issue.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    if (existing.status === IssueStatus.RESOLVED || existing.status === IssueStatus.VERIFIED) {
      throw new BadRequestException('Esta incidencia ya está resuelta');
    }

    if (existing.status === IssueStatus.PENDING_VERIFICATION) {
      throw new BadRequestException('Esta incidencia ya está pendiente de verificación');
    }

    const previousState = { ...existing };
    const requiresVerification = await this.verificationService.requiresVerification(orgId, userRole);

    // Determine status based on role
    const newStatus: IssueStatus = requiresVerification
      ? IssueStatus.PENDING_VERIFICATION
      : IssueStatus.VERIFIED;
    const verificationStatus = requiresVerification ? 'PENDING' : 'VERIFIED';

    const issue = await tp.issue.update({
      where: { id },
      data: {
        status: newStatus,
        resolutionNotes: dto.resolutionNotes,
        resolvedAt: new Date(),
        resolvedById: userId,
        photoUrls: dto.photoUrls
          ? [...existing.photoUrls, ...dto.photoUrls]
          : existing.photoUrls,
        assignedToId: existing.assignedToId || userId,
        verificationStatus: verificationStatus as any,
        // If auto-verified (OPERATIONS_MANAGER), set verification fields
        ...(requiresVerification
          ? {}
          : {
              verifiedById: userId,
              verifiedAt: new Date(),
            }),
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
        resolvedBy: {
          select: { id: true, name: true },
        },
        verifiedBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Log audit entry
    await this.auditService.log(orgId, {
      entityType: 'ISSUE',
      entityId: id,
      action: requiresVerification ? 'VERIFICATION_SUBMITTED' : 'VERIFIED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: previousState,
      newValue: issue,
      fieldChanged: 'status',
      notes: dto.resolutionNotes,
    });

    // Create verification record
    await tp.verification.create({
      data: {
        entityType: 'ISSUE',
        entityId: id,
        submittedById: userId,
        submittedByRole: userRole,
        submittedAt: new Date(),
        status: verificationStatus as any,
        // If auto-verified, set verification fields
        ...(requiresVerification
          ? {}
          : {
              verifiedById: userId,
              verifiedByRole: userRole,
              verifiedAt: new Date(),
            }),
      },
    });

    const response = this.mapToResponse(issue);

    // Emit appropriate WebSocket event
    if (requiresVerification) {
      this.eventsGateway.emitVerificationPending({
        entityType: 'ISSUE',
        entityId: id,
        issue: response,
        storeId: issue.storeId,
        submittedByRole: userRole,
      });
    } else {
      this.eventsGateway.emitIssueResolved(response);
    }

    // Gamification: award points for resolving an issue
    // If previously rejected, this is a resubmission (50% quality multiplier)
    const isFirstAttempt = existing.verificationStatus !== 'REJECTED';
    await this.gamificationService.onActionCompleted(
      orgId,
      GamificationActionType.ISSUE_RESOLVED,
      userId,
      'ISSUE',
      id,
      isFirstAttempt,
    );

    return response;
  }

  async escalate(orgId: string, id: string, userId: string, userRole: string): Promise<IssueResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.issue.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    if (existing.escalatedAt) {
      throw new BadRequestException('Esta incidencia ya está escalada');
    }

    const issue = await tp.issue.update({
      where: { id },
      data: {
        escalatedAt: new Date(),
        priority: Priority.HIGH,
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    const response = this.mapToResponse(issue);

    // Emit WebSocket event for escalation
    this.eventsGateway.emitIssueEscalated(response);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ISSUE',
      entityId: id,
      action: 'ESCALATED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { priority: existing.priority, escalatedAt: null },
      newValue: { priority: 'HIGH', escalatedAt: issue.escalatedAt },
    });

    return response;
  }

  async checkAndEscalate(orgId: string): Promise<number> {
    const tp = this.prisma.forTenant(orgId);
    const now = new Date();
    let escalatedCount = 0;

    // Check each priority level
    for (const priority of Object.keys(ESCALATION_HOURS) as Priority[]) {
      const hoursThreshold = ESCALATION_HOURS[priority];
      const thresholdDate = new Date(now.getTime() - hoursThreshold * 60 * 60 * 1000);

      const overdueIssues = await tp.issue.findMany({
        where: {
          priority,
          status: {
            in: [IssueStatus.REPORTED, IssueStatus.ASSIGNED],
          },
          escalatedAt: null,
          createdAt: {
            lte: thresholdDate,
          },
        },
      });

      for (const issue of overdueIssues) {
        const escalatedIssue = await tp.issue.update({
          where: { id: issue.id },
          data: {
            escalatedAt: now,
            priority: Priority.HIGH,
          },
          include: {
            store: {
              select: { id: true, name: true, code: true },
            },
            reportedBy: {
              select: { id: true, name: true },
            },
            assignedTo: {
              select: { id: true, name: true },
            },
          },
        });

        // Emit WebSocket event for each auto-escalated issue
        this.eventsGateway.emitIssueEscalated(this.mapToResponse(escalatedIssue));
        escalatedCount++;
      }
    }

    return escalatedCount;
  }

  async getMyIssues(orgId: string, userId: string): Promise<IssueResponseDto[]> {
    const tp = this.prisma.forTenant(orgId);

    const issues = await tp.issue.findMany({
      where: {
        reportedById: userId,
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return issues.map((i) => this.mapToResponse(i));
  }

  async getAssignedIssues(orgId: string, userId: string): Promise<IssueResponseDto[]> {
    const tp = this.prisma.forTenant(orgId);

    const issues = await tp.issue.findMany({
      where: {
        assignedToId: userId,
        status: {
          not: IssueStatus.RESOLVED,
        },
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return issues.map((i) => this.mapToResponse(i));
  }

  async getDashboard(
    orgId: string,
    storeId?: string,
    regionId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<IssueDashboardDto> {
    const tp = this.prisma.forTenant(orgId);
    const where: any = {};

    if (storeId) {
      where.storeId = storeId;
    }

    if (regionId) {
      where.store = { regionId };
    }

    // Default to last 30 days if no date range
    if (!startDate && !endDate) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.createdAt = { gte: thirtyDaysAgo };
    } else {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Get stats
    const [total, reported, assigned, inProgress, resolved, escalated] = await Promise.all([
      tp.issue.count({ where }),
      tp.issue.count({ where: { ...where, status: IssueStatus.REPORTED } }),
      tp.issue.count({ where: { ...where, status: IssueStatus.ASSIGNED } }),
      tp.issue.count({ where: { ...where, status: IssueStatus.IN_PROGRESS } }),
      tp.issue.count({ where: { ...where, status: IssueStatus.RESOLVED } }),
      tp.issue.count({ where: { ...where, escalatedAt: { not: null } } }),
    ]);

    // Calculate average resolution time
    const resolvedIssues = await tp.issue.findMany({
      where: {
        ...where,
        status: IssueStatus.RESOLVED,
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTimeHours = 0;
    if (resolvedIssues.length > 0) {
      const totalHours = resolvedIssues.reduce((acc, issue) => {
        const diff = issue.resolvedAt!.getTime() - issue.createdAt.getTime();
        return acc + diff / (1000 * 60 * 60);
      }, 0);
      avgResolutionTimeHours = totalHours / resolvedIssues.length;
    }

    // Get stats by category using groupBy (2 queries instead of 24)
    const [categoryStatusGroups, categoryEscalatedGroups] = await Promise.all([
      tp.issue.groupBy({
        by: ['category', 'status'],
        where,
        _count: { _all: true },
      }),
      tp.issue.groupBy({
        by: ['category'],
        where: { ...where, escalatedAt: { not: null } },
        _count: { _all: true },
      }),
    ]);

    // Build escalated lookup
    const escalatedByCategory = new Map<string, number>();
    for (const g of categoryEscalatedGroups) {
      escalatedByCategory.set(g.category, g._count._all);
    }

    // Aggregate per category
    const categoryMap = new Map<string, { total: number; resolved: number; open: number }>();
    for (const g of categoryStatusGroups) {
      const existing = categoryMap.get(g.category) || { total: 0, resolved: 0, open: 0 };
      existing.total += g._count._all;
      if (g.status === IssueStatus.RESOLVED) {
        existing.resolved += g._count._all;
      } else {
        existing.open += g._count._all;
      }
      categoryMap.set(g.category, existing);
    }

    const byCategory: IssueCategoryStatsDto[] = [];
    for (const [category, stats] of categoryMap) {
      byCategory.push({
        category: category as IssueCategory,
        categoryLabel: CATEGORY_LABELS[category as IssueCategory],
        total: stats.total,
        open: stats.open,
        resolved: stats.resolved,
        escalated: escalatedByCategory.get(category) || 0,
      });
    }

    // Sort by total descending
    byCategory.sort((a, b) => b.total - a.total);

    // Get recent, escalated, and high priority issues
    const [recentIssues, escalatedIssues, highPriorityIssues] = await Promise.all([
      tp.issue.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, code: true } },
          reportedBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      tp.issue.findMany({
        where: {
          ...where,
          escalatedAt: { not: null },
          status: { not: IssueStatus.RESOLVED },
        },
        include: {
          store: { select: { id: true, name: true, code: true } },
          reportedBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { escalatedAt: 'desc' },
        take: 10,
      }),
      tp.issue.findMany({
        where: {
          ...where,
          priority: Priority.HIGH,
          status: { not: IssueStatus.RESOLVED },
        },
        include: {
          store: { select: { id: true, name: true, code: true } },
          reportedBy: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 10,
      }),
    ]);

    return {
      stats: {
        total,
        reported,
        assigned,
        inProgress,
        resolved,
        escalated,
        avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 10) / 10,
      },
      byCategory,
      recentIssues: recentIssues.map((i) => this.mapToResponse(i)),
      escalatedIssues: escalatedIssues.map((i) => this.mapToResponse(i)),
      highPriorityIssues: highPriorityIssues.map((i) => this.mapToResponse(i)),
    };
  }

  private async findBestAssignee(orgId: string, storeId: string, category: IssueCategory): Promise<string | null> {
    const tp = this.prisma.forTenant(orgId);

    // Find users in this store who have this category, ordered by fewest open assigned issues
    const candidates = await tp.user.findMany({
      where: {
        storeId,
        isActive: true,
        issueCategories: { has: category },
      },
      select: {
        id: true,
        _count: {
          select: {
            assignedIssues: {
              where: { status: { in: [IssueStatus.REPORTED, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS] } },
            },
          },
        },
      },
      orderBy: { assignedIssues: { _count: 'asc' } },
    });

    if (candidates.length > 0) return candidates[0].id;

    // Fallback: assign to store manager
    const storeManager = await tp.user.findFirst({
      where: { storeId, role: 'STORE_MANAGER', isActive: true },
      select: { id: true },
    });

    return storeManager?.id ?? null;
  }

  private validateStatusTransition(current: IssueStatus, next: IssueStatus): void {
    const validTransitions: Record<IssueStatus, IssueStatus[]> = {
      [IssueStatus.REPORTED]: [IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED, IssueStatus.PENDING_VERIFICATION],
      [IssueStatus.ASSIGNED]: [IssueStatus.IN_PROGRESS, IssueStatus.RESOLVED, IssueStatus.PENDING_VERIFICATION],
      [IssueStatus.IN_PROGRESS]: [IssueStatus.RESOLVED, IssueStatus.PENDING_VERIFICATION],
      [IssueStatus.PENDING_VERIFICATION]: [IssueStatus.VERIFIED, IssueStatus.REJECTED],
      [IssueStatus.VERIFIED]: [],
      [IssueStatus.REJECTED]: [IssueStatus.IN_PROGRESS, IssueStatus.PENDING_VERIFICATION], // Can be reworked
      [IssueStatus.RESOLVED]: [], // Legacy - kept for backwards compatibility
    };

    if (!validTransitions[current]?.includes(next)) {
      throw new BadRequestException(
        `Transición de estado inválida: ${current} → ${next}`,
      );
    }
  }

  private mapToResponse(issue: any): IssueResponseDto {
    return {
      id: issue.id,
      storeId: issue.storeId,
      store: issue.store,
      category: issue.category,
      priority: issue.priority,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      reportedBy: issue.reportedBy,
      assignedTo: issue.assignedTo,
      resolvedBy: issue.resolvedBy,
      verifiedBy: issue.verifiedBy,
      photoUrls: issue.photoUrls || [],
      resolutionNotes: issue.resolutionNotes,
      resolvedAt: issue.resolvedAt,
      verificationStatus: issue.verificationStatus,
      verifiedAt: issue.verifiedAt,
      rejectionReason: issue.rejectionReason,
      escalatedAt: issue.escalatedAt,
      isEscalated: issue.escalatedAt != null,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  }
}
