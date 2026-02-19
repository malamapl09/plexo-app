import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StoreAuditsService } from './store-audits.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import {
  CreateAuditTemplateDto,
  ScheduleAuditDto,
  SubmitAnswerDto,
  ReportFindingDto,
  CreateCorrectiveActionDto,
  UpdateCorrectiveActionDto,
  AuditQueryDto,
  AuditTemplateResponse,
  StoreAuditResponse,
  AuditFindingResponse,
  CorrectiveActionResponse,
  AuditDashboardResponse,
} from './dto';

@ApiTags('store-audits')
@Controller('store-audits')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class StoreAuditsController {
  constructor(private readonly storeAuditsService: StoreAuditsService) {}

  // ============================================
  // TEMPLATE MANAGEMENT
  // ============================================

  @Post('templates')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Create audit template (HQ only)' })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: AuditTemplateResponse,
  })
  async createTemplate(
    @Body() dto: CreateAuditTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AuditTemplateResponse> {
    return this.storeAuditsService.createTemplate(user.organizationId, dto, user.sub);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List all audit templates' })
  @ApiResponse({
    status: 200,
    description: 'List of templates',
    type: [AuditTemplateResponse],
  })
  async findAllTemplates(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AuditTemplateResponse[]> {
    return this.storeAuditsService.findAllTemplates(user.organizationId);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template detail' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({
    status: 200,
    description: 'Template detail',
    type: AuditTemplateResponse,
  })
  async findOneTemplate(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AuditTemplateResponse> {
    return this.storeAuditsService.findOneTemplate(user.organizationId, id);
  }

  @Patch('templates/:id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Update template (HQ only)' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    type: AuditTemplateResponse,
  })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAuditTemplateDto>,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AuditTemplateResponse> {
    return this.storeAuditsService.updateTemplate(user.organizationId, id, dto, user.sub);
  }

  // ============================================
  // DASHBOARD
  // ============================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get audit dashboard with stats' })
  @ApiQuery({ name: 'storeId', required: false, description: 'Filter by store UUID' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Filter to date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data',
    type: AuditDashboardResponse,
  })
  async getDashboard(
    @CurrentUser() user: CurrentUserPayload,
    @Query('storeId') storeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<AuditDashboardResponse> {
    return this.storeAuditsService.getDashboard(user.organizationId, storeId, dateFrom, dateTo);
  }

  // ============================================
  // CORRECTIVE ACTIONS
  // ============================================

  @Post('findings/:id/corrective-action')
  @Roles('OPERATIONS_MANAGER', 'REGIONAL_SUPERVISOR', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Create corrective action for a finding' })
  @ApiParam({ name: 'id', description: 'Finding UUID' })
  @ApiResponse({
    status: 201,
    description: 'Corrective action created successfully',
    type: CorrectiveActionResponse,
  })
  async createCorrectiveAction(
    @Param('id') findingId: string,
    @Body() dto: CreateCorrectiveActionDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CorrectiveActionResponse> {
    return this.storeAuditsService.createCorrectiveAction(
      findingId,
      dto,
      user.sub,
      user.role as string,
    );
  }

  @Patch('corrective-actions/:id')
  @ApiOperation({ summary: 'Update corrective action status' })
  @ApiParam({ name: 'id', description: 'Corrective action UUID' })
  @ApiResponse({
    status: 200,
    description: 'Corrective action updated successfully',
    type: CorrectiveActionResponse,
  })
  async updateCorrectiveAction(
    @Param('id') id: string,
    @Body() dto: UpdateCorrectiveActionDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CorrectiveActionResponse> {
    return this.storeAuditsService.updateCorrectiveAction(
      id,
      dto,
      user.sub,
      user.role as string,
    );
  }

  // ============================================
  // AUDIT LIFECYCLE
  // ============================================

  @Post('schedule')
  @Roles('OPERATIONS_MANAGER', 'REGIONAL_SUPERVISOR', 'HQ_TEAM')
  @ApiOperation({ summary: 'Schedule a store audit' })
  @ApiResponse({
    status: 201,
    description: 'Audit scheduled successfully',
    type: StoreAuditResponse,
  })
  async schedule(
    @Body() dto: ScheduleAuditDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<StoreAuditResponse> {
    return this.storeAuditsService.schedule(dto, user.sub, user.role as string);
  }

  @Get()
  @ApiOperation({ summary: 'List audits with filters' })
  @ApiResponse({
    status: 200,
    description: 'List of audits',
  })
  async findAll(
    @Query() query: AuditQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.storeAuditsService.findAll(query, user.sub, user.role as string);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit detail' })
  @ApiParam({ name: 'id', description: 'Audit UUID' })
  @ApiResponse({
    status: 200,
    description: 'Audit detail',
    type: StoreAuditResponse,
  })
  async findOne(@Param('id') id: string): Promise<StoreAuditResponse> {
    return this.storeAuditsService.findOne(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start an audit' })
  @ApiParam({ name: 'id', description: 'Audit UUID' })
  @ApiResponse({
    status: 200,
    description: 'Audit started successfully',
    type: StoreAuditResponse,
  })
  async startAudit(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<StoreAuditResponse> {
    return this.storeAuditsService.startAudit(id, user.sub, user.role as string);
  }

  @Post(':id/answer')
  @ApiOperation({ summary: 'Submit answer to audit question' })
  @ApiParam({ name: 'id', description: 'Audit UUID' })
  @ApiResponse({
    status: 200,
    description: 'Answer submitted successfully',
    type: StoreAuditResponse,
  })
  async submitAnswer(
    @Param('id') id: string,
    @Body() dto: SubmitAnswerDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<StoreAuditResponse> {
    return this.storeAuditsService.submitAnswer(id, dto, user.sub);
  }

  @Post(':id/finding')
  @ApiOperation({ summary: 'Report a finding during audit' })
  @ApiParam({ name: 'id', description: 'Audit UUID' })
  @ApiResponse({
    status: 201,
    description: 'Finding reported successfully',
    type: AuditFindingResponse,
  })
  async reportFinding(
    @Param('id') id: string,
    @Body() dto: ReportFindingDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AuditFindingResponse> {
    return this.storeAuditsService.reportFinding(id, dto, user.sub);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete audit and calculate scores' })
  @ApiParam({ name: 'id', description: 'Audit UUID' })
  @ApiResponse({
    status: 200,
    description: 'Audit completed successfully',
    type: StoreAuditResponse,
  })
  async completeAudit(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<StoreAuditResponse> {
    return this.storeAuditsService.completeAudit(id, user.sub, user.role as string);
  }
}
