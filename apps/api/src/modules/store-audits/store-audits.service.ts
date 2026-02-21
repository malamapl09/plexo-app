import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { CorrectiveActionsService } from '../corrective-actions/corrective-actions.service';
import { GamificationService } from '../gamification/gamification.service';
import {
  CreateAuditTemplateDto,
  ScheduleAuditDto,
  SubmitAnswerDto,
  ReportFindingDto,
  CreateCorrectiveActionDto,
  UpdateCorrectiveActionDto,
  AuditQueryDto,
  AuditTemplateResponse,
  StoreAuditResponse,
  AuditFindingResponse,
  CorrectiveActionResponse,
  AuditDashboardResponse,
} from './dto';
import { AuditEntityType, AuditAction, QuestionType, FindingStatus, CorrectiveActionStatus, GamificationActionType } from '@prisma/client';

@Injectable()
export class StoreAuditsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
    private correctiveActionsService: CorrectiveActionsService,
    private gamificationService: GamificationService,
  ) {}

  // ============================================
  // TEMPLATE CRUD
  // ============================================

  async createTemplate(orgId: string, dto: CreateAuditTemplateDto, userId: string): Promise<AuditTemplateResponse> {
    const tp = this.prisma.forTenant(orgId);
    const template = await tp.auditTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdById: userId,
        sections: {
          create: dto.sections.map((section) => ({
            order: section.order,
            title: section.title,
            description: section.description,
            weight: section.weight ?? 1.0,
            questions: {
              create: section.questions.map((question) => ({
                order: question.order,
                text: question.text,
                questionType: question.questionType as QuestionType ?? QuestionType.SCORE,
                maxScore: question.maxScore ?? 5,
                requiresPhoto: question.requiresPhoto ?? false,
              })),
            },
          })),
        },
      },
      include: {
        sections: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: AuditEntityType.STORE_AUDIT,
      entityId: template.id,
      action: AuditAction.CREATED,
      performedById: userId,
      performedByRole: 'OPERATIONS_MANAGER',
      notes: `Created audit template: ${template.name}`,
    });

    return this.mapTemplateToResponse(template);
  }

  async findAllTemplates(orgId: string): Promise<AuditTemplateResponse[]> {
    const tp = this.prisma.forTenant(orgId);
    const templates = await tp.auditTemplate.findMany({
      where: { isActive: true },
      include: {
        sections: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return templates.map((t) => this.mapTemplateToResponse(t));
  }

  async findOneTemplate(orgId: string, id: string): Promise<AuditTemplateResponse> {
    const tp = this.prisma.forTenant(orgId);
    const template = await tp.auditTemplate.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Audit template ${id} not found`);
    }

    return this.mapTemplateToResponse(template);
  }

  async updateTemplate(orgId: string, id: string, dto: Partial<CreateAuditTemplateDto>, userId: string): Promise<AuditTemplateResponse> {
    const tp = this.prisma.forTenant(orgId);
    const existing = await tp.auditTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Audit template ${id} not found`);
    }

    const updated = await tp.auditTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        // Note: For simplicity, not updating sections/questions here
        // In production, you'd need complex logic to handle nested updates
      },
      include: {
        sections: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    await this.auditService.log(orgId, {
      entityType: AuditEntityType.STORE_AUDIT,
      entityId: id,
      action: AuditAction.UPDATED,
      performedById: userId,
      performedByRole: 'OPERATIONS_MANAGER',
      notes: `Updated audit template`,
    });

    return this.mapTemplateToResponse(updated);
  }

  // ============================================
  // SCHEDULE AUDIT
  // ============================================

  async schedule(orgId: string, dto: ScheduleAuditDto, userId: string, userRole: string): Promise<StoreAuditResponse> {
    const tp = this.prisma.forTenant(orgId);
    // Verify template exists
    const template = await tp.auditTemplate.findUnique({
      where: { id: dto.templateId },
    });
    if (!template || !template.isActive) {
      throw new NotFoundException(`Audit template ${dto.templateId} not found or inactive`);
    }

    // Verify store exists
    const store = await tp.store.findUnique({
      where: { id: dto.storeId },
    });
    if (!store) {
      throw new NotFoundException(`Store ${dto.storeId} not found`);
    }

    // Determine auditor
    const auditorId = dto.auditorId ?? userId;

    // Verify auditor exists
    const auditor = await tp.user.findUnique({
      where: { id: auditorId },
    });
    if (!auditor) {
      throw new NotFoundException(`Auditor ${auditorId} not found`);
    }

    const audit = await tp.storeAudit.create({
      data: {
        templateId: dto.templateId,
        storeId: dto.storeId,
        scheduledDate: new Date(dto.scheduledDate),
        auditorId,
        status: 'SCHEDULED',
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        auditor: {
          select: { id: true, name: true, email: true, role: true },
        },
        answers: true,
        findings: {
          include: {
            correctiveAction: {
              include: {
                assignedTo: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
      },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: AuditEntityType.STORE_AUDIT,
      entityId: audit.id,
      action: AuditAction.CREATED,
      performedById: userId,
      performedByRole: userRole,
      notes: `Scheduled audit for ${store.name} on ${dto.scheduledDate}`,
    });

    // Emit WebSocket event (non-critical, don't let failures block the response)
    try {
      this.eventsGateway.emitToStore(dto.storeId, 'audit:scheduled', this.mapAuditToResponse(audit));
      this.eventsGateway.emitToHQ('audit:scheduled', this.mapAuditToResponse(audit));
      this.eventsGateway.emitToUser(auditorId, 'audit:assigned_to_me', this.mapAuditToResponse(audit));
    } catch (e) {
      // WebSocket failures should not prevent audit creation
    }

    return this.mapAuditToResponse(audit);
  }

  // ============================================
  // AUDIT LIFECYCLE
  // ============================================

  async startAudit(orgId: string, id: string, userId: string, userRole: string): Promise<StoreAuditResponse> {
    const tp = this.prisma.forTenant(orgId);
    const audit = await tp.storeAudit.findUnique({
      where: { id },
      include: {
        store: true,
        auditor: true,
      },
    });

    if (!audit) {
      throw new NotFoundException(`Store audit ${id} not found`);
    }

    if (audit.status !== 'SCHEDULED') {
      throw new BadRequestException(`Audit must be in SCHEDULED status to start`);
    }

    // Only the assigned auditor can start
    if (audit.auditorId !== userId) {
      throw new ForbiddenException(`Only the assigned auditor can start this audit`);
    }

    const updated = await tp.storeAudit.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        auditor: {
          select: { id: true, name: true, email: true, role: true },
        },
        answers: true,
        findings: {
          include: {
            correctiveAction: {
              include: {
                assignedTo: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
      },
    });

    await this.auditService.log(orgId, {
      entityType: AuditEntityType.STORE_AUDIT,
      entityId: id,
      action: AuditAction.STATUS_CHANGED,
      performedById: userId,
      performedByRole: userRole,
      previousValue: 'SCHEDULED',
      newValue: 'IN_PROGRESS',
    });

    this.eventsGateway.emitToStore(audit.storeId, 'audit:started', this.mapAuditToResponse(updated));
    this.eventsGateway.emitToHQ('audit:started', this.mapAuditToResponse(updated));

    return this.mapAuditToResponse(updated);
  }

  async submitAnswer(orgId: string, id: string, dto: SubmitAnswerDto, userId: string): Promise<StoreAuditResponse> {
    const tp = this.prisma.forTenant(orgId);
    const audit = await tp.storeAudit.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            sections: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
    });

    if (!audit) {
      throw new NotFoundException(`Store audit ${id} not found`);
    }

    if (audit.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Audit must be in IN_PROGRESS status to submit answers`);
    }

    if (audit.auditorId !== userId) {
      throw new ForbiddenException(`Only the assigned auditor can submit answers`);
    }

    // Verify question belongs to this template
    const question = audit.template.sections
      .flatMap((s) => s.questions)
      .find((q) => q.id === dto.questionId);

    if (!question) {
      throw new BadRequestException(`Question ${dto.questionId} not found in this audit template`);
    }

    // Validate answer type matches question type
    if (question.questionType === 'SCORE' && (dto.score === undefined || dto.score === null)) {
      throw new BadRequestException(`Score is required for SCORE type questions`);
    }
    if (question.questionType === 'YES_NO' && (dto.booleanValue === undefined || dto.booleanValue === null)) {
      throw new BadRequestException(`Boolean value is required for YES_NO type questions`);
    }
    if (question.questionType === 'SCORE' && dto.score !== undefined && dto.score > question.maxScore) {
      throw new BadRequestException(`Score cannot exceed maxScore of ${question.maxScore}`);
    }

    // Upsert answer
    await tp.auditAnswer.upsert({
      where: {
        storeAuditId_questionId: {
          storeAuditId: id,
          questionId: dto.questionId,
        },
      },
      create: {
        storeAuditId: id,
        questionId: dto.questionId,
        score: dto.score,
        booleanValue: dto.booleanValue,
        textValue: dto.textValue,
        photoUrls: dto.photoUrls ?? [],
        notes: dto.notes,
      },
      update: {
        score: dto.score,
        booleanValue: dto.booleanValue,
        textValue: dto.textValue,
        photoUrls: dto.photoUrls ?? [],
        notes: dto.notes,
      },
    });

    const updated = await tp.storeAudit.findUnique({
      where: { id },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        auditor: {
          select: { id: true, name: true, email: true, role: true },
        },
        answers: true,
        findings: {
          include: {
            correctiveAction: {
              include: {
                assignedTo: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
      },
    });

    return this.mapAuditToResponse(updated!);
  }

  async reportFinding(orgId: string, id: string, dto: ReportFindingDto, userId: string): Promise<AuditFindingResponse> {
    const tp = this.prisma.forTenant(orgId);
    const audit = await tp.storeAudit.findUnique({
      where: { id },
    });

    if (!audit) {
      throw new NotFoundException(`Store audit ${id} not found`);
    }

    if (audit.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Audit must be in IN_PROGRESS status to report findings`);
    }

    if (audit.auditorId !== userId) {
      throw new ForbiddenException(`Only the assigned auditor can report findings`);
    }

    // Verify section if provided
    if (dto.sectionId) {
      const section = await tp.auditSection.findFirst({
        where: {
          id: dto.sectionId,
          template: {
            storeAudits: {
              some: { id },
            },
          },
        },
      });
      if (!section) {
        throw new BadRequestException(`Section ${dto.sectionId} not found in this audit`);
      }
    }

    const finding = await tp.auditFinding.create({
      data: {
        storeAuditId: id,
        sectionId: dto.sectionId,
        severity: dto.severity,
        title: dto.title,
        description: dto.description,
        photoUrls: dto.photoUrls ?? [],
        status: FindingStatus.OPEN,
      },
      include: {
        correctiveAction: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    await this.auditService.log(orgId, {
      entityType: AuditEntityType.AUDIT_FINDING,
      entityId: finding.id,
      action: AuditAction.CREATED,
      performedById: userId,
      performedByRole: 'OPERATIONS_MANAGER',
      notes: `Reported ${dto.severity} finding: ${dto.title}`,
    });

    this.eventsGateway.emitToStore(audit.storeId, 'audit:finding_reported', this.mapFindingToResponse(finding));
    this.eventsGateway.emitToHQ('audit:finding_reported', this.mapFindingToResponse(finding));

    return this.mapFindingToResponse(finding);
  }

  async completeAudit(orgId: string, id: string, userId: string, userRole: string): Promise<StoreAuditResponse> {
    const tp = this.prisma.forTenant(orgId);
    const audit = await tp.storeAudit.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            sections: {
              include: {
                questions: true,
              },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!audit) {
      throw new NotFoundException(`Store audit ${id} not found`);
    }

    if (audit.status !== 'IN_PROGRESS') {
      throw new BadRequestException(`Audit must be in IN_PROGRESS status to complete`);
    }

    if (audit.auditorId !== userId) {
      throw new ForbiddenException(`Only the assigned auditor can complete this audit`);
    }

    // Calculate scores
    const sections = audit.template.sections;
    let totalWeight = 0;
    let weightedTotal = 0;
    let actualScore = 0;
    let maxPossibleScore = 0;

    for (const section of sections) {
      const sectionQuestions = section.questions;
      let sectionActualScore = 0;
      let sectionMaxScore = 0;

      for (const question of sectionQuestions) {
        const answer = audit.answers.find((a) => a.questionId === question.id);
        sectionMaxScore += question.maxScore;

        if (answer) {
          if (question.questionType === QuestionType.SCORE && answer.score !== null) {
            sectionActualScore += Math.min(answer.score, question.maxScore);
          } else if (question.questionType === QuestionType.YES_NO && answer.booleanValue !== null) {
            sectionActualScore += answer.booleanValue ? question.maxScore : 0;
          }
        }
      }

      if (sectionMaxScore > 0) {
        const sectionScore = sectionActualScore / sectionMaxScore;
        weightedTotal += sectionScore * section.weight;
        totalWeight += section.weight;
        actualScore += sectionActualScore;
        maxPossibleScore += sectionMaxScore;
      }
    }

    const overallScore = totalWeight > 0 ? (weightedTotal / totalWeight) * 100 : 0;

    const updated = await tp.storeAudit.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        overallScore: Math.round(overallScore * 100) / 100,
        actualScore,
        maxPossibleScore,
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        auditor: {
          select: { id: true, name: true, email: true, role: true },
        },
        answers: true,
        findings: {
          include: {
            correctiveAction: {
              include: {
                assignedTo: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
      },
    });

    await this.auditService.log(orgId, {
      entityType: AuditEntityType.STORE_AUDIT,
      entityId: id,
      action: AuditAction.COMPLETED,
      performedById: userId,
      performedByRole: userRole,
      notes: `Completed audit with score: ${overallScore.toFixed(2)}%`,
    });

    this.eventsGateway.emitToStore(audit.storeId, 'audit:completed', this.mapAuditToResponse(updated));
    this.eventsGateway.emitToHQ('audit:completed', this.mapAuditToResponse(updated));

    // Gamification: award points for completing audit
    await this.gamificationService.onActionCompleted(
      orgId,
      GamificationActionType.AUDIT_COMPLETED,
      userId,
      'STORE_AUDIT',
      id,
    );

    // Bonus for perfect score (100%)
    if (Math.round(overallScore) === 100) {
      await this.gamificationService.onActionCompleted(
        orgId,
        GamificationActionType.PERFECT_AUDIT_SCORE,
        userId,
        'STORE_AUDIT',
        id,
      );
    }

    return this.mapAuditToResponse(updated);
  }

  // ============================================
  // CORRECTIVE ACTIONS
  // ============================================

  async createCorrectiveAction(
    orgId: string,
    findingId: string,
    dto: CreateCorrectiveActionDto,
    userId: string,
    userRole: string,
  ): Promise<CorrectiveActionResponse> {
    const tp = this.prisma.forTenant(orgId);
    const finding = await tp.auditFinding.findUnique({
      where: { id: findingId },
      include: {
        storeAudit: true,
      },
    });

    if (!finding) {
      throw new NotFoundException(`Finding ${findingId} not found`);
    }

    // Check if action already exists
    const existing = await tp.correctiveAction.findUnique({
      where: { findingId },
    });
    if (existing) {
      throw new BadRequestException(`Corrective action already exists for this finding`);
    }

    // Verify assignee exists
    const assignee = await tp.user.findUnique({
      where: { id: dto.assignedToId },
    });
    if (!assignee) {
      throw new NotFoundException(`User ${dto.assignedToId} not found`);
    }

    const action = await tp.correctiveAction.create({
      data: {
        findingId,
        assignedToId: dto.assignedToId,
        dueDate: new Date(dto.dueDate),
        description: dto.description,
        status: CorrectiveActionStatus.PENDING,
        completionPhotoUrls: [],
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Update finding status
    await tp.auditFinding.update({
      where: { id: findingId },
      data: { status: FindingStatus.ACTION_ASSIGNED },
    });

    await this.auditService.log(orgId, {
      entityType: AuditEntityType.CORRECTIVE_ACTION,
      entityId: action.id,
      action: AuditAction.ASSIGNED,
      performedById: userId,
      performedByRole: userRole,
      notes: `Assigned corrective action to ${assignee.name}`,
    });

    this.eventsGateway.emitToStore(finding.storeAudit.storeId, 'corrective_action:created', this.mapCorrectiveActionToResponse(action));
    this.eventsGateway.emitToHQ('corrective_action:created', this.mapCorrectiveActionToResponse(action));
    this.eventsGateway.emitToUser(dto.assignedToId, 'corrective_action:assigned_to_me', this.mapCorrectiveActionToResponse(action));

    return this.mapCorrectiveActionToResponse(action);
  }

  async updateCorrectiveAction(
    orgId: string,
    id: string,
    dto: UpdateCorrectiveActionDto,
    userId: string,
    userRole: string,
  ): Promise<CorrectiveActionResponse> {
    const tp = this.prisma.forTenant(orgId);
    const action = await tp.correctiveAction.findUnique({
      where: { id },
      include: {
        finding: {
          include: {
            storeAudit: true,
          },
        },
      },
    });

    if (!action) {
      throw new NotFoundException(`Corrective action ${id} not found`);
    }

    // Validate status transitions
    const currentStatus = action.status;
    const newStatus = dto.status;

    if (newStatus) {
      // PENDING -> IN_PROGRESS (assignee only)
      if (currentStatus === CorrectiveActionStatus.PENDING && newStatus === CorrectiveActionStatus.IN_PROGRESS) {
        if (action.assignedToId !== userId) {
          throw new ForbiddenException(`Only the assignee can start this action`);
        }
      }

      // IN_PROGRESS -> COMPLETED (assignee only)
      if (currentStatus === CorrectiveActionStatus.IN_PROGRESS && newStatus === CorrectiveActionStatus.COMPLETED) {
        if (action.assignedToId !== userId) {
          throw new ForbiddenException(`Only the assignee can complete this action`);
        }
        if (!dto.completionNotes && (!dto.completionPhotoUrls || dto.completionPhotoUrls.length === 0)) {
          throw new BadRequestException(`Completion notes or photos are required to complete action`);
        }
      }

      // COMPLETED -> VERIFIED (HQ only)
      if (currentStatus === CorrectiveActionStatus.COMPLETED && newStatus === CorrectiveActionStatus.VERIFIED) {
        if (!['OPERATIONS_MANAGER', 'REGIONAL_SUPERVISOR'].includes(userRole)) {
          throw new ForbiddenException(`Only HQ can verify corrective actions`);
        }
      }
    }

    const updateData: any = {};
    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === CorrectiveActionStatus.COMPLETED) {
        updateData.completedAt = new Date();
      }
    }
    if (dto.completionNotes !== undefined) updateData.completionNotes = dto.completionNotes;
    if (dto.completionPhotoUrls !== undefined) updateData.completionPhotoUrls = dto.completionPhotoUrls;

    const updated = await tp.correctiveAction.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Update finding status based on corrective action status
    if (action.findingId) {
      if (newStatus === CorrectiveActionStatus.IN_PROGRESS) {
        await tp.auditFinding.update({
          where: { id: action.findingId },
          data: { status: FindingStatus.IN_PROGRESS },
        });
      } else if (newStatus === CorrectiveActionStatus.COMPLETED) {
        await tp.auditFinding.update({
          where: { id: action.findingId },
          data: { status: FindingStatus.RESOLVED },
        });
      } else if (newStatus === CorrectiveActionStatus.VERIFIED) {
        await tp.auditFinding.update({
          where: { id: action.findingId },
          data: { status: FindingStatus.VERIFIED },
        });
      }
    }

    await this.auditService.log(orgId, {
      entityType: AuditEntityType.CORRECTIVE_ACTION,
      entityId: id,
      action: AuditAction.STATUS_CHANGED,
      performedById: userId,
      performedByRole: userRole,
      previousValue: currentStatus,
      newValue: newStatus,
    });

    this.eventsGateway.emitToStore(action.finding?.storeAudit?.storeId || '', 'corrective_action:updated', this.mapCorrectiveActionToResponse(updated));
    this.eventsGateway.emitToHQ('corrective_action:updated', this.mapCorrectiveActionToResponse(updated));

    return this.mapCorrectiveActionToResponse(updated);
  }

  // ============================================
  // QUERY & LIST
  // ============================================

  async findAll(orgId: string, query: AuditQueryDto, userId: string, userRole: string) {
    const tp = this.prisma.forTenant(orgId);
    const { page = 1, limit = 20, storeId, status, dateFrom, dateTo, auditorId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Store managers can only see their own store's audits
    if (userRole === 'STORE_MANAGER') {
      const user = await tp.user.findUnique({
        where: { id: userId },
        select: { storeId: true },
      });
      if (!user?.storeId) {
        throw new ForbiddenException(`Store manager must be assigned to a store`);
      }
      where.storeId = user.storeId;
    } else if (storeId) {
      where.storeId = storeId;
    }

    if (status) where.status = status;
    if (auditorId) where.auditorId = auditorId;

    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) where.scheduledDate.gte = new Date(dateFrom);
      if (dateTo) where.scheduledDate.lte = new Date(dateTo);
    }

    const [audits, total] = await Promise.all([
      tp.storeAudit.findMany({
        where,
        include: {
          store: {
            select: { id: true, name: true, code: true },
          },
          template: {
            select: { id: true, name: true },
          },
          auditor: {
            select: { id: true, name: true, email: true, role: true },
          },
          answers: true,
          findings: {
            include: {
              correctiveAction: {
                include: {
                  assignedTo: {
                    select: { id: true, name: true, email: true, role: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { scheduledDate: 'desc' },
        skip,
        take: limit,
      }),
      tp.storeAudit.count({ where }),
    ]);

    return {
      data: audits.map((a) => this.mapAuditToResponse(a)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(orgId: string, id: string): Promise<StoreAuditResponse> {
    const tp = this.prisma.forTenant(orgId);
    const audit = await tp.storeAudit.findUnique({
      where: { id },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        auditor: {
          select: { id: true, name: true, email: true, role: true },
        },
        template: {
          include: {
            sections: {
              include: {
                questions: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
        findings: {
          include: {
            correctiveAction: {
              include: {
                assignedTo: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
          },
        },
      },
    });

    if (!audit) {
      throw new NotFoundException(`Store audit ${id} not found`);
    }

    return this.mapAuditToResponse(audit);
  }

  // ============================================
  // DASHBOARD
  // ============================================

  async getDashboard(orgId: string, storeId?: string, dateFrom?: string, dateTo?: string): Promise<AuditDashboardResponse> {
    const tp = this.prisma.forTenant(orgId);
    const where: any = {};
    if (storeId) where.storeId = storeId;
    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) where.scheduledDate.gte = new Date(dateFrom);
      if (dateTo) where.scheduledDate.lte = new Date(dateTo);
    }

    const [
      totalAudits,
      completedAudits,
      scheduledAudits,
      inProgressAudits,
      avgScoreResult,
      openFindings,
      criticalFindings,
      overdueActions,
      scoresByStore,
    ] = await Promise.all([
      tp.storeAudit.count({ where }),
      tp.storeAudit.count({ where: { ...where, status: 'COMPLETED' } }),
      tp.storeAudit.count({ where: { ...where, status: 'SCHEDULED' } }),
      tp.storeAudit.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      tp.storeAudit.aggregate({
        where: { ...where, status: 'COMPLETED', overallScore: { not: null } },
        _avg: { overallScore: true },
      }),
      tp.auditFinding.count({
        where: {
          status: { in: [FindingStatus.OPEN, FindingStatus.ACTION_ASSIGNED, FindingStatus.IN_PROGRESS] },
          storeAudit: where.storeId ? { storeId: where.storeId } : undefined,
        },
      }),
      tp.auditFinding.count({
        where: {
          severity: 'CRITICAL',
          status: { in: [FindingStatus.OPEN, FindingStatus.ACTION_ASSIGNED, FindingStatus.IN_PROGRESS] },
          storeAudit: where.storeId ? { storeId: where.storeId } : undefined,
        },
      }),
      tp.correctiveAction.count({
        where: {
          status: CorrectiveActionStatus.OVERDUE,
        },
      }),
      // Scores by store
      tp.storeAudit.groupBy({
        by: ['storeId'],
        where: { ...where, status: 'COMPLETED', overallScore: { not: null } },
        _avg: { overallScore: true },
        _count: { id: true },
      }),
    ]);

    // Fetch store names for scores
    const storeIds = scoresByStore.map((s) => s.storeId);
    const stores = await tp.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true },
    });

    const storeMap = new Map(stores.map((s) => [s.id, s.name]));

    return {
      totalAudits,
      completedAudits,
      scheduledAudits,
      inProgressAudits,
      averageScore: avgScoreResult._avg.overallScore ?? 0,
      openFindings,
      criticalFindings,
      overdueActions,
      scoresByStore: scoresByStore.map((s) => ({
        storeId: s.storeId,
        storeName: storeMap.get(s.storeId) ?? 'Unknown',
        averageScore: s._avg.overallScore ?? 0,
        auditCount: s._count.id,
      })),
    };
  }

  // ============================================
  // MAPPERS
  // ============================================

  private mapTemplateToResponse(template: any): AuditTemplateResponse {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      isActive: template.isActive,
      sections: template.sections.map((s: any) => ({
        id: s.id,
        order: s.order,
        title: s.title,
        description: s.description,
        weight: s.weight,
        questions: s.questions.map((q: any) => ({
          id: q.id,
          order: q.order,
          text: q.text,
          questionType: q.questionType,
          maxScore: q.maxScore,
          requiresPhoto: q.requiresPhoto,
        })),
      })),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private mapAuditToResponse(audit: any): StoreAuditResponse {
    return {
      id: audit.id,
      templateId: audit.templateId,
      templateName: audit.template?.name,
      template: audit.template?.sections
        ? this.mapTemplateToResponse(audit.template)
        : undefined,
      store: audit.store,
      scheduledDate: audit.scheduledDate.toISOString().split('T')[0],
      status: audit.status,
      auditor: audit.auditor,
      startedAt: audit.startedAt,
      completedAt: audit.completedAt,
      overallScore: audit.overallScore,
      actualScore: audit.actualScore,
      maxPossibleScore: audit.maxPossibleScore,
      notes: audit.notes,
      answers: audit.answers.map((a: any) => ({
        id: a.id,
        questionId: a.questionId,
        score: a.score,
        booleanValue: a.booleanValue,
        textValue: a.textValue,
        photoUrls: a.photoUrls,
        notes: a.notes,
        createdAt: a.createdAt,
      })),
      findings: audit.findings?.map((f: any) => this.mapFindingToResponse(f)) ?? [],
      createdAt: audit.createdAt,
      updatedAt: audit.updatedAt,
    };
  }

  private mapFindingToResponse(finding: any): AuditFindingResponse {
    return {
      id: finding.id,
      storeAuditId: finding.storeAuditId,
      sectionId: finding.sectionId,
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      photoUrls: finding.photoUrls,
      status: finding.status,
      correctiveAction: finding.correctiveAction
        ? this.mapCorrectiveActionToResponse(finding.correctiveAction)
        : undefined,
      createdAt: finding.createdAt,
      updatedAt: finding.updatedAt,
    };
  }

  private mapCorrectiveActionToResponse(action: any): CorrectiveActionResponse {
    return {
      id: action.id,
      findingId: action.findingId,
      assignedTo: action.assignedTo,
      dueDate: action.dueDate.toISOString().split('T')[0],
      status: action.status,
      description: action.description,
      completionNotes: action.completionNotes,
      completionPhotoUrls: action.completionPhotoUrls,
      completedAt: action.completedAt,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    };
  }
}
