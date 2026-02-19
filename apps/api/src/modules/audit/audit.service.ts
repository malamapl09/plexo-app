import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditEntityType } from '@prisma/client';

interface LogAuditParams {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  performedById: string;
  performedByRole: string;
  previousValue?: any;
  newValue?: any;
  fieldChanged?: string;
  notes?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(orgId: string, params: LogAuditParams) {
    const tp = this.prisma.forTenant(orgId);
    return tp.auditLog.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        performedById: params.performedById,
        performedByRole: params.performedByRole,
        previousValue: params.previousValue || null,
        newValue: params.newValue || null,
        fieldChanged: params.fieldChanged,
        notes: params.notes,
      },
      include: {
        performedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async getEntityHistory(
    orgId: string,
    entityType: AuditEntityType,
    entityId: string,
    options?: { limit?: number; offset?: number },
  ) {
    const tp = this.prisma.forTenant(orgId);
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const [entries, total] = await Promise.all([
      tp.auditLog.findMany({
        where: { entityType, entityId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          performedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      tp.auditLog.count({
        where: { entityType, entityId },
      }),
    ]);

    return { entries, total };
  }

  async getUserActions(
    orgId: string,
    userId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number; offset?: number },
  ) {
    const tp = this.prisma.forTenant(orgId);
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    const where: any = { performedById: userId };
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [entries, total] = await Promise.all([
      tp.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          performedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      tp.auditLog.count({ where }),
    ]);

    return { entries, total };
  }

  async getRecentActivity(orgId: string, options?: {
    storeId?: string;
    limit?: number;
    offset?: number;
  }) {
    const tp = this.prisma.forTenant(orgId);
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    // Get recent audit logs with optional store filter
    let where: any = {};

    if (options?.storeId) {
      // Get task assignments and issues for this store
      const [taskAssignments, issues] = await Promise.all([
        tp.taskAssignment.findMany({
          where: { storeId: options.storeId },
          select: { id: true },
        }),
        tp.issue.findMany({
          where: { storeId: options.storeId },
          select: { id: true },
        }),
      ]);

      const taskIds = taskAssignments.map((t) => t.id);
      const issueIds = issues.map((i) => i.id);

      where = {
        OR: [
          { entityType: 'TASK_ASSIGNMENT', entityId: { in: taskIds } },
          { entityType: 'ISSUE', entityId: { in: issueIds } },
        ],
      };
    }

    const [entries, total] = await Promise.all([
      tp.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          performedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      tp.auditLog.count({ where }),
    ]);

    return { entries, total };
  }
}
