import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
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
} from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  SubmitCampaignDto,
  ReviewCampaignDto,
  CampaignQueryDto,
  CampaignSubmissionQueryDto,
} from './dto';
import { CampaignStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@ApiTags('campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // ==================== Campaigns CRUD ====================

  @Post()
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async create(
    @Body() dto: CreateCampaignDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.create(user.organizationId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'List campaigns (paginated, filterable)' })
  @ApiResponse({ status: 200, description: 'Paginated list of campaigns' })
  async findAll(
    @Query() query: CampaignQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.findAll(user.organizationId, query);
  }

  @Get('my-pending')
  @ApiOperation({ summary: 'Get pending campaigns for my store' })
  @ApiResponse({ status: 200, description: 'List of pending campaigns' })
  async getMyPending(@CurrentUser() user: CurrentUserPayload) {
    if (!user.storeId) {
      return [];
    }
    return this.campaignsService.getMyPending(user.organizationId, user.storeId);
  }

  @Get('dashboard')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Get campaign compliance dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard(
    @Query() query: CampaignQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.getDashboard(user.organizationId, query);
  }

  @Get('my-submissions')
  @ApiOperation({ summary: 'Get my campaign submissions' })
  @ApiResponse({ status: 200, description: 'List of user submissions' })
  async getMySubmissions(@CurrentUser() user: CurrentUserPayload) {
    return this.campaignsService.findMySubmissions(user.organizationId, user.sub);
  }

  @Get('submissions')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'List all submissions (paginated, filterable)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of submissions',
  })
  async findSubmissions(
    @Query() query: CampaignSubmissionQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.findSubmissions(user.organizationId, query);
  }

  @Get('submissions/:id')
  @ApiOperation({ summary: 'Get submission detail' })
  @ApiParam({ name: 'id', description: 'Submission UUID' })
  @ApiResponse({ status: 200, description: 'Submission details' })
  async findSubmissionById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.findSubmissionById(user.organizationId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign detail with submissions' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, description: 'Campaign details' })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.findById(user.organizationId, id);
  }

  @Patch(':id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.update(user.organizationId, id, dto, user.sub);
  }

  @Patch(':id/status')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Change campaign status' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 200, description: 'Status changed successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: CampaignStatus,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.updateStatus(user.organizationId, id, status, user.sub);
  }

  @Delete(':id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Cancel campaign (soft-delete)' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Campaign cancelled' })
  async deleteCampaign(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.campaignsService.deleteCampaign(user.organizationId, id, user.sub);
  }

  // ==================== Submissions ====================

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit campaign execution photos' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiResponse({ status: 201, description: 'Submission created successfully' })
  async submitExecution(
    @Param('id') campaignId: string,
    @Body() dto: SubmitCampaignDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.submitExecution(user.organizationId, campaignId, dto, user.sub);
  }

  @Put(':id/submissions/:subId/resubmit')
  @ApiOperation({ summary: 'Resubmit after revision request' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @ApiParam({ name: 'subId', description: 'Submission UUID' })
  @ApiResponse({ status: 200, description: 'Submission resubmitted' })
  async resubmit(
    @Param('subId') subId: string,
    @Body() dto: SubmitCampaignDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.resubmit(user.organizationId, subId, dto, user.sub);
  }

  @Patch('submissions/:id/review')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Review campaign submission' })
  @ApiParam({ name: 'id', description: 'Submission UUID' })
  @ApiResponse({ status: 200, description: 'Submission reviewed' })
  async reviewSubmission(
    @Param('id') id: string,
    @Body() dto: ReviewCampaignDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.campaignsService.reviewSubmission(user.organizationId, id, dto, user.sub);
  }
}
