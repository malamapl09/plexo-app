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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TaskTemplatesService } from './task-templates.service';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';
import {
  TaskTemplateResponse,
  TaskTemplateListResponse,
} from './dto/task-template-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@ApiTags('task-templates')
@Controller('task-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TaskTemplatesController {
  constructor(private readonly taskTemplatesService: TaskTemplatesService) {}

  @Post()
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Crear nueva plantilla de tarea (Solo HQ)' })
  @ApiResponse({
    status: 201,
    description: 'Plantilla creada',
    type: TaskTemplateResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async create(
    @Body() createDto: CreateTaskTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskTemplateResponse> {
    return this.taskTemplatesService.create(user.organizationId, createDto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar plantillas de tareas' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre o descripción' })
  @ApiResponse({
    status: 200,
    description: 'Lista de plantillas',
    type: TaskTemplateListResponse,
  })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isActive') isActive?: boolean,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ): Promise<TaskTemplateListResponse> {
    return this.taskTemplatesService.findAll(
      user.organizationId,
      page || 1,
      limit || 20,
      isActive,
      departmentId,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plantilla por ID' })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de plantilla',
    type: TaskTemplateResponse,
  })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskTemplateResponse> {
    return this.taskTemplatesService.findOne(user.organizationId, id);
  }

  @Get(':id/defaults')
  @ApiOperation({
    summary: 'Obtener valores por defecto de la plantilla para crear tarea',
  })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @ApiResponse({
    status: 200,
    description: 'Valores por defecto para crear tarea',
  })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  async getDefaults(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.taskTemplatesService.getTemplateDefaults(user.organizationId, id);
  }

  @Patch(':id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Actualizar plantilla (Solo HQ)' })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @ApiResponse({
    status: 200,
    description: 'Plantilla actualizada',
    type: TaskTemplateResponse,
  })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTaskTemplateDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<TaskTemplateResponse> {
    return this.taskTemplatesService.update(user.organizationId, id, updateDto);
  }

  @Delete(':id')
  @Roles('OPERATIONS_MANAGER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar plantilla (Solo Operations Manager)' })
  @ApiParam({ name: 'id', description: 'ID de la plantilla' })
  @ApiResponse({ status: 204, description: 'Plantilla desactivada' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    return this.taskTemplatesService.remove(user.organizationId, id);
  }
}
