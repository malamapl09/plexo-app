import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { GamificationService } from '../gamification/gamification.service';
import {
  CorrectiveActionStatus,
  CAPASourceType,
  AuditEntityType,
  AuditAction,
  Priority,
  GamificationActionType,
} from '@prisma/client';
import {
  CreateCorrectiveActionDto,
  UpdateCorrectiveActionDto,
  CapaQueryDto,
  CapaDetailResponseDto,
  CapaListResponseDto,
  CapaDashboardResponseDto,
  CapaListItemDto,
} from './dto';

@Injectable()
export class CorrectiveActionsService {
  private readonly logger = new Logger(CorrectiveActionsService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
    private gamificationService: GamificationService,
  ) {}

  /**
   * Create a standalone corrective action
   */
  async create(
    orgId: string,
    dto: CreateCorrectiveActionDto,
    userId: string,
    userRole: string,
  ): Promise<CapaDetailResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    // Validate assigned user exists and is active
    const assignedUser = await tp.user.findFirst({
      where: { id: dto.assignedToId, isActive: true },
    });

    if (!assignedUser) {
      throw new BadRequestException('Assigned user not found or inactive');
    }

    // Validate store exists
    const store = await tp.store.findFirst({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // If findingId provided, validate it exists
    if (dto.findingId) {
      const finding = await this.prisma.auditFinding.findUnique({
        where: { id: dto.findingId },
      });

      if (!finding) {
        throw new NotFoundException('Audit finding not found');
      }
    }

    // Create the corrective action
    const action = await tp.correctiveAction.create({
      data: {
        sourceType: dto.sourceType || CAPASourceType.MANUAL,
        sourceId: dto.sourceId,
        findingId: dto.findingId,
        title: dto.title,
        description: dto.description,
        assignedToId: dto.assignedToId,
        storeId: dto.storeId,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority || Priority.MEDIUM,
        status: CorrectiveActionStatus.PENDING,
        createdById: userId,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        finding: {
          select: { id: true, title: true, description: true, severity: true },
        },
      },
    });

    // Log audit
    await this.auditService.log(orgId, {
      entityType: AuditEntityType.CORRECTIVE_ACTION,
      entityId: action.id,
      action: AuditAction.CREATED,
      performedById: userId,
      performedByRole: userRole,
      notes: `Created corrective action: ${action.title}`,
    });

    // Emit WebSocket events
    this.eventsGateway.emitToUser(dto.assignedToId, 'capa:created', action);
    this.eventsGateway.emitToStore(dto.storeId, 'capa:created', action, orgId);
    this.eventsGateway.emitToHQ('capa:created', action, orgId);

    return this.mapToDetailResponse(action);
  }

  /**
   * Find all corrective actions with filtering and role-based scoping
   */
  async findAll(
    orgId: string,
    query: CapaQueryDto,
    userId: string,
    userRole: string,
  ): Promise<CapaListResponseDto> {
    const tp = this.prisma.forTenant(orgId);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Role-based scoping
    if (userRole === 'STORE_MANAGER' || userRole === 'DEPT_SUPERVISOR') {
      // Store users see only actions for their store
      const user = await tp.user.findFirst({
        where: { id: userId },
        select: { storeId: true },
      });
      if (user?.storeId) {
        where.storeId = user.storeId;
      } else {
        // User has no store, return empty
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
    }

    // Apply filters
    if (query.status) {
      where.status = query.status;
    }

    if (query.storeId) {
      where.storeId = query.storeId;
    }

    if (query.assignedToId) {
      where.assignedToId = query.assignedToId;
    }

    if (query.sourceType) {
      where.sourceType = query.sourceType;
    }

    if (query.overdue === true) {
      where.status = { in: [CorrectiveActionStatus.OVERDUE] };
    }

    if (query.dateFrom || query.dateTo) {
      where.dueDate = {};
      if (query.dateFrom) {
        where.dueDate.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.dueDate.lte = new Date(query.dateTo);
      }
    }

    // Execute query
    const [items, total] = await Promise.all([
      tp.correctiveAction.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          store: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      tp.correctiveAction.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((item) => this.mapToListItem(item)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find actions assigned to current user
   */
  async findMyActions(orgId: string, userId: string): Promise<CapaListItemDto[]> {
    const tp = this.prisma.forTenant(orgId);
    const actions = await tp.correctiveAction.findMany({
      where: {
        assignedToId: userId,
        status: {
          in: [
            CorrectiveActionStatus.PENDING,
            CorrectiveActionStatus.IN_PROGRESS,
            CorrectiveActionStatus.OVERDUE,
          ],
        },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return actions.map((item) => this.mapToListItem(item));
  }

  /**
   * Get dashboard statistics
   */
  async getDashboard(orgId: string, query: CapaQueryDto): Promise<CapaDashboardResponseDto> {
    const tp = this.prisma.forTenant(orgId);
    const where: any = {};

    // Apply filters
    if (query.storeId) where.storeId = query.storeId;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    // Get status summary
    const [
      pending,
      inProgress,
      completed,
      overdue,
      verified,
      allActions,
    ] = await Promise.all([
      tp.correctiveAction.count({
        where: { ...where, status: CorrectiveActionStatus.PENDING },
      }),
      tp.correctiveAction.count({
        where: { ...where, status: CorrectiveActionStatus.IN_PROGRESS },
      }),
      tp.correctiveAction.count({
        where: { ...where, status: CorrectiveActionStatus.COMPLETED },
      }),
      tp.correctiveAction.count({
        where: { ...where, status: CorrectiveActionStatus.OVERDUE },
      }),
      tp.correctiveAction.count({
        where: { ...where, status: CorrectiveActionStatus.VERIFIED },
      }),
      tp.correctiveAction.findMany({
        where,
        include: {
          store: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Calculate by store
    const storeMap = new Map<string, any>();
    allActions.forEach((action) => {
      const storeId = action.storeId;
      if (!storeId || !action.store) return;
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          storeId,
          storeName: action.store.name,
          totalActions: 0,
          pendingActions: 0,
          overdueActions: 0,
          completedActions: 0,
        });
      }
      const stats = storeMap.get(storeId);
      stats.totalActions++;
      if (action.status === CorrectiveActionStatus.PENDING) stats.pendingActions++;
      if (action.status === CorrectiveActionStatus.OVERDUE) stats.overdueActions++;
      if (
        action.status === CorrectiveActionStatus.COMPLETED ||
        action.status === CorrectiveActionStatus.VERIFIED
      ) {
        stats.completedActions++;
      }
    });

    const byStore = Array.from(storeMap.values()).map((stats) => ({
      storeId: stats.storeId,
      storeName: stats.storeName,
      totalActions: stats.totalActions,
      pendingActions: stats.pendingActions,
      overdueActions: stats.overdueActions,
      completionRate:
        stats.totalActions > 0
          ? Math.round((stats.completedActions / stats.totalActions) * 100)
          : 0,
    }));

    // Calculate by assignee
    const assigneeMap = new Map<string, any>();
    allActions.forEach((action) => {
      const userId = action.assignedToId;
      if (!assigneeMap.has(userId)) {
        assigneeMap.set(userId, {
          userId,
          userName: action.assignedTo.name,
          totalAssigned: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
        });
      }
      const stats = assigneeMap.get(userId);
      stats.totalAssigned++;
      if (
        action.status === CorrectiveActionStatus.COMPLETED ||
        action.status === CorrectiveActionStatus.VERIFIED
      ) {
        stats.completed++;
      }
      if (action.status === CorrectiveActionStatus.PENDING) stats.pending++;
      if (action.status === CorrectiveActionStatus.OVERDUE) stats.overdue++;
    });

    const byAssignee = Array.from(assigneeMap.values());

    // Calculate average resolution time
    const completedActions = allActions.filter(
      (a) =>
        a.completedAt &&
        (a.status === CorrectiveActionStatus.COMPLETED ||
          a.status === CorrectiveActionStatus.VERIFIED),
    );

    let avgResolutionTime = 0;
    if (completedActions.length > 0) {
      const totalResolutionTime = completedActions.reduce((sum, action) => {
        const createdAt = new Date(action.createdAt).getTime();
        const completedAt = new Date(action.completedAt!).getTime();
        return sum + (completedAt - createdAt);
      }, 0);
      avgResolutionTime = Math.round(
        totalResolutionTime / completedActions.length / (1000 * 60 * 60),
      ); // Convert to hours
    }

    return {
      statusSummary: {
        pending,
        inProgress,
        completed,
        overdue,
        verified,
      },
      byStore,
      byAssignee,
      avgResolutionTime,
      totalActions: allActions.length,
    };
  }

  /**
   * Find a single corrective action by ID
   */
  async findById(orgId: string, id: string): Promise<CapaDetailResponseDto> {
    const tp = this.prisma.forTenant(orgId);
    const action = await tp.correctiveAction.findFirst({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        verifiedBy: {
          select: { id: true, name: true, email: true },
        },
        finding: {
          select: { id: true, title: true, description: true, severity: true },
        },
      },
    });

    if (!action) {
      throw new NotFoundException('Corrective action not found');
    }

    return this.mapToDetailResponse(action);
  }

  /**
   * Update a corrective action
   */
  async update(
    orgId: string,
    id: string,
    dto: UpdateCorrectiveActionDto,
    userId: string,
    userRole: string,
  ): Promise<CapaDetailResponseDto> {
    const tp = this.prisma.forTenant(orgId);
    const existing = await tp.correctiveAction.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Corrective action not found');
    }

    // Validate status transitions
    if (dto.status) {
      this.validateStatusTransition(existing.status, dto.status, userRole);
    }

    // If marking as COMPLETED, require completion notes
    if (dto.status === CorrectiveActionStatus.COMPLETED && !dto.completionNotes) {
      throw new BadRequestException('Completion notes are required when marking as completed');
    }

    // Build update data
    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;

      // Set timestamps based on status
      if (dto.status === CorrectiveActionStatus.COMPLETED) {
        updateData.completedAt = new Date();
      } else if (dto.status === CorrectiveActionStatus.VERIFIED) {
        updateData.verifiedById = userId;
        updateData.verifiedAt = new Date();
        // Also set completedAt if not already set
        if (!existing.completedAt) {
          updateData.completedAt = new Date();
        }
      }
    }

    if (dto.completionNotes !== undefined) {
      updateData.completionNotes = dto.completionNotes;
    }

    if (dto.completionPhotoUrls !== undefined) {
      updateData.completionPhotoUrls = dto.completionPhotoUrls;
    }

    // Update the action
    const updated = await tp.correctiveAction.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        verifiedBy: {
          select: { id: true, name: true, email: true },
        },
        finding: {
          select: { id: true, title: true, description: true, severity: true },
        },
      },
    });

    // Log audit
    await this.auditService.log(orgId, {
      entityType: AuditEntityType.CORRECTIVE_ACTION,
      entityId: id,
      action: AuditAction.UPDATED,
      performedById: userId,
      performedByRole: userRole,
      previousValue: existing.status,
      newValue: updated.status,
      fieldChanged: 'status',
      notes: `Updated corrective action status from ${existing.status} to ${updated.status}`,
    });

    // Emit WebSocket events based on status change
    if (dto.status) {
      if (dto.status === CorrectiveActionStatus.COMPLETED) {
        if (updated.storeId) {
          this.eventsGateway.emitToStore(updated.storeId, 'capa:completed', updated, orgId);
        }
        this.eventsGateway.emitToHQ('capa:completed', updated, orgId);
        if (updated.createdById) {
          this.eventsGateway.emitToUser(updated.createdById, 'capa:completed', updated);
        }

        // Gamification: award points for completing CAPA
        await this.gamificationService.onActionCompleted(
          orgId,
          GamificationActionType.CAPA_COMPLETED,
          userId,
          'CORRECTIVE_ACTION',
          id,
        );
      } else if (dto.status === CorrectiveActionStatus.VERIFIED) {
        if (updated.storeId) {
          this.eventsGateway.emitToStore(updated.storeId, 'capa:verified', updated, orgId);
        }
        this.eventsGateway.emitToHQ('capa:verified', updated, orgId);
        this.eventsGateway.emitToUser(updated.assignedToId, 'capa:verified', updated);

        // Gamification: award points for verifying CAPA
        await this.gamificationService.onActionCompleted(
          orgId,
          GamificationActionType.CAPA_VERIFIED,
          userId,
          'CORRECTIVE_ACTION',
          id,
        );
      }
    }

    return this.mapToDetailResponse(updated);
  }

  /**
   * Create corrective action from audit finding
   */
  async createFromAuditFinding(
    orgId: string,
    findingId: string,
    data: {
      assignedToId: string;
      dueDate: string;
      description: string;
      createdById: string;
      title?: string;
    },
  ): Promise<CapaDetailResponseDto> {
    const tp = this.prisma.forTenant(orgId);
    const finding = await this.prisma.auditFinding.findUnique({
      where: { id: findingId },
      include: {
        storeAudit: {
          select: { storeId: true },
        },
      },
    });

    if (!finding) {
      throw new NotFoundException('Audit finding not found');
    }

    const storeId = finding.storeAudit.storeId;

    const action = await tp.correctiveAction.create({
      data: {
        sourceType: CAPASourceType.AUDIT_FINDING,
        sourceId: findingId,
        findingId,
        title: data.title || `Corrective action for finding: ${finding.title}`,
        description: data.description,
        assignedToId: data.assignedToId,
        storeId,
        dueDate: new Date(data.dueDate),
        priority: this.mapSeverityToPriority(finding.severity),
        status: CorrectiveActionStatus.PENDING,
        createdById: data.createdById,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        finding: {
          select: { id: true, title: true, description: true, severity: true },
        },
      },
    });

    // Log audit
    await this.auditService.log(orgId, {
      entityType: AuditEntityType.CORRECTIVE_ACTION,
      entityId: action.id,
      action: AuditAction.CREATED,
      performedById: data.createdById,
      performedByRole: 'OPERATIONS_MANAGER',
      notes: `Auto-created corrective action from audit finding ${findingId}`,
    });

    // Emit events
    this.eventsGateway.emitToUser(data.assignedToId, 'capa:created', action);
    this.eventsGateway.emitToStore(storeId, 'capa:created', action, orgId);
    this.eventsGateway.emitToHQ('capa:created', action, orgId);

    this.logger.log(
      `Created corrective action ${action.id} from audit finding ${findingId}`,
    );

    return this.mapToDetailResponse(action);
  }

  /**
   * Create corrective action from checklist failure
   */
  async createFromChecklistFailure(
    orgId: string,
    submissionId: string,
    failedItems: string[],
    storeId: string,
    createdById: string,
  ): Promise<CapaDetailResponseDto | null> {
    const tp = this.prisma.forTenant(orgId);
    // Look up store manager
    const manager = await tp.user.findFirst({
      where: {
        storeId,
        role: 'STORE_MANAGER',
        isActive: true,
      },
    });

    if (!manager) {
      this.logger.warn(
        `No active store manager found for store ${storeId}, skipping CAPA creation`,
      );
      return null;
    }

    // Create description from failed items
    const description = `Corrective action required for failed checklist items:\n${failedItems.join('\n')}`;

    // Set due date to 3 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const action = await tp.correctiveAction.create({
      data: {
        sourceType: CAPASourceType.CHECKLIST_FAILURE,
        sourceId: submissionId,
        title: 'Checklist Failure - Corrective Action Required',
        description,
        assignedToId: manager.id,
        storeId,
        dueDate,
        priority: Priority.HIGH,
        status: CorrectiveActionStatus.PENDING,
        createdById,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log audit
    await this.auditService.log(orgId, {
      entityType: AuditEntityType.CORRECTIVE_ACTION,
      entityId: action.id,
      action: AuditAction.CREATED,
      performedById: createdById,
      performedByRole: 'OPERATIONS_MANAGER',
      notes: `Auto-created corrective action from checklist failure ${submissionId}`,
    });

    // Emit events
    this.eventsGateway.emitToUser(manager.id, 'capa:created', action);
    this.eventsGateway.emitToStore(storeId, 'capa:created', action, orgId);
    this.eventsGateway.emitToHQ('capa:created', action, orgId);

    this.logger.log(
      `Created corrective action ${action.id} from checklist failure ${submissionId}`,
    );

    return this.mapToDetailResponse(action);
  }

  /**
   * Create corrective action from issue
   */
  async createFromIssue(
    orgId: string,
    issueId: string,
    storeId: string,
    createdById: string,
  ): Promise<CapaDetailResponseDto | null> {
    const tp = this.prisma.forTenant(orgId);
    const issue = await tp.issue.findFirst({
      where: { id: issueId },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    // Look up store manager
    const manager = await tp.user.findFirst({
      where: {
        storeId,
        role: 'STORE_MANAGER',
        isActive: true,
      },
    });

    if (!manager) {
      this.logger.warn(
        `No active store manager found for store ${storeId}, skipping CAPA creation`,
      );
      return null;
    }

    // Set due date to 5 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    const action = await tp.correctiveAction.create({
      data: {
        sourceType: CAPASourceType.ISSUE,
        sourceId: issueId,
        title: `Corrective Action: ${issue.title}`,
        description: issue.description,
        assignedToId: manager.id,
        storeId,
        dueDate,
        priority: issue.priority,
        status: CorrectiveActionStatus.PENDING,
        createdById,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log audit
    await this.auditService.log(orgId, {
      entityType: AuditEntityType.CORRECTIVE_ACTION,
      entityId: action.id,
      action: AuditAction.CREATED,
      performedById: createdById,
      performedByRole: 'OPERATIONS_MANAGER',
      notes: `Auto-created corrective action from issue ${issueId}`,
    });

    // Emit events
    this.eventsGateway.emitToUser(manager.id, 'capa:created', action);
    this.eventsGateway.emitToStore(storeId, 'capa:created', action, orgId);
    this.eventsGateway.emitToHQ('capa:created', action, orgId);

    this.logger.log(`Created corrective action ${action.id} from issue ${issueId}`);

    return this.mapToDetailResponse(action);
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private validateStatusTransition(
    currentStatus: CorrectiveActionStatus,
    newStatus: CorrectiveActionStatus,
    userRole: string,
  ): void {
    // Define allowed transitions
    const allowedTransitions: Record<
      CorrectiveActionStatus,
      CorrectiveActionStatus[]
    > = {
      [CorrectiveActionStatus.PENDING]: [CorrectiveActionStatus.IN_PROGRESS],
      [CorrectiveActionStatus.IN_PROGRESS]: [CorrectiveActionStatus.COMPLETED],
      [CorrectiveActionStatus.COMPLETED]: [CorrectiveActionStatus.VERIFIED],
      [CorrectiveActionStatus.OVERDUE]: [
        CorrectiveActionStatus.IN_PROGRESS,
        CorrectiveActionStatus.COMPLETED,
      ],
      [CorrectiveActionStatus.VERIFIED]: [], // Final state
    };

    const allowed = allowedTransitions[currentStatus] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }

    // Only HQ roles can verify
    if (
      newStatus === CorrectiveActionStatus.VERIFIED &&
      userRole !== 'OPERATIONS_MANAGER' &&
      userRole !== 'HQ_TEAM' &&
      userRole !== 'REGIONAL_SUPERVISOR'
    ) {
      throw new ForbiddenException('Only HQ roles can verify corrective actions');
    }
  }

  private mapSeverityToPriority(severity: string): Priority {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return Priority.HIGH;
      case 'MEDIUM':
        return Priority.MEDIUM;
      case 'LOW':
        return Priority.LOW;
      default:
        return Priority.MEDIUM;
    }
  }

  private mapToDetailResponse(action: any): CapaDetailResponseDto {
    return {
      id: action.id,
      findingId: action.findingId,
      finding: action.finding,
      sourceType: action.sourceType,
      sourceId: action.sourceId,
      title: action.title,
      storeId: action.storeId,
      store: action.store,
      priority: action.priority,
      assignedToId: action.assignedToId,
      assignedTo: action.assignedTo,
      createdById: action.createdById,
      createdBy: action.createdBy,
      dueDate: action.dueDate,
      status: action.status,
      description: action.description,
      completionNotes: action.completionNotes,
      completionPhotoUrls: action.completionPhotoUrls,
      completedAt: action.completedAt,
      verifiedById: action.verifiedById,
      verifiedBy: action.verifiedBy,
      verifiedAt: action.verifiedAt,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    };
  }

  private mapToListItem(action: any): CapaListItemDto {
    const now = new Date();
    const dueDate = new Date(action.dueDate);
    const isOverdue =
      now > dueDate &&
      (action.status === CorrectiveActionStatus.PENDING ||
        action.status === CorrectiveActionStatus.IN_PROGRESS ||
        action.status === CorrectiveActionStatus.OVERDUE);

    return {
      id: action.id,
      title: action.title,
      sourceType: action.sourceType,
      priority: action.priority,
      status: action.status,
      dueDate: action.dueDate,
      storeId: action.storeId,
      store: action.store,
      assignedTo: action.assignedTo,
      createdBy: action.createdBy,
      completedAt: action.completedAt,
      createdAt: action.createdAt,
      isOverdue,
    };
  }
}
