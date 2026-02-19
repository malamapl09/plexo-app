import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { GamificationService } from '../gamification/gamification.service';
import {
  CreatePlanogramTemplateDto,
  UpdatePlanogramTemplateDto,
  SubmitPlanogramDto,
  ReviewPlanogramDto,
  PlanogramQueryDto,
} from './dto';
import {
  PlanogramSubmissionStatus,
  AuditEntityType,
  AuditAction,
  GamificationActionType,
} from '@prisma/client';

@Injectable()
export class PlanogramsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
    private gamificationService: GamificationService,
  ) {}

  // ==================== Templates ====================

  async createTemplate(orgId: string, dto: CreatePlanogramTemplateDto, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const template = await tp.planogramTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        referencePhotoUrls: dto.referencePhotoUrls,
        targetStoreIds: dto.targetStoreIds || [],
        targetRegionIds: dto.targetRegionIds || [],
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        isActive: true,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Audit log
    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.PLANOGRAM_TEMPLATE,
        entityId: template.id,
        action: AuditAction.CREATED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Created planogram template: ${template.name}`,
      });
    }

    // Notify target stores
    if (template.targetStoreIds.length > 0) {
      template.targetStoreIds.forEach((storeId) => {
        this.eventsGateway.emitToStore(storeId, 'planogram:new_template', {
          templateId: template.id,
          name: template.name,
          dueDate: template.dueDate,
        });
      });
    }

    return template;
  }

  async findAllTemplates(orgId: string) {
    const tp = this.prisma.forTenant(orgId);

    return tp.planogramTemplate.findMany({
      where: { isActive: true },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTemplateById(orgId: string, id: string) {
    const tp = this.prisma.forTenant(orgId);

    const template = await tp.planogramTemplate.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        submissions: {
          include: {
            submittedBy: {
              select: { id: true, name: true, email: true },
            },
            reviewedBy: {
              select: { id: true, name: true, email: true },
            },
            store: {
              select: { id: true, name: true },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Planogram template not found');
    }

    return template;
  }

  async updateTemplate(
    orgId: string,
    id: string,
    dto: UpdatePlanogramTemplateDto,
    userId: string,
  ) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.planogramTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Planogram template not found');
    }

    const updated = await tp.planogramTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        referencePhotoUrls: dto.referencePhotoUrls,
        targetStoreIds: dto.targetStoreIds,
        targetRegionIds: dto.targetRegionIds,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Audit log
    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.PLANOGRAM_TEMPLATE,
        entityId: id,
        action: AuditAction.UPDATED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Updated planogram template: ${updated.name}`,
      });
    }

    return updated;
  }

  async deactivateTemplate(orgId: string, id: string, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.planogramTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Planogram template not found');
    }

    const deactivated = await tp.planogramTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.PLANOGRAM_TEMPLATE,
        entityId: id,
        action: AuditAction.DELETED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Deactivated planogram template: ${existing.name}`,
      });
    }

    return deactivated;
  }

  // ==================== Store View ====================

  async getMyPendingPlanograms(orgId: string, storeId: string) {
    const tp = this.prisma.forTenant(orgId);

    // Get all active templates targeting this store
    const templates = await tp.planogramTemplate.findMany({
      where: {
        isActive: true,
        OR: [
          { targetStoreIds: { has: storeId } },
          { targetStoreIds: { isEmpty: true } },
        ],
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    if (templates.length === 0) return [];

    // Batch query: get all submissions for this store and these templates in ONE query
    const templateIds = templates.map((t) => t.id);
    const submissions = await tp.planogramSubmission.findMany({
      where: {
        templateId: { in: templateIds },
        storeId,
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Index submissions by templateId for O(1) lookup
    const approvedByTemplate = new Set<string>();
    const latestByTemplate = new Map<string, { id: string; status: string }>();

    for (const sub of submissions) {
      if (sub.status === PlanogramSubmissionStatus.APPROVED) {
        approvedByTemplate.add(sub.templateId);
      }
      if (!latestByTemplate.has(sub.templateId)) {
        latestByTemplate.set(sub.templateId, {
          id: sub.id,
          status: sub.status,
        });
      }
    }

    // Return only templates without approved submissions
    return templates
      .filter((t) => !approvedByTemplate.has(t.id))
      .map((t) => {
        const latest = latestByTemplate.get(t.id);
        return {
          ...t,
          hasApprovedSubmission: false,
          latestSubmissionStatus: latest?.status || null,
          latestSubmissionId: latest?.id || null,
        };
      });
  }

  // ==================== Dashboard ====================

  async getDashboard(orgId: string, filters: PlanogramQueryDto) {
    const tp = this.prisma.forTenant(orgId);

    const where: any = {};

    if (filters.storeId) {
      where.storeId = filters.storeId;
    }

    if (filters.templateId) {
      where.templateId = filters.templateId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.submittedAt = {};
      if (filters.dateFrom) {
        where.submittedAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.submittedAt.lte = new Date(filters.dateTo);
      }
    }

    // Total stats
    const [totalTemplates, totalSubmissions, approvedSubmissions] =
      await Promise.all([
        tp.planogramTemplate.count({ where: { isActive: true } }),
        tp.planogramSubmission.count({ where }),
        tp.planogramSubmission.count({
          where: { ...where, status: PlanogramSubmissionStatus.APPROVED },
        }),
      ]);

    const overallComplianceRate =
      totalSubmissions > 0
        ? Math.round((approvedSubmissions / totalSubmissions) * 100)
        : 0;

    // Compliance by store — batch query instead of N+1
    const [stores, allTemplates, approvedByStore] = await Promise.all([
      tp.store.findMany({
        select: { id: true, name: true },
      }),
      tp.planogramTemplate.findMany({
        where: { isActive: true },
        select: { id: true, name: true, targetStoreIds: true },
      }),
      tp.planogramSubmission.groupBy({
        by: ['storeId'],
        where: { status: PlanogramSubmissionStatus.APPROVED },
        _count: { id: true },
      }),
    ]);

    // Index approved counts by storeId
    const approvedCountByStore = new Map(
      approvedByStore.map((g) => [g.storeId, g._count.id]),
    );

    // Count how many templates target each store
    const globalTemplates = allTemplates.filter(
      (t) => t.targetStoreIds.length === 0,
    );

    const complianceByStore = stores.map((store) => {
      const storeTemplates =
        globalTemplates.length +
        allTemplates.filter(
          (t) =>
            t.targetStoreIds.length > 0 && t.targetStoreIds.includes(store.id),
        ).length;

      const approvedForStore = approvedCountByStore.get(store.id) || 0;

      return {
        storeId: store.id,
        storeName: store.name,
        approvedSubmissions: approvedForStore,
        totalTemplates: storeTemplates,
        complianceRate:
          storeTemplates > 0
            ? Math.round((approvedForStore / storeTemplates) * 100)
            : 0,
      };
    });

    // Compliance by template — batch query instead of N+1
    const approvedByTemplate = await tp.planogramSubmission.groupBy({
      by: ['templateId'],
      where: { status: PlanogramSubmissionStatus.APPROVED },
      _count: { id: true },
    });

    const approvedCountByTemplate = new Map(
      approvedByTemplate.map((g) => [g.templateId, g._count.id]),
    );

    const complianceByTemplate = allTemplates.map((template) => {
      const targetStoreCount =
        template.targetStoreIds.length > 0
          ? template.targetStoreIds.length
          : stores.length;

      const approvedCount = approvedCountByTemplate.get(template.id) || 0;

      return {
        templateId: template.id,
        templateName: template.name,
        approvedSubmissions: approvedCount,
        totalTargetStores: targetStoreCount,
        complianceRate:
          targetStoreCount > 0
            ? Math.round((approvedCount / targetStoreCount) * 100)
            : 0,
      };
    });

    // Recent submissions
    const recentSubmissions = await tp.planogramSubmission.findMany({
      where,
      include: {
        template: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    });

    return {
      totalTemplates,
      totalSubmissions,
      overallComplianceRate,
      complianceByStore: complianceByStore.filter((s) => s.totalTemplates > 0),
      complianceByTemplate,
      recentSubmissions: recentSubmissions.map((s) => ({
        id: s.id,
        templateId: s.templateId,
        templateName: s.template.name,
        storeId: s.storeId,
        storeName: s.store.name,
        photoUrls: s.photoUrls,
        notes: s.notes,
        status: s.status,
        submittedBy: s.submittedBy,
        reviewedBy: s.reviewedBy,
        reviewNotes: s.reviewNotes,
        reviewedAt: s.reviewedAt,
        submittedAt: s.submittedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    };
  }

  // ==================== Submissions ====================

  async findSubmissions(orgId: string, query: PlanogramQueryDto, userId?: string) {
    const tp = this.prisma.forTenant(orgId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.storeId) {
      where.storeId = query.storeId;
    }

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.dateFrom || query.dateTo) {
      where.submittedAt = {};
      if (query.dateFrom) {
        where.submittedAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.submittedAt.lte = new Date(query.dateTo);
      }
    }

    // Filter by current user's submissions if mine=true
    if (query.mine === true && userId) {
      where.submittedById = userId;
    }

    const [submissions, total] = await Promise.all([
      tp.planogramSubmission.findMany({
        where,
        include: {
          template: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
          submittedBy: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      tp.planogramSubmission.count({ where }),
    ]);

    return {
      submissions: submissions.map((s) => ({
        id: s.id,
        templateId: s.templateId,
        templateName: s.template.name,
        storeId: s.storeId,
        storeName: s.store.name,
        photoUrls: s.photoUrls,
        notes: s.notes,
        status: s.status,
        submittedBy: s.submittedBy,
        reviewedBy: s.reviewedBy,
        reviewNotes: s.reviewNotes,
        reviewedAt: s.reviewedAt,
        submittedAt: s.submittedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSubmissionById(orgId: string, id: string) {
    const tp = this.prisma.forTenant(orgId);

    const submission = await tp.planogramSubmission.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            referencePhotoUrls: true,
            dueDate: true,
          },
        },
        store: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Planogram submission not found');
    }

    return {
      id: submission.id,
      templateId: submission.templateId,
      templateName: submission.template.name,
      templateDescription: submission.template.description,
      referencePhotoUrls: submission.template.referencePhotoUrls,
      dueDate: submission.template.dueDate,
      storeId: submission.storeId,
      storeName: submission.store.name,
      photoUrls: submission.photoUrls,
      notes: submission.notes,
      status: submission.status,
      submittedBy: submission.submittedBy,
      reviewedBy: submission.reviewedBy,
      reviewNotes: submission.reviewNotes,
      reviewedAt: submission.reviewedAt,
      submittedAt: submission.submittedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  async submitPhotos(
    orgId: string,
    templateId: string,
    dto: SubmitPlanogramDto,
    userId: string,
  ) {
    const tp = this.prisma.forTenant(orgId);

    // Verify template exists and is active
    const template = await tp.planogramTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template || !template.isActive) {
      throw new NotFoundException('Planogram template not found or inactive');
    }

    // Verify store exists
    const store = await tp.store.findUnique({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if template targets this store
    if (
      template.targetStoreIds.length > 0 &&
      !template.targetStoreIds.includes(dto.storeId)
    ) {
      throw new BadRequestException(
        'This template does not target this store',
      );
    }

    // Check for existing submission (approved can't be overwritten)
    const existing = await tp.planogramSubmission.findUnique({
      where: {
        templateId_storeId: { templateId, storeId: dto.storeId },
      },
    });

    if (existing) {
      if (existing.status === PlanogramSubmissionStatus.APPROVED) {
        throw new BadRequestException(
          'Esta tienda ya tiene una entrega aprobada para este planograma',
        );
      }
      throw new BadRequestException(
        'Ya existe una entrega para esta tienda y plantilla. Use el endpoint de reenvío.',
      );
    }

    // Create submission — use try/catch for race condition safety
    let submission;
    try {
      submission = await tp.planogramSubmission.create({
        data: {
          templateId,
          storeId: dto.storeId,
          submittedById: userId,
          photoUrls: dto.photoUrls,
          notes: dto.notes,
          status: PlanogramSubmissionStatus.PENDING_REVIEW,
          submittedAt: new Date(),
        },
        include: {
          template: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
          submittedBy: { select: { id: true, name: true, email: true } },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Ya existe una entrega para esta tienda y plantilla. Use el endpoint de reenvío.',
        );
      }
      throw error;
    }

    // Audit log
    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.PLANOGRAM_SUBMISSION,
        entityId: submission.id,
        action: AuditAction.CREATED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Submitted planogram for template: ${template.name} at store: ${store.name}`,
      });
    }

    // Notify HQ
    this.eventsGateway.emitToHQ('planogram:submitted', {
      submissionId: submission.id,
      templateName: submission.template.name,
      storeName: submission.store.name,
      submittedBy: submission.submittedBy,
    });

    return {
      id: submission.id,
      templateId: submission.templateId,
      templateName: submission.template.name,
      storeId: submission.storeId,
      storeName: submission.store.name,
      photoUrls: submission.photoUrls,
      notes: submission.notes,
      status: submission.status,
      submittedBy: submission.submittedBy,
      submittedAt: submission.submittedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    };
  }

  async reviewSubmission(orgId: string, id: string, dto: ReviewPlanogramDto, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const submission = await tp.planogramSubmission.findUnique({
      where: { id },
      include: {
        template: { select: { name: true } },
        store: { select: { name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Planogram submission not found');
    }

    if (
      submission.status === PlanogramSubmissionStatus.APPROVED &&
      dto.status === PlanogramSubmissionStatus.APPROVED
    ) {
      throw new BadRequestException('Submission already approved');
    }

    const updated = await tp.planogramSubmission.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedById: userId,
        reviewNotes: dto.reviewNotes,
        reviewedAt: new Date(),
      },
      include: {
        template: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Audit log
    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      const auditAction =
        dto.status === PlanogramSubmissionStatus.APPROVED
          ? AuditAction.APPROVED
          : AuditAction.REVISION_REQUESTED;

      await this.auditService.log(orgId, {
        entityType: AuditEntityType.PLANOGRAM_SUBMISSION,
        entityId: id,
        action: auditAction,
        performedById: userId,
        performedByRole: user.role,
        notes: `${dto.status === PlanogramSubmissionStatus.APPROVED ? 'Approved' : 'Requested revision for'} planogram submission`,
      });
    }

    // Notify store and submitter
    const eventData = {
      submissionId: updated.id,
      templateName: updated.template.name,
      storeName: updated.store.name,
      status: updated.status,
      reviewNotes: updated.reviewNotes,
      reviewedBy: updated.reviewedBy,
    };

    this.eventsGateway.emitToStore(
      updated.storeId,
      dto.status === PlanogramSubmissionStatus.APPROVED
        ? 'planogram:approved'
        : 'planogram:revision_requested',
      eventData,
    );

    this.eventsGateway.emitToUser(
      submission.submittedById,
      dto.status === PlanogramSubmissionStatus.APPROVED
        ? 'planogram:approved'
        : 'planogram:revision_requested',
      eventData,
    );

    // Gamification: award points when planogram is approved
    if (dto.status === PlanogramSubmissionStatus.APPROVED) {
      await this.gamificationService.onActionCompleted(
        orgId,
        GamificationActionType.PLANOGRAM_APPROVED,
        submission.submittedById,
        'PLANOGRAM_SUBMISSION',
        id,
      );
    }

    return {
      id: updated.id,
      templateId: updated.templateId,
      templateName: updated.template.name,
      storeId: updated.storeId,
      storeName: updated.store.name,
      photoUrls: updated.photoUrls,
      notes: updated.notes,
      status: updated.status,
      submittedBy: updated.submittedBy,
      reviewedBy: updated.reviewedBy,
      reviewNotes: updated.reviewNotes,
      reviewedAt: updated.reviewedAt,
      submittedAt: updated.submittedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async resubmit(orgId: string, id: string, dto: SubmitPlanogramDto, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const submission = await tp.planogramSubmission.findUnique({
      where: { id },
      include: {
        template: { select: { name: true } },
        store: { select: { name: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Planogram submission not found');
    }

    if (submission.status !== PlanogramSubmissionStatus.NEEDS_REVISION) {
      throw new BadRequestException(
        'Can only resubmit submissions that need revision',
      );
    }

    if (submission.submittedById !== userId) {
      throw new ForbiddenException(
        'You can only resubmit your own submissions',
      );
    }

    if (submission.storeId !== dto.storeId) {
      throw new BadRequestException('Cannot change store on resubmission');
    }

    const updated = await tp.planogramSubmission.update({
      where: { id },
      data: {
        photoUrls: dto.photoUrls,
        notes: dto.notes,
        status: PlanogramSubmissionStatus.RESUBMITTED,
        reviewedById: null,
        reviewNotes: null,
        reviewedAt: null,
        submittedAt: new Date(),
      },
      include: {
        template: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Audit log
    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.PLANOGRAM_SUBMISSION,
        entityId: id,
        action: AuditAction.RESUBMITTED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Resubmitted planogram for review`,
      });
    }

    // Notify HQ
    this.eventsGateway.emitToHQ('planogram:resubmitted', {
      submissionId: updated.id,
      templateName: updated.template.name,
      storeName: updated.store.name,
      submittedBy: updated.submittedBy,
    });

    return {
      id: updated.id,
      templateId: updated.templateId,
      templateName: updated.template.name,
      storeId: updated.storeId,
      storeName: updated.store.name,
      photoUrls: updated.photoUrls,
      notes: updated.notes,
      status: updated.status,
      submittedBy: updated.submittedBy,
      submittedAt: updated.submittedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
