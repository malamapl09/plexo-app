import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreTier } from '@prisma/client';

@Injectable()
export class StoresService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(orgId: string, createStoreDto: CreateStoreDto, performedById: string, performedByRole: string) {
    const tp = this.prisma.forTenant(orgId);

    const store = await tp.store.create({
      data: createStoreDto,
      include: {
        region: true,
      },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'STORE',
      entityId: store.id,
      action: 'CREATED',
      performedById,
      performedByRole,
      newValue: { name: store.name, code: store.code, regionId: store.regionId },
    });

    return store;
  }

  async findAll(orgId: string, regionId?: string) {
    const tp = this.prisma.forTenant(orgId);

    return tp.store.findMany({
      where: {
        regionId,
        isActive: true,
      },
      include: {
        region: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const tp = this.prisma.forTenant(orgId);

    const store = await tp.store.findUnique({
      where: { id },
      include: {
        region: true,
        users: {
          select: {
            id: true,
            name: true,
            role: true,
            department: true,
          },
        },
        storeDepartments: {
          where: { isActive: true },
          include: { department: true },
        },
      },
    }) as any;

    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }

    return store;
  }

  async update(orgId: string, id: string, updateStoreDto: UpdateStoreDto, performedById: string, performedByRole: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await this.findOne(orgId, id);

    const updated = await tp.store.update({
      where: { id },
      data: updateStoreDto,
      include: {
        region: true,
      },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'STORE',
      entityId: id,
      action: 'UPDATED',
      performedById,
      performedByRole,
      previousValue: { name: existing.name },
      newValue: updateStoreDto,
    });

    return updated;
  }

  async remove(orgId: string, id: string, performedById: string, performedByRole: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await this.findOne(orgId, id);

    const result = await tp.store.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'STORE',
      entityId: id,
      action: 'DELETED',
      performedById,
      performedByRole,
      previousValue: { isActive: true },
      newValue: { isActive: false },
      notes: `Store ${existing.name} deactivated`,
    });

    return result;
  }

  async findAllRegions(orgId: string) {
    const tp = this.prisma.forTenant(orgId);

    return tp.region.findMany({
      include: {
        supervisor: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { stores: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findAllDepartments(orgId: string) {
    const tp = this.prisma.forTenant(orgId);

    return tp.department.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // ============================================
  // STORE TIER MANAGEMENT
  // ============================================

  calculateTierFromCount(employeeCount: number): StoreTier {
    if (employeeCount <= 15) return 'SMALL';
    if (employeeCount <= 40) return 'MEDIUM';
    return 'LARGE';
  }

  async calculateStoreTier(orgId: string, storeId: string): Promise<StoreTier> {
    const tp = this.prisma.forTenant(orgId);

    const count = await tp.user.count({
      where: { storeId, isActive: true },
    });
    return this.calculateTierFromCount(count);
  }

  async updateStoreTier(
    orgId: string,
    storeId: string,
    tier: StoreTier,
    override: boolean,
    performedById: string,
    performedByRole: string,
  ) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await this.findOne(orgId, storeId);

    const updated = await tp.store.update({
      where: { id: storeId },
      data: { tier, tierOverride: override },
      include: { region: true },
    });

    await this.auditService.log(orgId, {
      entityType: 'STORE',
      entityId: storeId,
      action: 'UPDATED',
      performedById,
      performedByRole,
      previousValue: { tier: existing.tier, tierOverride: existing.tierOverride },
      newValue: { tier, tierOverride: override },
      notes: `Store tier updated to ${tier}${override ? ' (locked)' : ''}`,
    });

    return updated;
  }

  // ============================================
  // STORE DEPARTMENT MANAGEMENT
  // ============================================

  async getStoreDepartments(orgId: string, storeId: string) {
    const tp = this.prisma.forTenant(orgId);

    await this.findOne(orgId, storeId); // ensure store exists
    return tp.storeDepartment.findMany({
      where: { storeId },
      include: {
        department: true,
      },
      orderBy: { department: { name: 'asc' } },
    });
  }

  async updateStoreDepartments(
    orgId: string,
    storeId: string,
    departmentIds: string[],
    performedById: string,
    performedByRole: string,
  ) {
    const tp = this.prisma.forTenant(orgId);

    await this.findOne(orgId, storeId); // ensure store exists

    // Deactivate all current departments
    await tp.storeDepartment.updateMany({
      where: { storeId },
      data: { isActive: false },
    });

    // Upsert each selected department as active
    for (const departmentId of departmentIds) {
      await tp.storeDepartment.upsert({
        where: { storeId_departmentId: { storeId, departmentId } },
        update: { isActive: true },
        create: { storeId, departmentId, isActive: true },
      });
    }

    await this.auditService.log(orgId, {
      entityType: 'STORE',
      entityId: storeId,
      action: 'UPDATED',
      performedById,
      performedByRole,
      newValue: { activeDepartmentIds: departmentIds },
      notes: `Store departments updated: ${departmentIds.length} active`,
    });

    return this.getStoreDepartments(orgId, storeId);
  }
}
