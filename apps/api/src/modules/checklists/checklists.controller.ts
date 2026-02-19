import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChecklistsService } from './checklists.service';
import {
  CreateChecklistTemplateDto,
  UpdateChecklistTemplateDto,
  RespondChecklistItemDto,
  ChecklistQueryDto,
  SubmissionQueryDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@ApiTags('checklists')
@Controller('checklists')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  // ==================== Templates ====================

  @Post()
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Crear plantilla de checklist (Solo HQ)' })
  @ApiResponse({ status: 201, description: 'Plantilla creada' })
  async createTemplate(
    @Body() dto: CreateChecklistTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.createTemplate(user.organizationId, dto, user.sub, user.role as any);
  }

  @Get('dashboard')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Dashboard de cumplimiento de checklists' })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  async getDashboard(
    @CurrentUser() user: CurrentUserPayload,
    @Query('storeId') storeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.checklistsService.getDashboard(user.organizationId, storeId, dateFrom, dateTo);
  }

  @Get('submissions')
  @ApiOperation({ summary: 'Listar submissions con filtros' })
  async findAllSubmissions(
    @Query() query: SubmissionQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.findAllSubmissions(user.organizationId, query);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Obtener checklists asignados a una tienda (Mobile)' })
  @ApiParam({ name: 'storeId' })
  async getStoreChecklists(
    @Param('storeId') storeId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.getStoreChecklists(user.organizationId, storeId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar plantillas de checklists' })
  async findAllTemplates(
    @Query() query: ChecklistQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.findAllTemplates(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plantilla de checklist por ID' })
  @ApiParam({ name: 'id' })
  async findOneTemplate(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.findOneTemplate(user.organizationId, id);
  }

  @Patch(':id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Actualizar plantilla de checklist (Solo HQ)' })
  @ApiParam({ name: 'id' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateChecklistTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.updateTemplate(user.organizationId, id, dto, user.sub, user.role as any);
  }

  @Delete(':id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar plantilla de checklist (Solo HQ)' })
  @ApiParam({ name: 'id' })
  async removeTemplate(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.removeTemplate(user.organizationId, id, user.sub, user.role as any);
  }

  // ==================== Submissions ====================

  @Post(':id/submit')
  @ApiOperation({ summary: 'Iniciar submission de checklist para hoy' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  async startSubmission(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.startSubmission(user.organizationId, id, user.storeId!, user.sub);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Obtener detalle de una submission' })
  @ApiParam({ name: 'id', description: 'Submission ID' })
  async findOneSubmission(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.findOneSubmission(user.organizationId, id);
  }

  @Post('submissions/:id/respond')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Responder a un item del checklist' })
  @ApiParam({ name: 'id', description: 'Submission ID' })
  async respondToItem(
    @Param('id') id: string,
    @Body() dto: RespondChecklistItemDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.respondToItem(user.organizationId, id, dto, user.sub);
  }

  @Post('submissions/:id/complete')
  @ApiOperation({ summary: 'Completar submission de checklist' })
  @ApiParam({ name: 'id', description: 'Submission ID' })
  async completeSubmission(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.checklistsService.completeSubmission(user.organizationId, id, user.sub, user.role as any);
  }
}
