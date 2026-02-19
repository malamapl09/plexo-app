import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ALL_MODULES } from '../../common/constants/modules';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    const tp = this.prisma.forTenant(orgId);

    const roles = await tp.role.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Add user count per role
    const counts = await tp.user.groupBy({
      by: ['role'],
      _count: { id: true },
      where: { isActive: true },
    });
    const countMap = new Map(counts.map((c) => [c.role, c._count.id]));

    return roles.map((r) => ({
      ...r,
      userCount: countMap.get(r.key) || 0,
    }));
  }

  async findByKey(orgId: string, key: string) {
    const tp = this.prisma.forTenant(orgId);

    const role = await tp.role.findFirst({ where: { key } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return role;
  }

  async getActiveRoles(orgId: string) {
    const tp = this.prisma.forTenant(orgId);

    return tp.role.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, key: true, label: true, color: true, level: true, sortOrder: true },
    });
  }

  async create(orgId: string, dto: CreateRoleDto) {
    const tp = this.prisma.forTenant(orgId);

    // Create role + auto-create RoleModuleAccess rows (all false by default)
    try {
      const role = await this.prisma.$transaction(async (tx) => {
        const newRole = await tx.role.create({
          data: {
            key: dto.key,
            label: dto.label,
            description: dto.description,
            color: dto.color || 'gray',
            level: dto.level,
            sortOrder: dto.sortOrder ?? 0,
          },
        });

        // Auto-create module access rows (all disabled)
        await tx.roleModuleAccess.createMany({
          data: ALL_MODULES.map((mod) => ({
            role: newRole.key,
            module: mod,
            hasAccess: false,
          })),
        });

        return newRole;
      });

      return role;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un rol con esta clave: ' + dto.key);
      }
      throw error;
    }
  }

  async update(orgId: string, id: string, dto: UpdateRoleDto) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Rol no encontrado');

    return tp.role.update({
      where: { id },
      data: {
        label: dto.label,
        description: dto.description,
        color: dto.color,
        level: dto.level,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async deactivate(orgId: string, id: string) {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.role.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Rol no encontrado');

    // Check if any active users have this role
    const usersWithRole = await tp.user.count({
      where: { role: existing.key, isActive: true },
    });

    if (usersWithRole > 0) {
      throw new BadRequestException(
        `No se puede desactivar este rol porque ${usersWithRole} usuario(s) activo(s) lo tienen asignado`,
      );
    }

    return tp.role.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
