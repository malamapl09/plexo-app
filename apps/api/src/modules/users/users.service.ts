import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(orgId: string, createUserDto: CreateUserDto, performedById: string, performedByRole: string) {
    const tp = this.prisma.forTenant(orgId);

    const existingUser = await tp.user.findFirst({
      where: { email: createUserDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este correo');
    }

    // Validate role exists in DB
    const role = await tp.role.findFirst({ where: { key: createUserDto.role } });
    if (!role) {
      throw new ConflictException('Rol inválido: ' + createUserDto.role);
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await tp.user.create({
      data: {
        email: createUserDto.email.toLowerCase(),
        passwordHash,
        name: createUserDto.name,
        role: createUserDto.role,
        storeId: createUserDto.storeId,
        departmentId: createUserDto.departmentId,
        issueCategories: createUserDto.issueCategories || [],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        departmentId: true,
        isActive: true,
        issueCategories: true,
        createdAt: true,
        store: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    // Audit log (exclude passwordHash from newValue)
    await this.auditService.log(orgId, {
      entityType: 'USER',
      entityId: user.id,
      action: 'CREATED',
      performedById,
      performedByRole,
      newValue: { email: user.email, name: user.name, role: user.role, storeId: user.storeId },
    });

    return user;
  }

  async findAll(orgId: string, filters?: {
    role?: string;
    storeId?: string;
    departmentId?: string;
    isActive?: boolean;
  }) {
    const tp = this.prisma.forTenant(orgId);

    return tp.user.findMany({
      where: {
        role: filters?.role,
        storeId: filters?.storeId,
        departmentId: filters?.departmentId,
        isActive: filters?.isActive ?? true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        departmentId: true,
        isActive: true,
        issueCategories: true,
        createdAt: true,
        store: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(orgId: string, id: string) {
    const tp = this.prisma.forTenant(orgId);

    const user = await tp.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        departmentId: true,
        isActive: true,
        issueCategories: true,
        createdAt: true,
        store: {
          select: { id: true, name: true, code: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(orgId: string, email: string) {
    const tp = this.prisma.forTenant(orgId);

    return tp.user.findFirst({
      where: { email: email.toLowerCase() },
    });
  }

  async update(orgId: string, id: string, updateUserDto: UpdateUserDto, performedById: string, performedByRole: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await this.findOne(orgId, id);

    // Validate role exists if being updated
    if (updateUserDto.role) {
      const role = await tp.role.findFirst({ where: { key: updateUserDto.role } });
      if (!role) {
        throw new ConflictException('Rol inválido: ' + updateUserDto.role);
      }
    }

    const data: any = { ...updateUserDto };

    const updated = await tp.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        departmentId: true,
        isActive: true,
        issueCategories: true,
        createdAt: true,
        store: {
          select: { id: true, name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    // Audit log (exclude passwordHash)
    const { password, ...safeDto } = updateUserDto as any;
    await this.auditService.log(orgId, {
      entityType: 'USER',
      entityId: id,
      action: 'UPDATED',
      performedById,
      performedByRole,
      previousValue: { name: existing.name, role: existing.role, storeId: existing.storeId },
      newValue: safeDto,
    });

    return updated;
  }

  async remove(orgId: string, id: string, performedById: string, performedByRole: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await this.findOne(orgId, id);

    // Soft delete - just deactivate
    const result = await tp.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'USER',
      entityId: id,
      action: 'DELETED',
      performedById,
      performedByRole,
      previousValue: { isActive: true },
      newValue: { isActive: false },
      notes: `User ${existing.name} deactivated`,
    });

    return result;
  }
}
