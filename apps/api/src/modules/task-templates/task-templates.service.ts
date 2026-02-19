import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTaskTemplateDto,
  Priority,
  DistributionType,
} from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';
import {
  TaskTemplateResponse,
  TaskTemplateListResponse,
} from './dto/task-template-response.dto';
import {
  Priority as PrismaPriority,
  DistributionType as PrismaDistributionType,
} from '@prisma/client';

@Injectable()
export class TaskTemplatesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new task template
   */
  async create(
    orgId: string,
    createDto: CreateTaskTemplateDto,
    createdById: string,
  ): Promise<TaskTemplateResponse> {
    const tp = this.prisma.forTenant(orgId);
    const template = await tp.taskTemplate.create({
      data: {
        name: createDto.name,
        description: createDto.description,
        departmentId: createDto.departmentId,
        priority: (createDto.priority || Priority.MEDIUM) as PrismaPriority,
        defaultScheduledTime: createDto.defaultScheduledTime,
        defaultDueTime: createDto.defaultDueTime,
        distributionType: (createDto.distributionType ||
          DistributionType.ALL_STORES) as PrismaDistributionType,
        defaultRegionIds: createDto.defaultRegionIds || [],
        defaultStoreIds: createDto.defaultStoreIds || [],
        isRecurring: createDto.isRecurring || false,
        recurringRule: createDto.recurringRule || undefined,
        createdById,
      },
      include: {
        department: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return this.formatTemplateResponse(template);
  }

  /**
   * Find all templates with optional filters
   */
  async findAll(
    orgId: string,
    page = 1,
    limit = 20,
    isActive?: boolean,
    departmentId?: string,
    search?: string,
  ): Promise<TaskTemplateListResponse> {
    const tp = this.prisma.forTenant(orgId);
    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      tp.taskTemplate.findMany({
        where,
        include: {
          department: true,
          createdBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      tp.taskTemplate.count({ where }),
    ]);

    return {
      templates: templates.map((t) => this.formatTemplateResponse(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single template by ID
   */
  async findOne(orgId: string, id: string): Promise<TaskTemplateResponse> {
    const tp = this.prisma.forTenant(orgId);
    const template = await tp.taskTemplate.findUnique({
      where: { id },
      include: {
        department: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    return this.formatTemplateResponse(template);
  }

  /**
   * Update a template
   */
  async update(
    orgId: string,
    id: string,
    updateDto: UpdateTaskTemplateDto,
  ): Promise<TaskTemplateResponse> {
    const tp = this.prisma.forTenant(orgId);
    const existing = await tp.taskTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const updated = await tp.taskTemplate.update({
      where: { id },
      data: {
        name: updateDto.name,
        description: updateDto.description,
        departmentId: updateDto.departmentId,
        priority: updateDto.priority as PrismaPriority,
        defaultScheduledTime: updateDto.defaultScheduledTime,
        defaultDueTime: updateDto.defaultDueTime,
        distributionType: updateDto.distributionType as PrismaDistributionType,
        defaultRegionIds: updateDto.defaultRegionIds,
        defaultStoreIds: updateDto.defaultStoreIds,
        isRecurring: updateDto.isRecurring,
        recurringRule: updateDto.recurringRule,
        isActive: updateDto.isActive,
      },
      include: {
        department: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    return this.formatTemplateResponse(updated);
  }

  /**
   * Soft delete a template (set isActive to false)
   */
  async remove(orgId: string, id: string): Promise<void> {
    const tp = this.prisma.forTenant(orgId);
    const existing = await tp.taskTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    await tp.taskTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get template defaults for creating a task
   * Returns the template data that can be used to pre-fill task creation form
   */
  async getTemplateDefaults(orgId: string, id: string): Promise<{
    title: string;
    description?: string;
    departmentId?: string;
    priority: string;
    scheduledTime?: string;
    dueTime?: string;
    distributionType: string;
    regionIds?: string[];
    storeIds?: string[];
    isRecurring: boolean;
    recurringRule?: Record<string, any>;
  }> {
    const template = await this.findOne(orgId, id);

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
      title: template.name,
      description: template.description,
      departmentId: template.department?.id,
      priority: template.priority,
      scheduledTime,
      dueTime,
      distributionType: template.distributionType,
      regionIds: template.defaultRegionIds,
      storeIds: template.defaultStoreIds,
      isRecurring: template.isRecurring,
      recurringRule: template.recurringRule,
    };
  }

  // ==================== Helper Methods ====================

  private formatTemplateResponse(template: any): TaskTemplateResponse {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      department: template.department
        ? {
            id: template.department.id,
            name: template.department.name,
            code: template.department.code,
          }
        : undefined,
      priority: template.priority,
      defaultScheduledTime: template.defaultScheduledTime,
      defaultDueTime: template.defaultDueTime,
      distributionType: template.distributionType,
      defaultRegionIds: template.defaultRegionIds || [],
      defaultStoreIds: template.defaultStoreIds || [],
      isRecurring: template.isRecurring,
      recurringRule: template.recurringRule,
      isActive: template.isActive,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}
