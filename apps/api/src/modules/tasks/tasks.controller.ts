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
  Request,
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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import {
  TaskResponse,
  TaskListResponse,
  ComplianceDashboardResponse,
  ComplianceStats,
} from './dto/task-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ==================== Task CRUD ====================

  @Post()
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Crear nueva tarea (Solo HQ)' })
  @ApiResponse({ status: 201, description: 'Tarea creada', type: TaskResponse })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskResponse> {
    return this.tasksService.create(user.organizationId, createTaskDto, user.sub, user.role as any);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tareas con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de tareas', type: TaskListResponse })
  async findAll(
    @Query() query: TaskQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskListResponse> {
    return this.tasksService.findAll(user.organizationId, query, user.sub, user.role, user.storeId);
  }

  @Get('compliance')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Dashboard de cumplimiento (Solo HQ/Regional)' })
  @ApiQuery({ name: 'date', required: true, example: '2025-12-20' })
  @ApiQuery({ name: 'regionId', required: false })
  @ApiResponse({ status: 200, description: 'Datos de cumplimiento', type: ComplianceDashboardResponse })
  async getCompliance(
    @Query('date') date: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('regionId') regionId?: string,
  ): Promise<ComplianceDashboardResponse> {
    return this.tasksService.getComplianceDashboard(user.organizationId, date, regionId);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Tareas de una tienda específica (para mobile)' })
  @ApiParam({ name: 'storeId', description: 'ID de la tienda' })
  @ApiQuery({ name: 'date', required: true, example: '2025-12-20' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiResponse({ status: 200, description: 'Tareas de la tienda', type: TaskListResponse })
  async getStoreTasks(
    @Param('storeId') storeId: string,
    @Query('date') date: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('departmentId') departmentId?: string,
  ): Promise<TaskListResponse> {
    return this.tasksService.getStoreTasks(user.organizationId, storeId, date, departmentId);
  }

  @Get('store/:storeId/progress')
  @ApiOperation({ summary: 'Progreso del día de una tienda' })
  @ApiParam({ name: 'storeId', description: 'ID de la tienda' })
  @ApiQuery({ name: 'date', required: true, example: '2025-12-20' })
  @ApiResponse({ status: 200, description: 'Estadísticas de progreso', type: ComplianceStats })
  async getStoreProgress(
    @Param('storeId') storeId: string,
    @Query('date') date: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ComplianceStats> {
    return this.tasksService.getStoreProgress(user.organizationId, storeId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tarea por ID' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Detalle de tarea', type: TaskResponse })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskResponse> {
    return this.tasksService.findOne(user.organizationId, id, user.sub, user.role, user.storeId);
  }

  @Patch(':id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Actualizar tarea (Solo HQ)' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea actualizada', type: TaskResponse })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskResponse> {
    return this.tasksService.update(user.organizationId, id, updateTaskDto, user.sub, user.role as any);
  }

  @Delete(':id')
  @Roles('OPERATIONS_MANAGER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar tarea (Solo Operations Manager)' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 204, description: 'Tarea eliminada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    return this.tasksService.remove(user.organizationId, id, user.sub, user.role as any);
  }

  // ==================== Task Completion ====================

  @Post(':id/complete')
  @ApiOperation({ summary: 'Completar tarea (para mobile)' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiResponse({ status: 200, description: 'Tarea completada o pendiente de verificación', type: TaskResponse })
  @ApiResponse({ status: 400, description: 'Tarea ya completada' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async completeTask(
    @Param('id') id: string,
    @Body() completeTaskDto: CompleteTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskResponse> {
    if (!user.storeId) {
      throw new Error('Usuario no tiene tienda asignada');
    }
    return this.tasksService.completeTask(user.organizationId, id, user.storeId, completeTaskDto, user.sub, user.role);
  }

  @Post(':id/complete/:storeId')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR', 'STORE_MANAGER')
  @ApiOperation({ summary: 'Completar tarea para tienda específica' })
  @ApiParam({ name: 'id', description: 'ID de la tarea' })
  @ApiParam({ name: 'storeId', description: 'ID de la tienda' })
  @ApiResponse({ status: 200, description: 'Tarea completada o pendiente de verificación', type: TaskResponse })
  async completeTaskForStore(
    @Param('id') id: string,
    @Param('storeId') storeId: string,
    @Body() completeTaskDto: CompleteTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskResponse> {
    return this.tasksService.completeTask(user.organizationId, id, storeId, completeTaskDto, user.sub, user.role);
  }
}
