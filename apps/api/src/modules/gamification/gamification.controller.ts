import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import { GamificationActionType } from '@prisma/client';
import {
  GamificationProfileResponse,
  BadgeResponse,
  PointConfigResponse,
  UpdatePointConfigDto,
} from './dto';

@ApiTags('gamification')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ============================================
  // GET /gamification/my-profile
  // ============================================

  @Get('my-profile')
  @ApiOperation({ summary: 'Get my gamification profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns user gamification profile',
    type: GamificationProfileResponse,
  })
  async getMyProfile(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<GamificationProfileResponse> {
    return this.gamificationService.getMyProfile(user.organizationId, user.sub);
  }

  // ============================================
  // GET /gamification/leaderboard/:type
  // ============================================

  @Get('leaderboard/:type')
  @ApiOperation({ summary: 'Get leaderboard by type (individual, store, department)' })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly', 'allTime'], required: false })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'regionId', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'tier', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  async getLeaderboardByType(
    @CurrentUser() user: CurrentUserPayload,
    @Param('type') type: 'individual' | 'store' | 'department',
    @Query('period') period: 'weekly' | 'monthly' | 'allTime' = 'weekly',
    @Query('storeId') storeId?: string,
    @Query('regionId') regionId?: string,
    @Query('role') role?: string,
    @Query('tier') tier?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    const validTypes = ['individual', 'store', 'department'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(
        `Invalid leaderboard type: ${type}. Must be one of: ${validTypes.join(', ')}`,
      );
    }
    return this.gamificationService.getLeaderboard(user.organizationId, type, period, {
      storeId,
      regionId,
      role,
      tier,
      departmentId,
    });
  }

  // Keep old endpoint for backwards compatibility
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get individual leaderboard (legacy)' })
  @ApiQuery({ name: 'scope', enum: ['store', 'region', 'all'], required: false })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly', 'allTime'], required: false })
  async getLeaderboard(
    @CurrentUser() user: CurrentUserPayload,
    @Query('scope') scope: 'store' | 'region' | 'all' = 'all',
    @Query('period') period: 'weekly' | 'monthly' | 'allTime' = 'weekly',
  ) {
    const storeId = scope === 'store' ? user.storeId : undefined;
    return this.gamificationService.getLeaderboard(user.organizationId, 'individual', period, {
      storeId,
    });
  }

  // ============================================
  // GET /gamification/store/:storeId/compliance
  // ============================================

  @Get('store/:storeId/compliance')
  @ApiOperation({ summary: 'Get store compliance rates' })
  async getStoreCompliance(
    @CurrentUser() user: CurrentUserPayload,
    @Param('storeId') storeId: string,
  ) {
    return this.gamificationService.getStoreComplianceData(user.organizationId, storeId);
  }

  // ============================================
  // GET /gamification/badges
  // ============================================

  @Get('badges')
  @ApiOperation({ summary: 'Get all badges' })
  @ApiResponse({
    status: 200,
    description: 'Returns all badges with earn counts',
    type: [BadgeResponse],
  })
  async getAllBadges(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<BadgeResponse[]> {
    return this.gamificationService.getAllBadges(user.organizationId, user.sub);
  }

  // ============================================
  // GET /gamification/users/:id/profile
  // ============================================

  @Get('users/:id/profile')
  @ApiOperation({ summary: 'Get user gamification profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns user gamification profile',
    type: GamificationProfileResponse,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') userId: string,
  ): Promise<GamificationProfileResponse> {
    return this.gamificationService.getUserProfile(user.organizationId, userId);
  }

  // ============================================
  // GET /gamification/point-configs (Admin only)
  // ============================================

  @Get('point-configs')
  @Roles('OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Get all point configurations (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all point configurations',
    type: [PointConfigResponse],
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getPointConfigs(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PointConfigResponse[]> {
    return this.gamificationService.getPointConfigs(user.organizationId);
  }

  // ============================================
  // PATCH /gamification/point-configs/:actionType (Admin only)
  // ============================================

  @Patch('point-configs/:actionType')
  @Roles('OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Update point configuration (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Point configuration updated',
    type: PointConfigResponse,
  })
  @ApiResponse({ status: 404, description: 'Point config not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async updatePointConfig(
    @Param('actionType') actionType: GamificationActionType,
    @Body() dto: UpdatePointConfigDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PointConfigResponse> {
    return this.gamificationService.updatePointConfig(
      user.organizationId,
      actionType,
      dto.points,
      dto.description,
      user.sub,
    );
  }
}
