import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
}
