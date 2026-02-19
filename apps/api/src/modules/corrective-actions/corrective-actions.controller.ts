import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CorrectiveActionsService } from './corrective-actions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';
import {
  CreateCorrectiveActionDto,
  UpdateCorrectiveActionDto,
  CapaQueryDto,
  CapaDetailResponseDto,
  CapaListResponseDto,
  CapaDashboardResponseDto,
  CapaListItemDto,
} from './dto';

@ApiTags('corrective-actions')
@ApiBearerAuth('JWT-auth')
@Controller('corrective-actions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CorrectiveActionsController {
  constructor(private readonly capaService: CorrectiveActionsService) {}

  @Post()
  @Roles(
    'OPERATIONS_MANAGER',
    'HQ_TEAM',
    'REGIONAL_SUPERVISOR',
  )
  @ApiOperation({
    summary: 'Create a corrective action',
    description: 'Create a new corrective action. HQ roles only.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Corrective action created successfully',
    type: CapaDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async create(
    @Body() dto: CreateCorrectiveActionDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CapaDetailResponseDto> {
    return this.capaService.create(user.organizationId, dto, user.sub, user.role as string);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all corrective actions',
    description:
      'List all corrective actions with filters. Store users see only their store actions.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of corrective actions',
    type: CapaListResponseDto,
  })
  async findAll(
    @Query() query: CapaQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CapaListResponseDto> {
    return this.capaService.findAll(user.organizationId, query, user.sub, user.role as string);
  }

  @Get('my-actions')
  @ApiOperation({
    summary: 'Get my assigned corrective actions',
    description: 'Get all active corrective actions assigned to the current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of assigned actions',
    type: [CapaListItemDto],
  })
  async findMyActions(@CurrentUser() user: CurrentUserPayload): Promise<CapaListItemDto[]> {
    return this.capaService.findMyActions(user.organizationId, user.sub);
  }

  @Get('dashboard')
  @Roles(
    'OPERATIONS_MANAGER',
    'HQ_TEAM',
    'REGIONAL_SUPERVISOR',
  )
  @ApiOperation({
    summary: 'Get corrective actions dashboard',
    description: 'Get comprehensive dashboard statistics. HQ roles only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard data',
    type: CapaDashboardResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async getDashboard(
    @Query() query: CapaQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CapaDashboardResponseDto> {
    return this.capaService.getDashboard(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get corrective action by ID',
    description: 'Get detailed information about a specific corrective action',
  })
  @ApiParam({ name: 'id', description: 'Corrective action UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Corrective action details',
    type: CapaDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Corrective action not found',
  })
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CapaDetailResponseDto> {
    return this.capaService.findById(user.organizationId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update corrective action',
    description:
      'Update corrective action status and details. Status transitions: PENDING→IN_PROGRESS, IN_PROGRESS→COMPLETED, COMPLETED→VERIFIED (HQ only)',
  })
  @ApiParam({ name: 'id', description: 'Corrective action UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Corrective action updated successfully',
    type: CapaDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition or missing required fields',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Corrective action not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions for this action',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCorrectiveActionDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<CapaDetailResponseDto> {
    return this.capaService.update(user.organizationId, id, dto, user.sub, user.role as string);
  }
}
