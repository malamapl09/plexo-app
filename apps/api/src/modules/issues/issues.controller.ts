import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateIssueDto,
  UpdateIssueDto,
  AssignIssueDto,
  RecategorizeIssueDto,
  ResolveIssueDto,
  IssueQueryDto,
  IssueResponseDto,
  IssueListResponseDto,
  IssueDashboardDto,
} from './dto';

@ApiTags('issues')
@Controller('issues')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @ApiOperation({ summary: 'Report a new issue' })
  @ApiResponse({
    status: 201,
    description: 'Issue reported successfully',
    type: IssueResponseDto,
  })
  async create(
    @Body() dto: CreateIssueDto,
    @Request() req: any,
  ): Promise<IssueResponseDto> {
    return this.issuesService.create(req.user.organizationId, dto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'List all issues' })
  @ApiResponse({
    status: 200,
    description: 'List of issues',
    type: IssueListResponseDto,
  })
  async findAll(
    @Query() query: IssueQueryDto,
    @Request() req: any,
  ): Promise<IssueListResponseDto> {
    return this.issuesService.findAll(req.user.organizationId, query, {
      id: req.user.id,
      role: req.user.role,
      storeId: req.user.storeId,
    });
  }

  @Get('dashboard')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Get issues dashboard with stats and metrics' })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'regionId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data',
    type: IssueDashboardDto,
  })
  async getDashboard(
    @Request() req: any,
    @Query('storeId') storeId?: string,
    @Query('regionId') regionId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<IssueDashboardDto> {
    return this.issuesService.getDashboard(req.user.organizationId, storeId, regionId, startDate, endDate);
  }

  @Get('my-issues')
  @ApiOperation({ summary: 'Get issues reported by current user' })
  @ApiResponse({
    status: 200,
    description: 'User reported issues',
    type: [IssueResponseDto],
  })
  async getMyIssues(@Request() req: any): Promise<IssueResponseDto[]> {
    return this.issuesService.getMyIssues(req.user.organizationId, req.user.id);
  }

  @Get('assigned')
  @ApiOperation({ summary: 'Get issues assigned to current user' })
  @ApiResponse({
    status: 200,
    description: 'User assigned issues',
    type: [IssueResponseDto],
  })
  async getAssignedIssues(@Request() req: any): Promise<IssueResponseDto[]> {
    return this.issuesService.getAssignedIssues(req.user.organizationId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get issue by ID' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({
    status: 200,
    description: 'Issue details',
    type: IssueResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<IssueResponseDto> {
    return this.issuesService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update issue' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({
    status: 200,
    description: 'Issue updated',
    type: IssueResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIssueDto,
    @Request() req: any,
  ): Promise<IssueResponseDto> {
    return this.issuesService.update(req.user.organizationId, id, dto, req.user.id, req.user.role);
  }

  @Post(':id/assign')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Assign issue to a user' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({
    status: 200,
    description: 'Issue assigned',
    type: IssueResponseDto,
  })
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignIssueDto,
    @Request() req: any,
  ): Promise<IssueResponseDto> {
    return this.issuesService.assign(req.user.organizationId, id, dto, req.user.id, req.user.role);
  }

  @Post(':id/recategorize')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Recategorize an issue and auto-reassign' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({
    status: 200,
    description: 'Issue recategorized and reassigned',
    type: IssueResponseDto,
  })
  async recategorize(
    @Param('id') id: string,
    @Body() dto: RecategorizeIssueDto,
    @Request() req: any,
  ): Promise<IssueResponseDto> {
    return this.issuesService.recategorize(req.user.organizationId, id, dto, req.user.id, req.user.role);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start working on an issue' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({
    status: 200,
    description: 'Issue started',
    type: IssueResponseDto,
  })
  async startProgress(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<IssueResponseDto> {
    return this.issuesService.startProgress(req.user.organizationId, id, req.user.id, req.user.role);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve an issue' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({
    status: 200,
    description: 'Issue resolved or pending verification',
    type: IssueResponseDto,
  })
  async resolve(
    @Param('id') id: string,
    @Body() dto: ResolveIssueDto,
    @Request() req: any,
  ): Promise<IssueResponseDto> {
    return this.issuesService.resolve(req.user.organizationId, id, dto, req.user.id, req.user.role);
  }

  @Post(':id/escalate')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Manually escalate an issue' })
  @ApiParam({ name: 'id', description: 'Issue ID' })
  @ApiResponse({
    status: 200,
    description: 'Issue escalated',
    type: IssueResponseDto,
  })
  async escalate(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<IssueResponseDto> {
    return this.issuesService.escalate(req.user.organizationId, id, req.user.id, req.user.role);
  }

  @Post('check-escalation')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Check and escalate overdue issues (called by scheduler)' })
  @ApiResponse({
    status: 200,
    description: 'Number of issues escalated',
  })
  async checkAndEscalate(@Request() req: any): Promise<{ escalatedCount: number }> {
    const escalatedCount = await this.issuesService.checkAndEscalate(req.user.organizationId);
    return { escalatedCount };
  }
}
