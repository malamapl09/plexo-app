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
  CreateCampaignDto,
  UpdateCampaignDto,
  SubmitCampaignDto,
  ReviewCampaignDto,
  CampaignQueryDto,
  CampaignSubmissionQueryDto,
} from './dto';
import {
  CampaignStatus,
  CampaignSubmissionStatus,
  AuditEntityType,
  AuditAction,
  GamificationActionType,
} from '@prisma/client';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
    private gamificationService: GamificationService,
  ) {}

  // ==================== Campaigns CRUD ====================

  async create(orgId: string, dto: CreateCampaignDto, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const campaign = await tp.campaign.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority,
        status: CampaignStatus.DRAFT,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        referencePhotoUrls: dto.referencePhotoUrls || [],
        materialsList: dto.materialsList || [],
        instructions: dto.instructions,
        targetStoreIds: dto.targetStoreIds || [],
        targetRegionIds: dto.targetRegionIds || [],
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.CAMPAIGN,
        entityId: campaign.id,
        action: AuditAction.CREATED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Created campaign: ${campaign.title}`,
      });
    }

    return campaign;
  }

  async findAll(orgId: string, query: CampaignQueryDto) {
    const tp = this.prisma.forTenant(orgId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.dateFrom || query.dateTo) {
      where.startDate = {};
      if (query.dateFrom) {
        where.startDate.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.startDate.lte = new Date(query.dateTo);
      }
    }

    const [campaigns, total] = await Promise.all([
      tp.campaign.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { submissions: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      tp.campaign.count({ where }),
    ]);

    return {
      data: campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(orgId: string, id: string) {
    const tp = this.prisma.forTenant(orgId);

    const campaign = await tp.campaign.findUnique({
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

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async update(orgId: string, id: string, dto: UpdateCampaignDto, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Campaign not found');
    }

    const updated = await tp.campaign.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        referencePhotoUrls: dto.referencePhotoUrls,
        materialsList: dto.materialsList,
        instructions: dto.instructions,
        targetStoreIds: dto.targetStoreIds,
        targetRegionIds: dto.targetRegionIds,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.CAMPAIGN,
        entityId: id,
        action: AuditAction.UPDATED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Updated campaign: ${updated.title}`,
      });
    }

    return updated;
  }

  async updateStatus(orgId: string, id: string, status: CampaignStatus, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Campaign not found');
    }

    // Validate status transitions
    const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      [CampaignStatus.DRAFT]: [CampaignStatus.ACTIVE, CampaignStatus.CANCELLED],
      [CampaignStatus.ACTIVE]: [
        CampaignStatus.PAUSED,
        CampaignStatus.COMPLETED,
        CampaignStatus.CANCELLED,
      ],
      [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.CANCELLED],
      [CampaignStatus.COMPLETED]: [],
      [CampaignStatus.CANCELLED]: [],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${existing.status} to ${status}`,
      );
    }

    const updated = await tp.campaign.update({
      where: { id },
      data: { status },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.CAMPAIGN,
        entityId: id,
        action: AuditAction.STATUS_CHANGED,
        performedById: userId,
        performedByRole: user.role,
        previousValue: { status: existing.status },
        newValue: { status },
        notes: `Campaign status changed to ${status}`,
      });
    }

    // Notify target stores when campaign is activated
    if (status === CampaignStatus.ACTIVE) {
      if (updated.targetStoreIds.length > 0) {
        updated.targetStoreIds.forEach((storeId) => {
          this.eventsGateway.emitToStore(storeId, 'campaign:activated', {
            campaignId: updated.id,
            title: updated.title,
            type: updated.type,
            endDate: updated.endDate,
          });
        });
      } else {
        // Notify all stores
        this.eventsGateway.emitToHQ('campaign:activated', {
          campaignId: updated.id,
          title: updated.title,
          type: updated.type,
          endDate: updated.endDate,
        });
      }
    }

    return updated;
  }

  async deleteCampaign(orgId: string, id: string, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.campaign.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Campaign not found');
    }

    const updated = await tp.campaign.update({
      where: { id },
      data: { status: CampaignStatus.CANCELLED },
    });

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.CAMPAIGN,
        entityId: id,
        action: AuditAction.DELETED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Cancelled campaign: ${existing.title}`,
      });
    }

    return updated;
  }

  // ==================== Store View ====================

  async getMyPending(orgId: string, storeId: string) {
    const tp = this.prisma.forTenant(orgId);

    const campaigns = await tp.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
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
      orderBy: { endDate: 'asc' },
    });

    const campaignsWithStatus = await Promise.all(
      campaigns.map(async (campaign) => {
        const approvedSubmission =
          await tp.campaignSubmission.findFirst({
            where: {
              campaignId: campaign.id,
              storeId,
              status: CampaignSubmissionStatus.APPROVED,
            },
          });

        const latestSubmission =
          await tp.campaignSubmission.findFirst({
            where: {
              campaignId: campaign.id,
              storeId,
            },
            orderBy: { submittedAt: 'desc' },
          });

        return {
          ...campaign,
          hasApprovedSubmission: !!approvedSubmission,
          latestSubmissionStatus: latestSubmission?.status || null,
          latestSubmissionId: latestSubmission?.id || null,
        };
      }),
    );

    return campaignsWithStatus.filter((c) => !c.hasApprovedSubmission);
  }

  // ==================== Submissions ====================

  async submitExecution(
    orgId: string,
    campaignId: string,
    dto: SubmitCampaignDto,
    userId: string,
  ) {
    const tp = this.prisma.forTenant(orgId);

    const campaign = await tp.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('Campaign is not active');
    }

    const store = await tp.store.findUnique({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (
      campaign.targetStoreIds.length > 0 &&
      !campaign.targetStoreIds.includes(dto.storeId)
    ) {
      throw new BadRequestException(
        'This campaign does not target this store',
      );
    }

    // Check for existing submission (unique constraint: campaignId + storeId)
    const existingSubmission =
      await tp.campaignSubmission.findUnique({
        where: {
          campaignId_storeId: { campaignId, storeId: dto.storeId },
        },
      });

    if (existingSubmission) {
      if (existingSubmission.status === CampaignSubmissionStatus.APPROVED) {
        throw new BadRequestException(
          'This store already has an approved submission for this campaign',
        );
      }
      throw new BadRequestException(
        'A submission already exists for this store. Use the resubmit endpoint to update it.',
      );
    }

    const submission = await tp.campaignSubmission.create({
      data: {
        campaignId,
        storeId: dto.storeId,
        submittedById: userId,
        photoUrls: dto.photoUrls,
        notes: dto.notes,
        status: CampaignSubmissionStatus.PENDING_REVIEW,
        submittedAt: new Date(),
      },
      include: {
        campaign: { select: { id: true, title: true } },
        store: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.CAMPAIGN_SUBMISSION,
        entityId: submission.id,
        action: AuditAction.CREATED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Submitted campaign execution for: ${campaign.title} at store: ${store.name}`,
      });
    }

    this.eventsGateway.emitToHQ('campaign:submitted', {
      submissionId: submission.id,
      campaignTitle: submission.campaign.title,
      storeName: submission.store.name,
      submittedBy: submission.submittedBy,
    });

    return submission;
  }

  async reviewSubmission(
    orgId: string,
    id: string,
    dto: ReviewCampaignDto,
    userId: string,
  ) {
    const tp = this.prisma.forTenant(orgId);

    const submission = await tp.campaignSubmission.findUnique({
      where: { id },
      include: {
        campaign: { select: { title: true } },
        store: { select: { name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Campaign submission not found');
    }

    if (submission.status === CampaignSubmissionStatus.APPROVED) {
      throw new BadRequestException('Submission already approved');
    }

    if (submission.status === CampaignSubmissionStatus.NEEDS_REVISION) {
      throw new BadRequestException(
        'Submission must be resubmitted before it can be reviewed again',
      );
    }

    // Determine if this was ever revised (not first attempt)
    const isFirstAttempt =
      submission.status !== CampaignSubmissionStatus.RESUBMITTED;

    const updated = await tp.campaignSubmission.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedById: userId,
        reviewNotes: dto.reviewNotes,
        reviewedAt: new Date(),
      },
      include: {
        campaign: { select: { id: true, title: true } },
        store: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      const auditAction =
        dto.status === CampaignSubmissionStatus.APPROVED
          ? AuditAction.APPROVED
          : AuditAction.REVISION_REQUESTED;

      await this.auditService.log(orgId, {
        entityType: AuditEntityType.CAMPAIGN_SUBMISSION,
        entityId: id,
        action: auditAction,
        performedById: userId,
        performedByRole: user.role,
        notes: `${dto.status === CampaignSubmissionStatus.APPROVED ? 'Approved' : 'Requested revision for'} campaign submission`,
      });
    }

    const eventData = {
      submissionId: updated.id,
      campaignTitle: updated.campaign.title,
      storeName: updated.store.name,
      status: updated.status,
      reviewNotes: updated.reviewNotes,
      reviewedBy: updated.reviewedBy,
    };

    this.eventsGateway.emitToStore(
      updated.storeId,
      dto.status === CampaignSubmissionStatus.APPROVED
        ? 'campaign:approved'
        : 'campaign:revision_requested',
      eventData,
    );

    this.eventsGateway.emitToUser(
      submission.submittedById,
      dto.status === CampaignSubmissionStatus.APPROVED
        ? 'campaign:approved'
        : 'campaign:revision_requested',
      eventData,
    );

    // Gamification: award points when campaign execution is approved
    if (dto.status === CampaignSubmissionStatus.APPROVED) {
      await this.gamificationService.onActionCompleted(
        orgId,
        GamificationActionType.CAMPAIGN_EXECUTED,
        submission.submittedById,
        'CAMPAIGN_SUBMISSION',
        id,
        isFirstAttempt,
      );
    }

    return updated;
  }

  async resubmit(orgId: string, id: string, dto: SubmitCampaignDto, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    const submission = await tp.campaignSubmission.findUnique({
      where: { id },
      include: {
        campaign: { select: { title: true } },
        store: { select: { name: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Campaign submission not found');
    }

    if (submission.status !== CampaignSubmissionStatus.NEEDS_REVISION) {
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

    const updated = await tp.campaignSubmission.update({
      where: { id },
      data: {
        photoUrls: dto.photoUrls,
        notes: dto.notes,
        status: CampaignSubmissionStatus.RESUBMITTED,
        reviewedById: null,
        reviewNotes: null,
        reviewedAt: null,
        submittedAt: new Date(),
      },
      include: {
        campaign: { select: { id: true, title: true } },
        store: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const user = await tp.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user) {
      await this.auditService.log(orgId, {
        entityType: AuditEntityType.CAMPAIGN_SUBMISSION,
        entityId: id,
        action: AuditAction.RESUBMITTED,
        performedById: userId,
        performedByRole: user.role,
        notes: `Resubmitted campaign execution for review`,
      });
    }

    this.eventsGateway.emitToHQ('campaign:resubmitted', {
      submissionId: updated.id,
      campaignTitle: updated.campaign.title,
      storeName: updated.store.name,
      submittedBy: updated.submittedBy,
    });

    return updated;
  }

  async findMySubmissions(orgId: string, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    return tp.campaignSubmission.findMany({
      where: { submittedById: userId },
      include: {
        campaign: { select: { id: true, title: true, type: true } },
        store: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findSubmissions(orgId: string, query: CampaignSubmissionQueryDto) {
    const tp = this.prisma.forTenant(orgId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.campaignId) {
      where.campaignId = query.campaignId;
    }

    if (query.storeId) {
      where.storeId = query.storeId;
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

    const [submissions, total] = await Promise.all([
      tp.campaignSubmission.findMany({
        where,
        include: {
          campaign: { select: { id: true, title: true, type: true } },
          store: { select: { id: true, name: true } },
          submittedBy: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      tp.campaignSubmission.count({ where }),
    ]);

    return {
      data: submissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSubmissionById(orgId: string, id: string) {
    const tp = this.prisma.forTenant(orgId);

    const submission = await tp.campaignSubmission.findUnique({
      where: { id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            priority: true,
            referencePhotoUrls: true,
            materialsList: true,
            instructions: true,
            startDate: true,
            endDate: true,
          },
        },
        store: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException('Campaign submission not found');
    }

    return submission;
  }

  // ==================== Dashboard ====================

  async getDashboard(orgId: string, query: CampaignQueryDto) {
    const tp = this.prisma.forTenant(orgId);

    const [totalActive, totalSubmissions, approvedSubmissions] =
      await Promise.all([
        tp.campaign.count({
          where: { status: CampaignStatus.ACTIVE },
        }),
        tp.campaignSubmission.count(),
        tp.campaignSubmission.count({
          where: { status: CampaignSubmissionStatus.APPROVED },
        }),
      ]);

    const expiredCount = await tp.campaign.count({
      where: {
        status: CampaignStatus.COMPLETED,
      },
    });

    const complianceRate =
      totalSubmissions > 0
        ? Math.round((approvedSubmissions / totalSubmissions) * 100)
        : 0;

    // Compliance by store
    const stores = await tp.store.findMany({
      select: { id: true, name: true },
    });

    const complianceByStore = await Promise.all(
      stores.map(async (store) => {
        const storeCampaigns = await tp.campaign.count({
          where: {
            status: { in: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED] },
            OR: [
              { targetStoreIds: { has: store.id } },
              { targetStoreIds: { isEmpty: true } },
            ],
          },
        });

        const approvedForStore =
          await tp.campaignSubmission.count({
            where: {
              storeId: store.id,
              status: CampaignSubmissionStatus.APPROVED,
            },
          });

        return {
          storeId: store.id,
          storeName: store.name,
          approvedSubmissions: approvedForStore,
          totalCampaigns: storeCampaigns,
          complianceRate:
            storeCampaigns > 0
              ? Math.round((approvedForStore / storeCampaigns) * 100)
              : 0,
        };
      }),
    );

    // Compliance by campaign
    const activeCampaigns = await tp.campaign.findMany({
      where: {
        status: { in: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED] },
      },
      select: { id: true, title: true, type: true, targetStoreIds: true },
    });

    const complianceByCampaign = await Promise.all(
      activeCampaigns.map(async (campaign) => {
        const targetStoreCount =
          campaign.targetStoreIds.length > 0
            ? campaign.targetStoreIds.length
            : stores.length;

        const approvedCount =
          await tp.campaignSubmission.count({
            where: {
              campaignId: campaign.id,
              status: CampaignSubmissionStatus.APPROVED,
            },
          });

        return {
          campaignId: campaign.id,
          campaignTitle: campaign.title,
          campaignType: campaign.type,
          approvedSubmissions: approvedCount,
          totalTargetStores: targetStoreCount,
          complianceRate:
            targetStoreCount > 0
              ? Math.round((approvedCount / targetStoreCount) * 100)
              : 0,
        };
      }),
    );

    // Recent submissions
    const recentSubmissions = await tp.campaignSubmission.findMany({
      include: {
        campaign: { select: { id: true, title: true, type: true } },
        store: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 10,
    });

    return {
      totalActive,
      totalSubmissions,
      complianceRate,
      expiredCount,
      complianceByStore: complianceByStore.filter(
        (s) => s.totalCampaigns > 0,
      ),
      complianceByCampaign,
      recentSubmissions,
    };
  }
}
