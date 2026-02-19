import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ReceivingService } from './receiving.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateReceivingDto,
  UpdateReceivingDto,
  CompleteReceivingDto,
  CreateDiscrepancyDto,
  ReceivingQueryDto,
  ReceivingResponseDto,
  ReceivingListResponseDto,
  ReceivingDashboardDto,
} from './dto';

@ApiTags('receiving')
@Controller('receiving')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReceivingController {
  constructor(private readonly receivingService: ReceivingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new receiving record' })
  @ApiResponse({
    status: 201,
    description: 'Receiving created successfully',
    type: ReceivingResponseDto,
  })
  async create(
    @Body() dto: CreateReceivingDto,
    @Request() req: any,
  ): Promise<ReceivingResponseDto> {
    return this.receivingService.create(req.user.organizationId, dto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'List all receiving records' })
  @ApiResponse({
    status: 200,
    description: 'List of receivings',
    type: ReceivingListResponseDto,
  })
  async findAll(
    @Query() query: ReceivingQueryDto,
    @Request() req: any,
  ): Promise<ReceivingListResponseDto> {
    return this.receivingService.findAll(req.user.organizationId, query, {
      id: req.user.id,
      role: req.user.role,
      storeId: req.user.storeId,
    });
  }

  @Get('dashboard')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Get receiving dashboard with stats and metrics' })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'regionId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data',
    type: ReceivingDashboardDto,
  })
  async getDashboard(
    @Request() req: any,
    @Query('storeId') storeId?: string,
    @Query('regionId') regionId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ReceivingDashboardDto> {
    return this.receivingService.getDashboard(req.user.organizationId, storeId, regionId, startDate, endDate);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get receivings for a specific store' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Store receivings',
    type: [ReceivingResponseDto],
  })
  async getStoreReceivings(
    @Param('storeId') storeId: string,
    @Request() req: any,
    @Query('date') date?: string,
  ): Promise<ReceivingResponseDto[]> {
    return this.receivingService.getStoreReceivings(req.user.organizationId, storeId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get receiving by ID' })
  @ApiParam({ name: 'id', description: 'Receiving ID' })
  @ApiResponse({
    status: 200,
    description: 'Receiving details',
    type: ReceivingResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ReceivingResponseDto> {
    return this.receivingService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update receiving record' })
  @ApiParam({ name: 'id', description: 'Receiving ID' })
  @ApiResponse({
    status: 200,
    description: 'Receiving updated',
    type: ReceivingResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReceivingDto,
    @Request() req: any,
  ): Promise<ReceivingResponseDto> {
    return this.receivingService.update(req.user.organizationId, id, dto, req.user.id, req.user.role);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start receiving process (mark truck as arrived)' })
  @ApiParam({ name: 'id', description: 'Receiving ID' })
  @ApiResponse({
    status: 200,
    description: 'Receiving started',
    type: ReceivingResponseDto,
  })
  async startReceiving(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<ReceivingResponseDto> {
    return this.receivingService.startReceiving(req.user.organizationId, id, req.user.id, req.user.role);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete receiving with signature' })
  @ApiParam({ name: 'id', description: 'Receiving ID' })
  @ApiResponse({
    status: 200,
    description: 'Receiving completed',
    type: ReceivingResponseDto,
  })
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteReceivingDto,
    @Request() req: any,
  ): Promise<ReceivingResponseDto> {
    return this.receivingService.complete(req.user.organizationId, id, dto, req.user.id, req.user.role);
  }

  @Post(':id/did-not-arrive')
  @ApiOperation({ summary: 'Mark receiving as did not arrive' })
  @ApiParam({ name: 'id', description: 'Receiving ID' })
  @ApiResponse({
    status: 200,
    description: 'Receiving marked as did not arrive',
    type: ReceivingResponseDto,
  })
  async markDidNotArrive(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Request() req: any,
  ): Promise<ReceivingResponseDto> {
    return this.receivingService.markDidNotArrive(req.user.organizationId, id, notes, req.user.id, req.user.role);
  }

  @Post(':id/discrepancy')
  @ApiOperation({ summary: 'Add discrepancy to receiving' })
  @ApiParam({ name: 'id', description: 'Receiving ID' })
  @ApiResponse({
    status: 201,
    description: 'Discrepancy added',
    type: ReceivingResponseDto,
  })
  async addDiscrepancy(
    @Param('id') id: string,
    @Body() dto: CreateDiscrepancyDto,
    @Request() req: any,
  ): Promise<ReceivingResponseDto> {
    return this.receivingService.addDiscrepancy(req.user.organizationId, id, dto, req.user.id, req.user.role);
  }

  @Delete('discrepancy/:discrepancyId')
  @ApiOperation({ summary: 'Remove discrepancy from receiving' })
  @ApiParam({ name: 'discrepancyId', description: 'Discrepancy ID' })
  @ApiResponse({
    status: 200,
    description: 'Discrepancy removed',
  })
  async removeDiscrepancy(
    @Param('discrepancyId') discrepancyId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.receivingService.removeDiscrepancy(req.user.organizationId, discrepancyId, req.user.id, req.user.role);
    return { message: 'Discrepancia eliminada correctamente' };
  }
}
