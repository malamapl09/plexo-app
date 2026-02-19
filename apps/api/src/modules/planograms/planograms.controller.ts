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
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PlanogramsService } from './planograms.service';
import {
  CreatePlanogramTemplateDto,
  UpdatePlanogramTemplateDto,
  SubmitPlanogramDto,
  ReviewPlanogramDto,
  PlanogramQueryDto,
  PlanogramTemplateResponse,
  PlanogramSubmissionResponse,
  PlanogramSubmissionListResponse,
  PlanogramDashboardResponse,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@ApiTags('planograms')
@Controller('planograms')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PlanogramsController {
  constructor(private readonly planogramsService: PlanogramsService) {}

  // ==================== Templates ====================

  @Post('templates')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Create planogram template (HQ only)' })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
    type: PlanogramTemplateResponse,
  })
  async createTemplate(
    @Body() dto: CreatePlanogramTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.planogramsService.createTemplate(user.organizationId, dto, user.sub);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all active planogram templates' })
  @ApiResponse({
    status: 200,
    description: 'List of templates',
    type: [PlanogramTemplateResponse],
  })
  async findAllTemplates(@CurrentUser() user: CurrentUserPayload) {
    return this.planogramsService.findAllTemplates(user.organizationId);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get planogram template by ID' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({
    status: 200,
    description: 'Template details',
    type: PlanogramTemplateResponse,
  })
  async findTemplateById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.planogramsService.findTemplateById(user.organizationId, id);
  }

  @Patch('templates/:id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Update planogram template (HQ only)' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
    type: PlanogramTemplateResponse,
  })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdatePlanogramTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.planogramsService.updateTemplate(user.organizationId, id, dto, user.sub);
  }

  @Delete('templates/:id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Deactivate planogram template (HQ only)' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Template deactivated' })
  async deactivateTemplate(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.planogramsService.deactivateTemplate(user.organizationId, id, user.sub);
  }

  // ==================== Store View ====================

  @Get('my-pending')
  @Roles(
    'STORE_MANAGER',
    'DEPT_SUPERVISOR',
  )
  @ApiOperation({
    summary: 'Get pending planograms for my store (store users only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending templates',
    type: [PlanogramTemplateResponse],
  })
  async getMyPending(@CurrentUser() user: CurrentUserPayload) {
    if (!user.storeId) {
      return [];
    }
    return this.planogramsService.getMyPendingPlanograms(user.organizationId, user.storeId);
  }

  // ==================== Dashboard ====================

  @Get('dashboard')
  @Roles(
    'OPERATIONS_MANAGER',
    'HQ_TEAM',
    'REGIONAL_SUPERVISOR',
  )
  @ApiOperation({ summary: 'Get planogram compliance dashboard (HQ only)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data',
    type: PlanogramDashboardResponse,
  })
  async getDashboard(
    @Query() query: PlanogramQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.planogramsService.getDashboard(user.organizationId, query);
  }

  // ==================== Submissions ====================

  @Get('submissions')
  @ApiOperation({ summary: 'Get planogram submissions with filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of submissions',
    type: PlanogramSubmissionListResponse,
  })
  async findSubmissions(
    @Query() query: PlanogramQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.planogramsService.findSubmissions(user.organizationId, query, user.sub);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Get planogram submission by ID' })
  @ApiParam({ name: 'id', description: 'Submission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Submission details',
    type: PlanogramSubmissionResponse,
  })
  async findSubmissionById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.planogramsService.findSubmissionById(user.organizationId, id);
  }

  @Post('templates/:id/submit')
  @ApiOperation({ summary: 'Submit planogram photos for a template' })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({
    status: 201,
    description: 'Submission created successfully',
    type: PlanogramSubmissionResponse,
  })
  async submitPhotos(
    @Param('id') templateId: string,
    @Body() dto: SubmitPlanogramDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    // Store-level users must submit for their own store
    if (user.storeId) {
      if (dto.storeId !== user.storeId) {
        throw new ForbiddenException(
          'Solo puede enviar planogramas para su tienda asignada',
        );
      }
    }
    return this.planogramsService.submitPhotos(user.organizationId, templateId, dto, user.sub);
  }

  @Post('submissions/:id/review')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Review planogram submission (HQ only)' })
  @ApiParam({ name: 'id', description: 'Submission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Submission reviewed',
    type: PlanogramSubmissionResponse,
  })
  async reviewSubmission(
    @Param('id') id: string,
    @Body() dto: ReviewPlanogramDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.planogramsService.reviewSubmission(user.organizationId, id, dto, user.sub);
  }

  @Post('submissions/:id/resubmit')
  @ApiOperation({ summary: 'Resubmit planogram after revision request' })
  @ApiParam({ name: 'id', description: 'Submission UUID' })
  @ApiResponse({
    status: 200,
    description: 'Submission resubmitted',
    type: PlanogramSubmissionResponse,
  })
  async resubmit(
    @Param('id') id: string,
    @Body() dto: SubmitPlanogramDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.planogramsService.resubmit(user.organizationId, id, dto, user.sub);
  }
}
