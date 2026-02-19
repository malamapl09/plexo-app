import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

const ROLE_DATA = [
  { key: 'OPERATIONS_MANAGER', label: 'Operations Manager', description: 'Full access to all system features', color: 'blue', level: 100, sortOrder: 1 },
  { key: 'HQ_TEAM', label: 'HQ Team', description: 'Central headquarters team', color: 'purple', level: 80, sortOrder: 2 },
  { key: 'REGIONAL_SUPERVISOR', label: 'Regional Supervisor', description: 'Supervises stores by region', color: 'green', level: 60, sortOrder: 3 },
  { key: 'STORE_MANAGER', label: 'Store Manager', description: 'Full management of a single store', color: 'orange', level: 40, sortOrder: 4 },
  { key: 'DEPT_SUPERVISOR', label: 'Department Supervisor', description: 'Supervises a department within a store', color: 'gray', level: 20, sortOrder: 5 },
];

const DEFAULT_MODULE_ACCESS: Record<string, Record<string, boolean>> = {
  OPERATIONS_MANAGER:  { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: true, gamification: true, reports: true, stores: true, users: true, training: true },
  HQ_TEAM:             { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: true, gamification: true, reports: true, stores: false, users: false, training: true },
  REGIONAL_SUPERVISOR: { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: false, gamification: true, reports: true, stores: false, users: false, training: true },
  STORE_MANAGER:       { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: false, gamification: true, reports: false, stores: false, users: false, training: true },
  DEPT_SUPERVISOR:     { tasks: true, receiving: true, issues: true, verification: false, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: false, gamification: true, reports: false, stores: false, users: false, training: false },
};

const POINT_CONFIGS = [
  { actionType: 'TASK_COMPLETED', points: 10, description: 'Complete a task' },
  { actionType: 'ON_TIME_COMPLETION', points: 5, description: 'Complete a task before deadline' },
  { actionType: 'ISSUE_REPORTED', points: 5, description: 'Report an issue' },
  { actionType: 'ISSUE_RESOLVED', points: 15, description: 'Resolve an issue' },
  { actionType: 'CHECKLIST_COMPLETED', points: 10, description: 'Complete a checklist' },
  { actionType: 'AUDIT_COMPLETED', points: 20, description: 'Complete an audit' },
  { actionType: 'TRAINING_COMPLETED', points: 25, description: 'Complete a training course' },
  { actionType: 'CAMPAIGN_SUBMITTED', points: 10, description: 'Submit a campaign' },
  { actionType: 'PERFECT_DAY', points: 50, description: 'Complete all tasks in a day' },
];

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async createOrganization(dto: CreateOrganizationDto) {
    const tempPassword = crypto.randomBytes(4).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Check slug uniqueness inside transaction to prevent TOCTOU race
      const existingSlug = await tx.organization.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug) {
        throw new ConflictException(`Organization slug "${dto.slug}" is already taken`);
      }

      // 2. Create the organization
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          domain: dto.domain,
          logoUrl: dto.logoUrl,
          primaryColor: dto.primaryColor ?? '#4F46E5',
          timezone: dto.timezone ?? 'America/Santo_Domingo',
          locale: dto.locale ?? 'es',
          plan: dto.plan ?? 'free',
        },
      });

      // 3. Create default roles
      await tx.role.createMany({
        data: ROLE_DATA.map((role) => ({ ...role, organizationId: org.id })),
      });

      // 4. Create default RoleModuleAccess (75 rows: 5 roles x 15 modules)
      const moduleAccessRows = Object.entries(DEFAULT_MODULE_ACCESS).flatMap(
        ([role, moduleMap]) =>
          Object.entries(moduleMap).map(([mod, hasAccess]) => ({
            role,
            module: mod,
            hasAccess,
            organizationId: org.id,
          })),
      );
      await tx.roleModuleAccess.createMany({ data: moduleAccessRows });

      // 5. Create admin user with isSuperAdmin
      const adminUser = await tx.user.create({
        data: {
          email: dto.adminEmail.toLowerCase(),
          passwordHash,
          name: dto.adminName,
          role: 'OPERATIONS_MANAGER',
          isSuperAdmin: true,
          organizationId: org.id,
        },
      });

      // 6. Create default gamification PointConfigs
      await tx.pointConfig.createMany({
        data: POINT_CONFIGS.map((config) => ({
          actionType: config.actionType,
          points: config.points,
          description: config.description,
          organizationId: org.id,
        })),
      });

      return { org, adminUser };
    });

    // Send welcome email outside the transaction (non-critical)
    try {
      await this.emailService.sendWelcome(
        dto.adminEmail,
        dto.name,
        tempPassword,
      );
    } catch (err) {
      // Log but don't fail — email is best-effort
      console.warn(`[PlatformService] Welcome email failed for ${dto.adminEmail}:`, err?.message);
    }

    return {
      id: result.org.id,
      name: result.org.name,
      slug: result.org.slug,
      domain: result.org.domain,
      plan: result.org.plan,
      isActive: result.org.isActive,
      createdAt: result.org.createdAt,
      adminUser: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        name: result.adminUser.name,
      },
    };
  }

  async listOrganizations() {
    const orgs = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            stores: true,
          },
        },
      },
    });

    return orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      domain: org.domain,
      plan: org.plan,
      isActive: org.isActive,
      primaryColor: org.primaryColor,
      timezone: org.timezone,
      locale: org.locale,
      createdAt: org.createdAt,
      _count: org._count,
    }));
  }

  async getOrganization(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            stores: true,
            roles: true,
            tasks: true,
            issues: true,
            storeAudits: true,
            trainingCourses: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${id} not found`);
    }

    return org;
  }

  async updateOrganization(id: string, dto: UpdateOrganizationDto) {
    await this.getOrganization(id); // throws 404 if not found

    return this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name,
        domain: dto.domain,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        timezone: dto.timezone,
        locale: dto.locale,
        isActive: dto.isActive,
        plan: dto.plan,
        settings: dto.settings,
      },
    });
  }

  async getStats() {
    const [totalOrgs, activeOrgs, totalUsers] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { isActive: true } }),
      this.prisma.user.count(),
    ]);

    return { totalOrgs, activeOrgs, totalUsers };
  }
}
