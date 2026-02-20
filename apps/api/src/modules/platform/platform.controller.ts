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
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';

@ApiTags('platform')
@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@ApiBearerAuth('JWT-auth')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Post('organizations')
  @ApiOperation({ summary: 'Create new organization with admin user' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 409, description: 'Slug already in use' })
  createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.platformService.createOrganization(dto);
  }

  @Get('organizations')
  @ApiOperation({ summary: 'List all organizations with user/store counts' })
  @ApiResponse({ status: 200, description: 'List of organizations' })
  listOrganizations() {
    return this.platformService.listOrganizations();
  }

  @Get('organizations/:id')
  @ApiOperation({ summary: 'Get single organization with detailed stats' })
  @ApiResponse({ status: 200, description: 'Organization detail' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  getOrganization(@Param('id') id: string) {
    return this.platformService.getOrganization(id);
  }

  @Patch('organizations/:id')
  @ApiOperation({ summary: 'Update organization fields' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  updateOrganization(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.platformService.updateOrganization(id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide statistics' })
  @ApiResponse({ status: 200, description: 'Platform stats' })
  getStats() {
    return this.platformService.getStats();
  }

  @Get('health')
  @ApiOperation({ summary: 'Organization health dashboard across all orgs' })
  @ApiResponse({ status: 200, description: 'Health metrics per org' })
  getOrganizationHealth() {
    return this.platformService.getOrganizationHealth();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Platform alerts — inactive orgs, low adoption, upsell' })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  getAlerts() {
    return this.platformService.getAlerts();
  }

  @Get('benchmarks')
  @ApiOperation({ summary: 'Cross-org benchmarking metrics' })
  @ApiResponse({ status: 200, description: 'Benchmark data per org' })
  getBenchmarks() {
    return this.platformService.getBenchmarks();
  }

  @Get('organizations/:id/activity')
  @ApiOperation({ summary: 'Organization activity timeline (30 days)' })
  @ApiResponse({ status: 200, description: 'Activity data' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  getOrganizationActivity(@Param('id') id: string) {
    return this.platformService.getOrganizationActivity(id);
  }

  @Get('organizations/:id/audit-logs')
  @ApiOperation({ summary: 'Paginated audit logs for an organization' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  getOrganizationAuditLogs(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
  ) {
    return this.platformService.getOrganizationAuditLogs(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      entityType,
      action,
    });
  }
}
