import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
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
import { VerificationService } from './verification.service';
import {
  VerifyTaskDto,
  RejectTaskDto,
  VerifyIssueDto,
  RejectIssueDto,
  PendingVerificationQueryDto,
} from './dto/verification.dto';
import { AuditEntityType } from '@prisma/client';

interface CurrentUserPayload {
  sub: string;
  email: string;
  role: string;
  storeId?: string;
}

@ApiTags('verification')
@Controller('verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('pending')
  @Roles('STORE_MANAGER', 'REGIONAL_SUPERVISOR', 'HQ_TEAM', 'OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Obtener items pendientes de verificacion' })
  async getPendingVerifications(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: PendingVerificationQueryDto,
  ) {
    return this.verificationService.getPendingVerifications(
      orgId,
      user.sub,
      user.role,
      query.storeId || user.storeId,
    );
  }

  @Post('tasks/:assignmentId/verify')
  @Roles('STORE_MANAGER', 'REGIONAL_SUPERVISOR', 'HQ_TEAM', 'OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Verificar (aprobar) una tarea completada' })
  async verifyTask(
    @CurrentOrg() orgId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: VerifyTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.verificationService.verifyTask(
      orgId,
      assignmentId,
      user.sub,
      user.role,
      dto.notes,
    );
  }

  @Post('tasks/:assignmentId/reject')
  @Roles('STORE_MANAGER', 'REGIONAL_SUPERVISOR', 'HQ_TEAM', 'OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Rechazar una tarea completada (necesita rehacerse)' })
  async rejectTask(
    @CurrentOrg() orgId: string,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: RejectTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.verificationService.rejectTask(
      orgId,
      assignmentId,
      user.sub,
      user.role,
      dto.rejectionReason,
    );
  }

  @Post('issues/:issueId/verify')
  @Roles('STORE_MANAGER', 'REGIONAL_SUPERVISOR', 'HQ_TEAM', 'OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Verificar (aprobar) una incidencia resuelta' })
  async verifyIssue(
    @CurrentOrg() orgId: string,
    @Param('issueId') issueId: string,
    @Body() dto: VerifyIssueDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.verificationService.verifyIssue(
      orgId,
      issueId,
      user.sub,
      user.role,
      dto.notes,
    );
  }

  @Post('issues/:issueId/reject')
  @Roles('STORE_MANAGER', 'REGIONAL_SUPERVISOR', 'HQ_TEAM', 'OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Rechazar una incidencia resuelta (necesita rehacerse)' })
  async rejectIssue(
    @CurrentOrg() orgId: string,
    @Param('issueId') issueId: string,
    @Body() dto: RejectIssueDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.verificationService.rejectIssue(
      orgId,
      issueId,
      user.sub,
      user.role,
      dto.rejectionReason,
    );
  }

  @Get('history/:entityType/:entityId')
  @ApiOperation({ summary: 'Obtener historial de verificacion de una entidad' })
  @ApiParam({ name: 'entityType', enum: ['TASK_ASSIGNMENT', 'ISSUE'] })
  async getVerificationHistory(
    @CurrentOrg() orgId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const type = entityType.toUpperCase() as AuditEntityType;
    return this.verificationService.getVerificationHistory(orgId, type, entityId);
  }
}
