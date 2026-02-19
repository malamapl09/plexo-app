import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { CorrectiveActionsService } from '../corrective-actions/corrective-actions.service';
import { GamificationService } from '../gamification/gamification.service';
import { GamificationActionType } from '@prisma/client';
import {
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
  RespondChecklistItemDto,
  ChecklistQueryDto,
  SubmissionQueryDto,
  ChecklistTemplateResponse,
  ChecklistTemplateListResponse,
  ChecklistSubmissionResponse,
  ChecklistSubmissionListResponse,
  ChecklistDashboardResponse,
} from './dto';

@Injectable()
export class ChecklistsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
    private correctiveActionsService: CorrectiveActionsService,
    private gamificationService: GamificationService,
  ) {}

  // ==================== Templates ====================

  async createTemplate(
    orgId: string,
    dto: CreateChecklistTemplateDto,
    userId: string,
    userRole: string,
  ): Promise<ChecklistTemplateResponse> {
    const tp = this.prisma.forTenant(orgId);
    const template = await tp.checklistTemplate.create({
      data: {
        title: dto.title,
        description: dto.description,
        departmentId: dto.departmentId,
        frequency: dto.frequency as any,
        scope: dto.scope || 'ALL',
        targetStoreIds: dto.targetStoreIds || [],
        targetRegionIds: dto.targetRegionIds || [],
        createdById: userId,
        items: {
          create: dto.items.map((item) => ({
            order: item.order,
            title: item.title,
            description: item.description,
            requiresPhoto: item.requiresPhoto || false,
            requiresNote: item.requiresNote || false,
          })),
        },
      },
      include: {
        items: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    await this.auditService.log(orgId, {
      entityType: 'CHECKLIST',
      entityId: template.id,
      action: 'CREATED',
      performedById: userId,
      performedByRole: userRole,
      newValue: { title: template.title, frequency: template.frequency },
    });

    return this.formatTemplateResponse(template);
  }

  async findAllTemplates(
    orgId: string,
    query: ChecklistQueryDto,
  ): Promise<ChecklistTemplateListResponse> {
    const tp = this.prisma.forTenant(orgId);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = { isActive: true };

    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.frequency) where.frequency = query.frequency;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [templates, total] = await Promise.all([
      tp.checklistTemplate.findMany({
        where,
        include: {
          items: { orderBy: { order: 'asc' } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      tp.checklistTemplate.count({ where }),
    ]);

    return {
      templates: templates.map((t) => this.formatTemplateResponse(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneTemplate(orgId: string, id: string): Promise<ChecklistTemplateResponse> {
    const tp = this.prisma.forTenant(orgId);
    const template = await tp.checklistTemplate.findUnique({
      where: { id },
      include: {
        items: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!template) {
      throw new NotFoundException('Checklist no encontrado');
    }

    return this.formatTemplateResponse(template);
  }

  async updateTemplate(
    orgId: string,
    id: string,
    dto: UpdateChecklistTemplateDto,
    userId: string,
    userRole: string,
  ): Promise<ChecklistTemplateResponse> {
    const tp = this.prisma.forTenant(orgId);
    const existing = await tp.checklistTemplate.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Checklist no encontrado');

    // If items are provided, delete existing and recreate
    const updateData: any = {
      title: dto.title,
      description: dto.description,
      departmentId: dto.departmentId,
      frequency: dto.frequency as any,
      scope: dto.scope,
      targetStoreIds: dto.targetStoreIds,
      targetRegionIds: dto.targetRegionIds,
    };

    if (dto.items) {
      await tp.checklistItem.deleteMany({ where: { templateId: id } });
      updateData.items = {
        create: dto.items.map((item) => ({
          order: item.order,
          title: item.title,
          description: item.description,
          requiresPhoto: item.requiresPhoto || false,
          requiresNote: item.requiresNote || false,
        })),
      };
    }

    const template = await tp.checklistTemplate.update({
      where: { id },
      data: updateData,
      include: {
        items: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    await this.auditService.log(orgId, {
      entityType: 'CHECKLIST',
      entityId: id,
      action: 'UPDATED',
      performedById: userId,
      performedByRole: userRole,
    });

    return this.formatTemplateResponse(template);
  }

  async removeTemplate(
    orgId: string,
    id: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const tp = this.prisma.forTenant(orgId);
    const existing = await tp.checklistTemplate.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Checklist no encontrado');

    await tp.checklistTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.log(orgId, {
      entityType: 'CHECKLIST',
      entityId: id,
      action: 'DELETED',
      performedById: userId,
      performedByRole: userRole,
    });
  }

  // ==================== Store Checklists (Mobile) ====================

  async getStoreChecklists(
    orgId: string,
    storeId: string,
  ): Promise<ChecklistTemplateResponse[]> {
    const tp = this.prisma.forTenant(orgId);
    // Get store's region
    const store = await tp.store.findUnique({
      where: { id: storeId },
      select: { regionId: true },
    });

    // Find templates that target this store
    const templates = await tp.checklistTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { scope: 'ALL' },
          { scope: 'STORES', targetStoreIds: { has: storeId } },
          ...(store?.regionId
            ? [{ scope: 'REGIONS', targetRegionIds: { has: store.regionId } }]
            : []),
        ],
      },
      include: {
        items: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { title: 'asc' },
    });

    // Get today's submissions for this store
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const submissions = await tp.checklistSubmission.findMany({
      where: {
        storeId,
        date: today,
        templateId: { in: templates.map((t) => t.id) },
      },
      include: {
        _count: { select: { responses: true } },
        responses: { where: { isCompleted: true }, select: { id: true } },
      },
    });

    const submissionMap = new Map(submissions.map((s) => [s.templateId, s]));

    return templates.map((t) => {
      const sub = submissionMap.get(t.id);
      return {
        ...this.formatTemplateResponse(t),
        todaySubmission: sub
          ? {
              id: sub.id,
              status: sub.status,
              completedItems: sub.responses.length,
              totalItems: t.items.length,
            }
          : undefined,
      };
    });
  }

  // ==================== Submissions ====================

  async startSubmission(
    orgId: string,
    templateId: string,
    storeId: string,
    userId: string,
  ): Promise<ChecklistSubmissionResponse> {
    const tp = this.prisma.forTenant(orgId);
    const template = await tp.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    if (!template) throw new NotFoundException('Checklist no encontrado');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const submission = await tp.checklistSubmission.create({
        data: {
          templateId,
          storeId,
          date: today,
          status: 'PENDING',
          submittedById: userId,
        },
        include: {
          template: { select: { title: true } },
          store: { select: { name: true } },
          submittedBy: { select: { id: true, name: true } },
          responses: true,
        },
      });

      return this.formatSubmissionResponse(submission, template.items.length);
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint violation - submission already exists
        const existing = await tp.checklistSubmission.findFirst({
          where: { templateId, storeId, date: today },
          include: {
            template: { select: { title: true, items: true } },
            store: { select: { name: true } },
            submittedBy: { select: { id: true, name: true } },
            responses: true,
          },
        });
        if (existing) {
          return this.formatSubmissionResponse(existing, existing.template.items?.length || 0);
        }
      }
      throw error;
    }
  }

  async findAllSubmissions(
    orgId: string,
    query: SubmissionQueryDto,
  ): Promise<ChecklistSubmissionListResponse> {
    const tp = this.prisma.forTenant(orgId);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = {};

    if (query.storeId) where.storeId = query.storeId;
    if (query.status) where.status = query.status;
    if (query.templateId) where.templateId = query.templateId;
    if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.date.lte = new Date(query.dateTo);
    }

    const [submissions, total] = await Promise.all([
      tp.checklistSubmission.findMany({
        where,
        include: {
          template: { select: { title: true, items: { select: { id: true } } } },
          store: { select: { name: true } },
          submittedBy: { select: { id: true, name: true } },
          responses: { where: { isCompleted: true }, select: { id: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      tp.checklistSubmission.count({ where }),
    ]);

    return {
      submissions: submissions.map((s) =>
        this.formatSubmissionResponse(s, s.template.items?.length || 0),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneSubmission(orgId: string, id: string): Promise<ChecklistSubmissionResponse> {
    const tp = this.prisma.forTenant(orgId);
    const submission = await tp.checklistSubmission.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            title: true,
            items: { orderBy: { order: 'asc' } },
          },
        },
        store: { select: { name: true } },
        submittedBy: { select: { id: true, name: true } },
        responses: {
          include: {
            item: { select: { title: true } },
            completedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!submission) throw new NotFoundException('Submission no encontrada');

    return this.formatSubmissionResponse(
      submission,
      submission.template.items?.length || 0,
      true,
    );
  }

  async respondToItem(
    orgId: string,
    submissionId: string,
    dto: RespondChecklistItemDto,
    userId: string,
  ): Promise<void> {
    const tp = this.prisma.forTenant(orgId);
    const submission = await tp.checklistSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) throw new NotFoundException('Submission no encontrada');
    if (submission.status === 'COMPLETED') {
      throw new BadRequestException('Esta submission ya fue completada');
    }

    // Upsert the response
    await tp.checklistResponse.upsert({
      where: {
        submissionId_itemId: {
          submissionId,
          itemId: dto.itemId,
        },
      },
      update: {
        isCompleted: dto.isCompleted,
        completedById: dto.isCompleted ? userId : null,
        completedAt: dto.isCompleted ? new Date() : null,
        photoUrls: dto.photoUrls || [],
        notes: dto.notes,
      },
      create: {
        submissionId,
        itemId: dto.itemId,
        isCompleted: dto.isCompleted,
        completedById: dto.isCompleted ? userId : null,
        completedAt: dto.isCompleted ? new Date() : null,
        photoUrls: dto.photoUrls || [],
        notes: dto.notes,
      },
    });

    // Update submission status to IN_PROGRESS if PENDING
    if (submission.status === 'PENDING') {
      await tp.checklistSubmission.update({
        where: { id: submissionId },
        data: { status: 'IN_PROGRESS' },
      });
    }
  }

  async completeSubmission(
    orgId: string,
    submissionId: string,
    userId: string,
    userRole: string,
  ): Promise<ChecklistSubmissionResponse> {
    const tp = this.prisma.forTenant(orgId);
    const submission = await tp.checklistSubmission.findUnique({
      where: { id: submissionId },
      include: {
        template: {
          select: { title: true, items: { select: { id: true } } },
        },
        responses: { where: { isCompleted: true }, select: { id: true } },
        store: { select: { name: true } },
        submittedBy: { select: { id: true, name: true } },
      },
    });

    if (!submission) throw new NotFoundException('Submission no encontrada');
    if (submission.status === 'COMPLETED') {
      throw new BadRequestException('Ya esta completada');
    }

    const totalItems = submission.template.items.length;
    const completedItems = submission.responses.length;
    const score = totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : 0;

    const updated = await tp.checklistSubmission.update({
      where: { id: submissionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        score,
      },
      include: {
        template: { select: { title: true, items: { select: { id: true } } } },
        store: { select: { name: true } },
        submittedBy: { select: { id: true, name: true } },
        responses: { where: { isCompleted: true }, select: { id: true } },
      },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'CHECKLIST',
      entityId: submissionId,
      action: 'COMPLETED',
      performedById: userId,
      performedByRole: userRole,
      newValue: { score, templateTitle: submission.template.title },
    });

    // WebSocket notification
    this.eventsGateway.emitToStore(
      submission.storeId,
      'checklist:completed',
      {
        submissionId,
        templateTitle: submission.template.title,
        score,
        storeName: submission.store.name,
      },
    );
    this.eventsGateway.emitToHQ('checklist:completed', {
      submissionId,
      templateTitle: submission.template.title,
      score,
      storeId: submission.storeId,
      storeName: submission.store.name,
    });

    // Gamification: award points for checklist completion
    await this.gamificationService.onActionCompleted(
      orgId,
      GamificationActionType.CHECKLIST_COMPLETED,
      userId,
      'CHECKLIST',
      submissionId,
    );

    // Auto-create CAPA if score < 70%
    if (score < 70) {
      const failedItemDescriptions = [`Checklist: ${submission.template.title}`, `Score: ${score}%`, `Tienda: ${submission.store.name}`];
      await this.correctiveActionsService.createFromChecklistFailure(
        orgId,
        submissionId,
        failedItemDescriptions,
        submission.storeId,
        userId,
      );
    }

    return this.formatSubmissionResponse(updated, totalItems);
  }

  // ==================== Dashboard ====================

  async getDashboard(
    orgId: string,
    storeId?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ChecklistDashboardResponse> {
    const tp = this.prisma.forTenant(orgId);
    const totalTemplates = await tp.checklistTemplate.count({
      where: { isActive: true },
    });

    // Date range for submissions
    const dateWhere: any = {};
    if (dateFrom) dateWhere.gte = new Date(dateFrom);
    if (dateTo) dateWhere.lte = new Date(dateTo);
    else {
      // Default: last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateWhere.gte = sevenDaysAgo;
    }

    const submissionWhere: any = { date: dateWhere };
    if (storeId) submissionWhere.storeId = storeId;

    const submissions = await tp.checklistSubmission.findMany({
      where: submissionWhere,
      include: {
        template: { select: { id: true, title: true } },
        store: { select: { id: true, name: true } },
      },
    });

    const total = submissions.length;
    const completed = submissions.filter((s) => s.status === 'COMPLETED').length;
    const overallCompletionRate = total > 0
      ? Math.round((completed / total) * 100)
      : 0;

    // By store
    const storeMap = new Map<string, { name: string; completed: number; total: number }>();
    submissions.forEach((s) => {
      const key = s.storeId;
      const existing = storeMap.get(key) || { name: s.store.name, completed: 0, total: 0 };
      existing.total++;
      if (s.status === 'COMPLETED') existing.completed++;
      storeMap.set(key, existing);
    });

    // By checklist
    const checklistMap = new Map<string, { title: string; completed: number; total: number }>();
    submissions.forEach((s) => {
      const key = s.templateId;
      const existing = checklistMap.get(key) || { title: s.template.title, completed: 0, total: 0 };
      existing.total++;
      if (s.status === 'COMPLETED') existing.completed++;
      checklistMap.set(key, existing);
    });

    return {
      totalTemplates,
      overallCompletionRate,
      completionByStore: Array.from(storeMap.entries()).map(([storeId, data]) => ({
        storeId,
        storeName: data.name,
        completionRate: data.total > 0
          ? Math.round((data.completed / data.total) * 100)
          : 0,
        completed: data.completed,
        total: data.total,
      })),
      completionByChecklist: Array.from(checklistMap.entries()).map(
        ([templateId, data]) => ({
          templateId,
          templateTitle: data.title,
          completionRate: data.total > 0
            ? Math.round((data.completed / data.total) * 100)
            : 0,
          completed: data.completed,
          total: data.total,
        }),
      ),
    };
  }

  // ==================== Private ====================

  private formatTemplateResponse(template: any): ChecklistTemplateResponse {
    return {
      id: template.id,
      title: template.title,
      description: template.description,
      frequency: template.frequency,
      scope: template.scope,
      targetStoreIds: template.targetStoreIds || [],
      targetRegionIds: template.targetRegionIds || [],
      isActive: template.isActive,
      items: template.items?.map((item: any) => ({
        id: item.id,
        order: item.order,
        title: item.title,
        description: item.description,
        requiresPhoto: item.requiresPhoto,
        requiresNote: item.requiresNote,
      })),
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private formatSubmissionResponse(
    submission: any,
    totalItems: number,
    includeResponses = false,
  ): ChecklistSubmissionResponse {
    const completedItems = submission.responses?.length || 0;

    const result: ChecklistSubmissionResponse = {
      id: submission.id,
      templateId: submission.templateId,
      templateTitle: submission.template?.title,
      storeId: submission.storeId,
      storeName: submission.store?.name,
      date: submission.date,
      status: submission.status,
      submittedBy: submission.submittedBy,
      completedAt: submission.completedAt,
      score: submission.score,
      completedItems,
      totalItems,
      createdAt: submission.createdAt,
    };

    if (includeResponses && submission.responses) {
      result.responses = submission.responses.map((r: any) => ({
        id: r.id,
        itemId: r.itemId,
        itemTitle: r.item?.title,
        isCompleted: r.isCompleted,
        completedBy: r.completedBy,
        completedAt: r.completedAt,
        photoUrls: r.photoUrls || [],
        notes: r.notes,
      }));
    }

    return result;
  }
}
