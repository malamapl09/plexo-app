import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { VerificationService } from '../verification/verification.service';
import { GamificationService } from '../gamification/gamification.service';
import { GamificationActionType } from '@prisma/client';
import { CreateTaskDto, DistributionType, Priority } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { TaskQueryDto, TaskStatus } from './dto/task-query.dto';
import {
  TaskResponse,
  TaskListResponse,
  ComplianceDashboardResponse,
  ComplianceStats,
  StoreComplianceStats,
} from './dto/task-response.dto';
import { TaskStatus as PrismaTaskStatus, Priority as PrismaPriority, DistributionType as PrismaDistributionType } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
    private verificationService: VerificationService,
    private gamificationService: GamificationService,
  ) {}

  /**
   * Get template defaults for task creation
   */
  private async getTemplateDefaults(orgId: string, templateId: string): Promise<{
    description?: string;
    departmentId?: string;
    priority?: Priority;
    scheduledTime?: string;
    dueTime?: string;
    distributionType?: DistributionType;
    regionIds?: string[];
    storeIds?: string[];
    isRecurring?: boolean;
    recurringRule?: any;
  } | null> {
    const tp = this.prisma.forTenant(orgId);
    const template = await tp.taskTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      return null;
    }

    // Convert HH:mm to ISO date string for today
    const today = new Date();
    let scheduledTime: string | undefined;
    let dueTime: string | undefined;

    if (template.defaultScheduledTime) {
      const [hours, minutes] = template.defaultScheduledTime.split(':');
      const scheduled = new Date(today);
      scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      scheduledTime = scheduled.toISOString();
    }

    if (template.defaultDueTime) {
      const [hours, minutes] = template.defaultDueTime.split(':');
      const due = new Date(today);
      due.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      dueTime = due.toISOString();
    }

    return {
      description: template.description || undefined,
      departmentId: template.departmentId || undefined,
      priority: template.priority as Priority,
      scheduledTime,
      dueTime,
      distributionType: template.distributionType as DistributionType,
      regionIds: template.defaultRegionIds || undefined,
      storeIds: template.defaultStoreIds || undefined,
      isRecurring: template.isRecurring,
      recurringRule: template.recurringRule,
    };
  }

  /**
   * Create a new task and distribute to stores
   * If templateId is provided, template defaults are merged with explicit values
   */
  async create(orgId: string, createTaskDto: CreateTaskDto, createdById: string, createdByRole: string): Promise<TaskResponse> {
    const tp = this.prisma.forTenant(orgId);
    let {
      title,
      description,
      departmentId,
      priority,
      scheduledTime,
      dueTime,
      distributionType,
      regionIds,
      storeIds,
      templateId,
      isRecurring,
      recurringRule,
    } = createTaskDto;

    // If templateId is provided, merge template defaults with explicit values
    if (templateId) {
      const templateDefaults = await this.getTemplateDefaults(orgId, templateId);
      if (templateDefaults) {
        // Explicit values override template defaults
        description = description ?? templateDefaults.description;
        departmentId = departmentId ?? templateDefaults.departmentId;
        priority = priority ?? templateDefaults.priority;
        scheduledTime = scheduledTime ?? templateDefaults.scheduledTime;
        dueTime = dueTime ?? templateDefaults.dueTime;
        distributionType = distributionType ?? templateDefaults.distributionType;
        regionIds = regionIds ?? templateDefaults.regionIds;
        storeIds = storeIds ?? templateDefaults.storeIds;
        isRecurring = isRecurring ?? templateDefaults.isRecurring;
        recurringRule = recurringRule ?? templateDefaults.recurringRule;
      }
    }

    // Get stores based on distribution type
    let targetStoreIds: string[] = [];

    switch (distributionType) {
      case DistributionType.ALL_STORES:
        const allStores = await tp.store.findMany({
          where: { isActive: true },
          select: { id: true },
        });
        targetStoreIds = allStores.map((s) => s.id);
        break;

      case DistributionType.BY_REGION:
        if (!regionIds || regionIds.length === 0) {
          throw new BadRequestException('Se requieren IDs de regiones para distribución por región');
        }
        const regionStores = await tp.store.findMany({
          where: {
            isActive: true,
            regionId: { in: regionIds },
          },
          select: { id: true },
        });
        targetStoreIds = regionStores.map((s) => s.id);
        break;

      case DistributionType.SPECIFIC_STORES:
        if (!storeIds || storeIds.length === 0) {
          throw new BadRequestException('Se requieren IDs de tiendas para distribución específica');
        }
        targetStoreIds = storeIds;
        break;
    }

    if (targetStoreIds.length === 0) {
      throw new BadRequestException('No se encontraron tiendas para asignar la tarea');
    }

    // Create task with assignments
    const task = await tp.task.create({
      data: {
        title,
        description,
        departmentId,
        priority: priority as PrismaPriority,
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        dueTime: dueTime ? new Date(dueTime) : null,
        createdById,
        templateId,
        isRecurring: isRecurring || false,
        recurringRule: recurringRule || undefined,
        assignments: {
          create: targetStoreIds.map((storeId) => ({
            storeId,
            status: 'PENDING' as PrismaTaskStatus,
          })),
        },
      },
      include: {
        department: true,
        createdBy: {
          select: { id: true, name: true },
        },
        assignments: {
          include: {
            store: {
              select: { id: true, name: true, code: true },
            },
            completedBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const formattedTask = this.formatTaskResponse(task);

    // Emit WebSocket event
    this.eventsGateway.emitTaskCreated(formattedTask, targetStoreIds);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'TASK',
      entityId: task.id,
      action: 'CREATED',
      performedById: createdById,
      performedByRole: createdByRole,
      newValue: { title, priority, storeCount: targetStoreIds.length },
    });

    return formattedTask;
  }

  /**
   * Find tasks with filters
   */
  async findAll(orgId: string, query: TaskQueryDto, userId: string, userRole: string, userStoreId?: string): Promise<TaskListResponse> {
    const tp = this.prisma.forTenant(orgId);
    const {
      storeId,
      regionId,
      departmentId,
      status,
      priority,
      date,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query;

    // Build date filter
    let dateFilter: any = {};
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      dateFilter = {
        createdAt: {
          gte: targetDate,
          lt: nextDay,
        },
      };
    } else if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    // Build store filter based on user role
    let storeFilter: any = {};
    if (userRole === 'STORE_MANAGER' || userRole === 'DEPT_SUPERVISOR') {
      // Store-level users can only see their store's tasks
      storeFilter = { storeId: userStoreId };
    } else if (storeId) {
      storeFilter = { storeId };
    } else if (regionId) {
      const regionStores = await tp.store.findMany({
        where: { regionId },
        select: { id: true },
      });
      storeFilter = { storeId: { in: regionStores.map((s) => s.id) } };
    }

    // Build status filter
    let statusFilter: any = {};
    if (status) {
      statusFilter = { status: status as PrismaTaskStatus };
    }

    // Count total
    const total = await tp.task.count({
      where: {
        departmentId,
        priority: priority as PrismaPriority,
        ...dateFilter,
        assignments: {
          some: {
            ...storeFilter,
            ...statusFilter,
          },
        },
      },
    });

    // Get tasks
    const tasks = await tp.task.findMany({
      where: {
        departmentId,
        priority: priority as PrismaPriority,
        ...dateFilter,
        assignments: {
          some: {
            ...storeFilter,
            ...statusFilter,
          },
        },
      },
      include: {
        department: true,
        createdBy: {
          select: { id: true, name: true },
        },
        assignments: {
          where: {
            ...storeFilter,
            ...statusFilter,
          },
          include: {
            store: {
              select: { id: true, name: true, code: true },
            },
            completedBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { store: { name: 'asc' } },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledTime: 'asc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      tasks: tasks.map((t) => this.formatTaskResponse(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single task by ID
   */
  async findOne(orgId: string, id: string, userId: string, userRole: string, userStoreId?: string): Promise<TaskResponse> {
    const tp = this.prisma.forTenant(orgId);
    const task = await tp.task.findUnique({
      where: { id },
      include: {
        department: true,
        createdBy: {
          select: { id: true, name: true },
        },
        assignments: {
          include: {
            store: {
              select: { id: true, name: true, code: true },
            },
            completedBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { store: { name: 'asc' } },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    // Filter assignments for store-level users
    if (userRole === 'STORE_MANAGER' || userRole === 'DEPT_SUPERVISOR') {
      task.assignments = task.assignments.filter((a) => a.storeId === userStoreId);
    }

    return this.formatTaskResponse(task);
  }

  /**
   * Update a task
   */
  async update(orgId: string, id: string, updateTaskDto: UpdateTaskDto, userId: string, userRole: string): Promise<TaskResponse> {
    const tp = this.prisma.forTenant(orgId);
    const task = await tp.task.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    const updated = await tp.task.update({
      where: { id },
      data: {
        ...updateTaskDto,
        priority: updateTaskDto.priority as PrismaPriority,
        scheduledTime: updateTaskDto.scheduledTime ? new Date(updateTaskDto.scheduledTime) : undefined,
        dueTime: updateTaskDto.dueTime ? new Date(updateTaskDto.dueTime) : undefined,
      },
      include: {
        department: true,
        createdBy: {
          select: { id: true, name: true },
        },
        assignments: {
          include: {
            store: {
              select: { id: true, name: true, code: true },
            },
            completedBy: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    const formattedTask = this.formatTaskResponse(updated);

    // Emit WebSocket event to all affected stores
    updated.assignments.forEach((assignment) => {
      this.eventsGateway.emitTaskUpdated({ ...formattedTask, storeId: assignment.storeId });
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'TASK',
      entityId: id,
      action: 'UPDATED',
      performedById: userId,
      performedByRole: userRole,
      newValue: updateTaskDto,
    });

    return formattedTask;
  }

  /**
   * Delete a task
   */
  async remove(orgId: string, id: string, userId: string, userRole: string): Promise<void> {
    const tp = this.prisma.forTenant(orgId);
    const task = await tp.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Tarea no encontrada');
    }

    await tp.task.delete({
      where: { id },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'TASK',
      entityId: id,
      action: 'DELETED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { title: task.title, priority: task.priority },
    });
  }

  /**
   * Complete a task assignment
   * Depending on the user's role, this may set the task to PENDING_VERIFICATION or VERIFIED
   */
  async completeTask(
    orgId: string,
    taskId: string,
    storeId: string,
    completeTaskDto: CompleteTaskDto,
    completedById: string,
    completedByRole: string,
  ): Promise<TaskResponse> {
    const tp = this.prisma.forTenant(orgId);
    // Find the assignment
    const assignment = await tp.taskAssignment.findUnique({
      where: {
        taskId_storeId: { taskId, storeId },
      },
      include: {
        task: { select: { id: true, title: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación de tarea no encontrada');
    }

    if (assignment.status === 'COMPLETED' || assignment.status === 'VERIFIED') {
      throw new BadRequestException('Esta tarea ya fue completada');
    }

    if (assignment.status === 'PENDING_VERIFICATION') {
      throw new BadRequestException('Esta tarea ya está pendiente de verificación');
    }

    const previousState = { ...assignment };
    const requiresVerification = await this.verificationService.requiresVerification(orgId, completedByRole);

    // Determine status based on role
    const newStatus: PrismaTaskStatus = requiresVerification ? 'PENDING_VERIFICATION' : 'VERIFIED';
    const verificationStatus = requiresVerification ? 'PENDING' : 'VERIFIED';

    // Update assignment
    const updated = await tp.taskAssignment.update({
      where: { id: assignment.id },
      data: {
        status: newStatus,
        completedAt: new Date(),
        completedById,
        notes: completeTaskDto.notes,
        photoUrls: completeTaskDto.photoUrls || [],
        verificationStatus: verificationStatus as any,
        // If auto-verified (OPERATIONS_MANAGER), set verification fields
        ...(requiresVerification
          ? {}
          : {
              verifiedById: completedById,
              verifiedAt: new Date(),
            }),
      },
    });

    // Log audit entry
    await this.auditService.log(orgId, {
      entityType: 'TASK_ASSIGNMENT',
      entityId: assignment.id,
      action: requiresVerification ? 'VERIFICATION_SUBMITTED' : 'VERIFIED',
      performedById: completedById,
      performedByRole: completedByRole,
      previousValue: previousState,
      newValue: updated,
      fieldChanged: 'status',
      notes: completeTaskDto.notes,
    });

    // Create verification record
    await tp.verification.create({
      data: {
        entityType: 'TASK_ASSIGNMENT',
        entityId: assignment.id,
        submittedById: completedById,
        submittedByRole: completedByRole,
        submittedAt: new Date(),
        status: verificationStatus as any,
        // If auto-verified, set verification fields
        ...(requiresVerification
          ? {}
          : {
              verifiedById: completedById,
              verifiedByRole: completedByRole,
              verifiedAt: new Date(),
            }),
      },
    });

    const completedTask = await this.findOne(orgId, taskId, completedById, 'STORE_MANAGER', storeId);

    // Emit appropriate WebSocket event
    if (requiresVerification) {
      this.eventsGateway.emitVerificationPending({
        entityType: 'TASK_ASSIGNMENT',
        entityId: assignment.id,
        task: completedTask,
        storeId,
        submittedByRole: completedByRole,
      });
    } else {
      this.eventsGateway.emitTaskCompleted({ ...completedTask, storeId });
    }

    // Also emit compliance update
    const today = new Date().toISOString().split('T')[0];
    const compliance = await this.getStoreProgress(orgId, storeId, today);
    this.eventsGateway.emitComplianceUpdate(storeId, compliance);

    // Gamification: award points for task completion
    // If previously rejected, this is a resubmission (50% quality multiplier)
    const isFirstAttempt = assignment.verificationStatus !== 'REJECTED';
    await this.gamificationService.onActionCompleted(
      orgId,
      GamificationActionType.TASK_COMPLETED,
      completedById,
      'TASK_ASSIGNMENT',
      assignment.id,
      isFirstAttempt,
    );

    // Bonus points if completed on time
    const taskRecord = await tp.task.findUnique({
      where: { id: taskId },
      select: { dueTime: true },
    });
    if (taskRecord?.dueTime && updated.completedAt && updated.completedAt <= taskRecord.dueTime) {
      await this.gamificationService.onActionCompleted(
        orgId,
        GamificationActionType.ON_TIME_COMPLETION,
        completedById,
        'TASK_ASSIGNMENT',
        assignment.id,
        isFirstAttempt,
      );
    }

    return completedTask;
  }

  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(
    orgId: string,
    date: string,
    regionId?: string,
  ): Promise<ComplianceDashboardResponse> {
    const tp = this.prisma.forTenant(orgId);
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get stores
    let storeFilter: any = { isActive: true };
    if (regionId) {
      storeFilter.regionId = regionId;
    }

    const stores = await tp.store.findMany({
      where: storeFilter,
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });

    // Get all assignments for the date
    const assignments = await tp.taskAssignment.findMany({
      where: {
        storeId: { in: stores.map((s) => s.id) },
        task: {
          createdAt: {
            gte: targetDate,
            lt: nextDay,
          },
        },
      },
      include: {
        task: true,
      },
    });

    // Calculate overall stats
    const overall = this.calculateStats(assignments);

    // Calculate per-store stats
    const byStore: StoreComplianceStats[] = stores.map((store) => {
      const storeAssignments = assignments.filter((a) => a.storeId === store.id);
      return {
        storeId: store.id,
        storeName: store.name,
        storeCode: store.code,
        stats: this.calculateStats(storeAssignments),
      };
    });

    return {
      overall,
      byStore,
      date,
    };
  }

  /**
   * Get tasks for a specific store (mobile app)
   */
  async getStoreTasks(
    orgId: string,
    storeId: string,
    date: string,
    departmentId?: string,
  ): Promise<TaskListResponse> {
    const tp = this.prisma.forTenant(orgId);
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const whereClause: any = {
      storeId,
      task: {
        createdAt: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    };

    if (departmentId) {
      whereClause.task.departmentId = departmentId;
    }

    const assignments = await tp.taskAssignment.findMany({
      where: whereClause,
      include: {
        task: {
          include: {
            department: true,
            createdBy: {
              select: { id: true, name: true },
            },
          },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
        completedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { task: { priority: 'desc' } },
        { task: { scheduledTime: 'asc' } },
      ],
    });

    // Transform to TaskResponse format
    const tasks = assignments.map((a) => ({
      id: a.task.id,
      title: a.task.title,
      description: a.task.description,
      department: a.task.department,
      priority: a.task.priority,
      scheduledTime: a.task.scheduledTime,
      dueTime: a.task.dueTime,
      createdBy: a.task.createdBy,
      isRecurring: a.task.isRecurring,
      createdAt: a.task.createdAt,
      assignments: [
        {
          id: a.id,
          storeId: a.storeId,
          store: a.store,
          status: a.status,
          assignedAt: a.assignedAt,
          completedAt: a.completedAt,
          completedBy: a.completedBy,
          notes: a.notes,
          photoUrls: a.photoUrls,
        },
      ],
    }));

    return {
      tasks,
      total: tasks.length,
      page: 1,
      limit: tasks.length,
      totalPages: 1,
    };
  }

  /**
   * Get progress stats for a store
   */
  async getStoreProgress(orgId: string, storeId: string, date: string): Promise<ComplianceStats> {
    const tp = this.prisma.forTenant(orgId);
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const assignments = await tp.taskAssignment.findMany({
      where: {
        storeId,
        task: {
          createdAt: {
            gte: targetDate,
            lt: nextDay,
          },
        },
      },
      include: {
        task: true,
      },
    });

    return this.calculateStats(assignments);
  }

  // ==================== Helper Methods ====================

  private calculateStats(assignments: any[]): ComplianceStats {
    const total = assignments.length;
    const completed = assignments.filter((a) => a.status === 'COMPLETED').length;
    const overdue = assignments.filter(
      (a) => a.status !== 'COMPLETED' && a.task.dueTime && new Date(a.task.dueTime) < new Date(),
    ).length;
    const pending = total - completed - overdue;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100 * 10) / 10 : 0,
    };
  }

  private formatTaskResponse(task: any): TaskResponse {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      department: task.department
        ? {
            id: task.department.id,
            name: task.department.name,
            code: task.department.code,
          }
        : undefined,
      priority: task.priority,
      scheduledTime: task.scheduledTime,
      dueTime: task.dueTime,
      createdBy: task.createdBy,
      isRecurring: task.isRecurring,
      createdAt: task.createdAt,
      assignments: task.assignments?.map((a: any) => ({
        id: a.id,
        storeId: a.storeId,
        store: a.store,
        status: a.status,
        assignedAt: a.assignedAt,
        completedAt: a.completedAt,
        completedBy: a.completedBy,
        notes: a.notes,
        photoUrls: a.photoUrls,
      })),
    };
  }
}
