import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles with user counts (super admin)' })
  async findAll(@Request() req: any) {
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Solo super administradores pueden ver todos los roles');
    }
    return this.rolesService.findAll(req.user.organizationId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active roles (for dropdowns, any authenticated user)' })
  async getActive(@Request() req: any) {
    return this.rolesService.getActiveRoles(req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role (super admin)' })
  async create(@Request() req: any, @Body() dto: CreateRoleDto) {
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Solo super administradores pueden crear roles');
    }
    return this.rolesService.create(req.user.organizationId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role (super admin)' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Solo super administradores pueden modificar roles');
    }
    return this.rolesService.update(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a role (super admin)' })
  async deactivate(@Request() req: any, @Param('id') id: string) {
    if (!req.user.isSuperAdmin) {
      throw new ForbiddenException('Solo super administradores pueden desactivar roles');
    }
    return this.rolesService.deactivate(req.user.organizationId, id);
  }
}
