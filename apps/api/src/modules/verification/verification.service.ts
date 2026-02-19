import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditEntityType, VerificationStatus } from '@prisma/client';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // DB-driven: fetch role level from the roles table
  private async getRoleLevel(orgId: string, roleKey: string): Promise<number> {
    const tp = this.prisma.forTenant(orgId);
    const role = await tp.role.findFirst({ where: { key: roleKey } });
    if (!role) {
      throw new BadRequestException(`Rol no encontrado: ${roleKey}`);
    }
    return role.level;
  }

  // Check if verification is required based on completer's role
  async requiresVerification(orgId: string, completerRole: string): Promise<boolean> {
    const tp = this.prisma.forTenant(orgId);
    const roles = await tp.role.findMany({
      where: { isActive: true },
      select: { key: true, level: true },
    });
    if (roles.length === 0) return false;
    const completerLevel = roles.find((r) => r.key === completerRole)?.level ?? 0;
    const maxLevel = Math.max(...roles.map((r) => r.level));
    return completerLevel < maxLevel;
  }

  // Check if verifier can verify submitter's work (verifier must have higher level)
  async canVerify(orgId: string, verifierRole: string, submitterRole: string): Promise<boolean> {
    const tp = this.prisma.forTenant(orgId);
    const roles = await tp.role.findMany({
      where: { key: { in: [verifierRole, submitterRole] } },
      select: { key: true, level: true },
    });
    const verifierLevel = roles.find((r) => r.key === verifierRole)?.level ?? 0;
    const submitterLevel = roles.find((r) => r.key === submitterRole)?.level ?? 0;
    return verifierLevel > submitterLevel;
  }

  // Get pending verifications for a user
  async getPendingVerifications(
    orgId: string,
    userId: string,
    userRole: string,
    storeId?: string,
  ) {
    const tp = this.prisma.forTenant(orgId);
    // Determine which roles this user can verify (roles with lower level)
    const userLevel = await this.getRoleLevel(orgId, userRole);
    const lowerRoles = await tp.role.findMany({
      where: { isActive: true, level: { lt: userLevel } },
      select: { key: true },
    });
    const rolesCanVerify = lowerRoles.map((r) => r.key);

    if (rolesCanVerify.length === 0) {
      return { tasks: [], issues: [], totalCount: 0 };
    }

    // Get pending task verifications
    const taskWhere: any = {
      status: 'PENDING_VERIFICATION',
      verificationStatus: 'PENDING',
      completedBy: {
        role: { in: rolesCanVerify },
      },
    };
    if (storeId) {
      taskWhere.storeId = storeId;
    }

    const pendingTasks = await tp.taskAssignment.findMany({
      where: taskWhere,
      include: {
        task: {
          select: { id: true, title: true, description: true, priority: true },
        },
        store: {
          select: { id: true, name: true, code: true },
        },
        completedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Get pending issue verifications
    const issueWhere: any = {
      status: 'PENDING_VERIFICATION',
      verificationStatus: 'PENDING',
      resolvedBy: {
        role: { in: rolesCanVerify },
      },
    };
    if (storeId) {
      issueWhere.storeId = storeId;
    }

    const pendingIssues = await tp.issue.findMany({
      where: issueWhere,
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        resolvedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        reportedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { resolvedAt: 'desc' },
    });

    return {
      tasks: pendingTasks.map((t) => ({
        entityType: 'TASK_ASSIGNMENT' as const,
        entityId: t.id,
        title: t.task.title,
        description: t.task.description,
        priority: t.task.priority,
        store: t.store,
        submittedBy: t.completedBy,
        submittedAt: t.completedAt,
        notes: t.notes,
        photoUrls: t.photoUrls,
      })),
      issues: pendingIssues.map((i) => ({
        entityType: 'ISSUE' as const,
        entityId: i.id,
        title: i.title,
        description: i.description,
        category: i.category,
        priority: i.priority,
        store: i.store,
        submittedBy: i.resolvedBy,
        submittedAt: i.resolvedAt,
        notes: i.resolutionNotes,
        photoUrls: i.photoUrls,
      })),
      totalCount: pendingTasks.length + pendingIssues.length,
    };
  }

  // Verify (approve) a task
  async verifyTask(
    orgId: string,
    taskAssignmentId: string,
    verifierId: string,
    verifierRole: string,
    notes?: string,
  ) {
    const tp = this.prisma.forTenant(orgId);
    const assignment = await tp.taskAssignment.findUnique({
      where: { id: taskAssignmentId },
      include: {
        completedBy: { select: { id: true, name: true, role: true } },
        task: { select: { id: true, title: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Asignacion de tarea no encontrada');
    }

    if (assignment.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('Esta tarea no esta pendiente de verificacion');
    }

    if (!assignment.completedBy) {
      throw new BadRequestException('No se puede verificar una tarea sin completador');
    }

    // Check hierarchy
    if (!(await this.canVerify(orgId, verifierRole, assignment.completedBy.role))) {
      throw new ForbiddenException(
        'No tienes permisos para verificar tareas completadas por este rol',
      );
    }

    const previousState = { ...assignment };

    const updated = await tp.taskAssignment.update({
      where: { id: taskAssignmentId },
      data: {
        status: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        verifiedById: verifierId,
        verifiedAt: new Date(),
      },
      include: {
        task: true,
        store: { select: { id: true, name: true, code: true } },
        completedBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });

    // Log audit
    await this.auditService.log(orgId, {
      entityType: 'TASK_ASSIGNMENT',
      entityId: taskAssignmentId,
      action: 'VERIFIED',
      performedById: verifierId,
      performedByRole: verifierRole,
      previousValue: previousState,
      newValue: updated,
      fieldChanged: 'status',
      notes,
    });

    // Create verification record
    await tp.verification.create({
      data: {
        entityType: 'TASK_ASSIGNMENT',
        entityId: taskAssignmentId,
        submittedById: assignment.completedById!,
        submittedByRole: assignment.completedBy.role,
        submittedAt: assignment.completedAt || new Date(),
        status: 'VERIFIED',
        verifiedById: verifierId,
        verifiedByRole: verifierRole,
        verifiedAt: new Date(),
      },
    });

    return updated;
  }

  // Reject a task
  async rejectTask(
    orgId: string,
    taskAssignmentId: string,
    verifierId: string,
    verifierRole: string,
    rejectionReason: string,
  ) {
    const tp = this.prisma.forTenant(orgId);
    const assignment = await tp.taskAssignment.findUnique({
      where: { id: taskAssignmentId },
      include: {
        completedBy: { select: { id: true, name: true, role: true } },
        task: { select: { id: true, title: true } },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Asignacion de tarea no encontrada');
    }

    if (assignment.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('Esta tarea no esta pendiente de verificacion');
    }

    if (!assignment.completedBy) {
      throw new BadRequestException('No se puede rechazar una tarea sin completador');
    }

    // Check hierarchy
    if (!(await this.canVerify(orgId, verifierRole, assignment.completedBy.role))) {
      throw new ForbiddenException(
        'No tienes permisos para rechazar tareas completadas por este rol',
      );
    }

    const previousState = { ...assignment };

    const updated = await tp.taskAssignment.update({
      where: { id: taskAssignmentId },
      data: {
        status: 'REJECTED',
        verificationStatus: 'REJECTED',
        verifiedById: verifierId,
        verifiedAt: new Date(),
        rejectionReason,
      },
      include: {
        task: true,
        store: { select: { id: true, name: true, code: true } },
        completedBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
      },
    });

    // Log audit
    await this.auditService.log(orgId, {
      entityType: 'TASK_ASSIGNMENT',
      entityId: taskAssignmentId,
      action: 'REJECTED',
      performedById: verifierId,
      performedByRole: verifierRole,
      previousValue: previousState,
      newValue: updated,
      fieldChanged: 'status',
      notes: rejectionReason,
    });

    // Create verification record
    await tp.verification.create({
      data: {
        entityType: 'TASK_ASSIGNMENT',
        entityId: taskAssignmentId,
        submittedById: assignment.completedById!,
        submittedByRole: assignment.completedBy.role,
        submittedAt: assignment.completedAt || new Date(),
        status: 'REJECTED',
        verifiedById: verifierId,
        verifiedByRole: verifierRole,
        verifiedAt: new Date(),
        rejectionReason,
      },
    });

    return updated;
  }

  // Verify (approve) an issue
  async verifyIssue(
    orgId: string,
    issueId: string,
    verifierId: string,
    verifierRole: string,
    notes?: string,
  ) {
    const tp = this.prisma.forTenant(orgId);
    const issue = await tp.issue.findUnique({
      where: { id: issueId },
      include: {
        resolvedBy: { select: { id: true, name: true, role: true } },
      },
    });

    if (!issue) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    if (issue.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('Esta incidencia no esta pendiente de verificacion');
    }

    if (!issue.resolvedBy) {
      throw new BadRequestException('No se puede verificar una incidencia sin resolver');
    }

    // Check hierarchy
    if (!(await this.canVerify(orgId, verifierRole, issue.resolvedBy.role))) {
      throw new ForbiddenException(
        'No tienes permisos para verificar incidencias resueltas por este rol',
      );
    }

    const previousState = { ...issue };

    const updated = await tp.issue.update({
      where: { id: issueId },
      data: {
        status: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        verifiedById: verifierId,
        verifiedAt: new Date(),
      },
      include: {
        store: { select: { id: true, name: true, code: true } },
        resolvedBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Log audit
    await this.auditService.log(orgId, {
      entityType: 'ISSUE',
      entityId: issueId,
      action: 'VERIFIED',
      performedById: verifierId,
      performedByRole: verifierRole,
      previousValue: previousState,
      newValue: updated,
      fieldChanged: 'status',
      notes,
    });

    // Create verification record
    await tp.verification.create({
      data: {
        entityType: 'ISSUE',
        entityId: issueId,
        submittedById: issue.resolvedById!,
        submittedByRole: issue.resolvedBy.role,
        submittedAt: issue.resolvedAt || new Date(),
        status: 'VERIFIED',
        verifiedById: verifierId,
        verifiedByRole: verifierRole,
        verifiedAt: new Date(),
      },
    });

    return updated;
  }

  // Reject an issue
  async rejectIssue(
    orgId: string,
    issueId: string,
    verifierId: string,
    verifierRole: string,
    rejectionReason: string,
  ) {
    const tp = this.prisma.forTenant(orgId);
    const issue = await tp.issue.findUnique({
      where: { id: issueId },
      include: {
        resolvedBy: { select: { id: true, name: true, role: true } },
      },
    });

    if (!issue) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    if (issue.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException('Esta incidencia no esta pendiente de verificacion');
    }

    if (!issue.resolvedBy) {
      throw new BadRequestException('No se puede rechazar una incidencia sin resolver');
    }

    // Check hierarchy
    if (!(await this.canVerify(orgId, verifierRole, issue.resolvedBy.role))) {
      throw new ForbiddenException(
        'No tienes permisos para rechazar incidencias resueltas por este rol',
      );
    }

    const previousState = { ...issue };

    const updated = await tp.issue.update({
      where: { id: issueId },
      data: {
        status: 'REJECTED',
        verificationStatus: 'REJECTED',
        verifiedById: verifierId,
        verifiedAt: new Date(),
        rejectionReason,
      },
      include: {
        store: { select: { id: true, name: true, code: true } },
        resolvedBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Log audit
    await this.auditService.log(orgId, {
      entityType: 'ISSUE',
      entityId: issueId,
      action: 'REJECTED',
      performedById: verifierId,
      performedByRole: verifierRole,
      previousValue: previousState,
      newValue: updated,
      fieldChanged: 'status',
      notes: rejectionReason,
    });

    // Create verification record
    await tp.verification.create({
      data: {
        entityType: 'ISSUE',
        entityId: issueId,
        submittedById: issue.resolvedById!,
        submittedByRole: issue.resolvedBy.role,
        submittedAt: issue.resolvedAt || new Date(),
        status: 'REJECTED',
        verifiedById: verifierId,
        verifiedByRole: verifierRole,
        verifiedAt: new Date(),
        rejectionReason,
      },
    });

    return updated;
  }

  // Get verification history for an entity
  async getVerificationHistory(orgId: string, entityType: AuditEntityType, entityId: string) {
    const tp = this.prisma.forTenant(orgId);
    return tp.verification.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        verifiedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
