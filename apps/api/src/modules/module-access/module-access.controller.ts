import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ModuleAccessService } from './module-access.service';
import { UpdateModuleAccessDto } from './dto/update-module-access.dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('module-access')
@ApiBearerAuth('JWT-auth')
@Controller('module-access')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModuleAccessController {
  constructor(
    private readonly moduleAccessService: ModuleAccessService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('my-modules')
  @ApiOperation({ summary: 'Get accessible modules for current user' })
  async getMyModules(@Request() req: any) {
    const orgId = req.user.organizationId;
    // Super admins get all modules
    if (req.user.isSuperAdmin) {
      return {
        modules: [
          'tasks', 'receiving', 'issues', 'verification', 'checklists',
          'audits', 'corrective_actions', 'planograms', 'communications',
          'gamification', 'reports', 'stores', 'users',
        ],
      };
    }

    const modules = await this.moduleAccessService.getAccessibleModules(
      orgId,
      req.user.role,
    );
    return { modules };
  }

  @Get('grid')
  @ApiOperation({ summary: 'Get full role-module access grid (admin only)' })
  async getGrid(@Request() req: any) {
    const orgId = req.user.organizationId;
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Solo super administradores pueden ver la grilla de permisos');
    }
    return this.moduleAccessService.getFullGrid(orgId);
  }

  @Patch(':role')
  @ApiOperation({ summary: 'Bulk update module access for a role (admin only)' })
  async updateForRole(
    @Request() req: any,
    @Param('role') role: string,
    @Body() dto: UpdateModuleAccessDto,
  ) {
    const orgId = req.user.organizationId;
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Solo super administradores pueden modificar permisos');
    }

    // Validate role exists in DB
    const dbRole = await this.prisma.forTenant(orgId).role.findFirst({ where: { key: role } });
    if (!dbRole) {
      throw new ForbiddenException('Rol invalido');
    }

    await this.moduleAccessService.bulkUpdateForRole(
      orgId,
      role,
      dto.modules,
    );

    return { message: 'Permisos actualizados' };
  }
}
