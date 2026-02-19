import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ALL_MODULES } from '../../common/constants/modules';

@Injectable()
export class ModuleAccessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns the list of module keys a given role can access.
   * Super admins bypass this entirely (handled at caller level).
   */
  async getAccessibleModules(orgId: string, role: string): Promise<string[]> {
    const tp = this.prisma.forTenant(orgId);
    const rows = await tp.roleModuleAccess.findMany({
      where: { role, hasAccess: true },
      select: { module: true },
    });
    return rows.map((r) => r.module);
  }

  /**
   * Returns the full role-module grid for the admin UI.
   * Now fetches roles from the DB instead of the enum.
   */
  async getFullGrid(orgId: string): Promise<
    Record<string, Record<string, boolean>>
  > {
    const tp = this.prisma.forTenant(orgId);
    const roles = await tp.role.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { key: true },
    });

    const rows = await tp.roleModuleAccess.findMany({
      orderBy: [{ role: 'asc' }, { module: 'asc' }],
    });

    const grid: Record<string, Record<string, boolean>> = {};
    for (const role of roles) {
      grid[role.key] = {};
      for (const mod of ALL_MODULES) {
        grid[role.key][mod] = false;
      }
    }

    for (const row of rows) {
      if (grid[row.role]) {
        grid[row.role][row.module] = row.hasAccess;
      }
    }

    return grid;
  }

  /**
   * Bulk update module access for a single role.
   */
  async bulkUpdateForRole(
    orgId: string,
    role: string,
    modules: Record<string, boolean>,
  ): Promise<void> {
    const tp = this.prisma.forTenant(orgId);
    const operations = Object.entries(modules)
      .filter(([mod]) => ALL_MODULES.includes(mod))
      .map(([mod, hasAccess]) =>
        tp.roleModuleAccess.upsert({
          where: { role_module: { role, module: mod } },
          update: { hasAccess },
          create: { role, module: mod, hasAccess },
        }),
      );

    await this.prisma.$transaction(operations);
  }
}
