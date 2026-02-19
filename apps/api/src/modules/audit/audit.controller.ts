import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { AuditService } from './audit.service';
import { AuditQueryDto, ActivityQueryDto } from './dto/audit-query.dto';
import { AuditEntityType } from '@prisma/client';

interface CurrentUserPayload {
  sub: string;
  email: string;
  role: string;
  storeId?: string;
}

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('entity/:entityType/:entityId')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Get audit history for an entity' })
  @ApiParam({ name: 'entityType', enum: ['TASK_ASSIGNMENT', 'ISSUE'] })
  async getEntityHistory(
    @CurrentOrg() orgId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query() query: AuditQueryDto,
  ) {
    const type = entityType.toUpperCase() as AuditEntityType;
    if (!['TASK_ASSIGNMENT', 'ISSUE'].includes(type)) {
      throw new ForbiddenException('Tipo de entidad inválido');
    }

    return this.auditService.getEntityHistory(orgId, type, entityId, {
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Get('user/:userId')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Get all actions performed by a user' })
  async getUserActions(
    @CurrentOrg() orgId: string,
    @Param('userId') userId: string,
    @Query() query: AuditQueryDto,
  ) {
    return this.auditService.getUserActions(orgId, userId, {
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Get('activity')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Get recent activity feed' })
  async getRecentActivity(
    @CurrentOrg() orgId: string,
    @Query() query: ActivityQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Store managers can only see their own store's activity
    let storeId = query.storeId;
    if (user.role === 'STORE_MANAGER' && user.storeId) {
      storeId = user.storeId;
    }

    return this.auditService.getRecentActivity(orgId, {
      storeId,
      limit: query.limit,
      offset: query.offset,
    });
  }
}
