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
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import {
  AnnouncementResponse,
  AnnouncementListResponse,
  AnnouncementAnalytics,
} from './dto/announcement-response.dto';
import { RecipientListResponse } from './dto/recipient-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@ApiTags('announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  // ==================== HQ Management Endpoints ====================

  @Post()
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Crear nuevo anuncio (Solo HQ)' })
  @ApiResponse({
    status: 201,
    description: 'Anuncio creado como borrador',
    type: AnnouncementResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async create(
    @Body() createDto: CreateAnnouncementDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AnnouncementResponse> {
    return this.announcementsService.create(user.organizationId, createDto, user.sub, user.role as any);
  }

  @Get()
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Listar todos los anuncios (Solo HQ)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: [
      'SYSTEM_ALERT',
      'OPERATIONAL_UPDATE',
      'POLICY_UPDATE',
      'TRAINING',
      'EMERGENCY',
      'GENERAL',
    ],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por título o contenido',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de anuncios',
    type: AnnouncementListResponse,
  })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ): Promise<AnnouncementListResponse> {
    return this.announcementsService.findAll(
      user.organizationId,
      page || 1,
      limit || 20,
      status,
      type,
      search,
    );
  }

  @Get('feed')
  @ApiOperation({ summary: 'Obtener feed de anuncios para el usuario actual' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Feed de anuncios personalizados',
    type: AnnouncementListResponse,
  })
  async getFeed(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<AnnouncementListResponse> {
    return this.announcementsService.getFeed(
      user.organizationId,
      user.sub,
      user.role,
      user.storeId,
      page || 1,
      limit || 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener anuncio por ID' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del anuncio',
    type: AnnouncementResponse,
  })
  @ApiResponse({ status: 404, description: 'Anuncio no encontrado' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AnnouncementResponse> {
    return this.announcementsService.findOne(user.organizationId, id);
  }

  @Get(':id/analytics')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Obtener analíticas del anuncio (Solo HQ)' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({
    status: 200,
    description: 'Analíticas del anuncio',
    type: AnnouncementAnalytics,
  })
  @ApiResponse({ status: 404, description: 'Anuncio no encontrado' })
  async getAnalytics(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AnnouncementAnalytics> {
    return this.announcementsService.getAnalytics(user.organizationId, id);
  }

  @Get(':id/recipients')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Listar destinatarios con estado de lectura (Solo HQ)' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Lista de destinatarios con estado',
    type: RecipientListResponse,
  })
  async getRecipients(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<RecipientListResponse> {
    return this.announcementsService.getRecipients(user.organizationId, id, page || 1, limit || 20);
  }

  @Post(':id/send-reminder')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Enviar recordatorio a usuarios que no han leido (Solo HQ)' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({ status: 200, description: 'Recordatorios enviados' })
  async sendReminder(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<{ sent: number }> {
    return this.announcementsService.sendReminder(user.organizationId, id, user.sub, user.role as any);
  }

  @Patch(':id')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Actualizar anuncio (Solo HQ, solo borradores)' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({
    status: 200,
    description: 'Anuncio actualizado',
    type: AnnouncementResponse,
  })
  @ApiResponse({ status: 400, description: 'No se puede editar publicados' })
  @ApiResponse({ status: 404, description: 'Anuncio no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAnnouncementDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AnnouncementResponse> {
    return this.announcementsService.update(user.organizationId, id, updateDto, user.sub, user.role as any);
  }

  @Post(':id/publish')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Publicar anuncio (Solo HQ)' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({
    status: 200,
    description: 'Anuncio publicado',
    type: AnnouncementResponse,
  })
  @ApiResponse({ status: 400, description: 'Ya está publicado' })
  @ApiResponse({ status: 404, description: 'Anuncio no encontrado' })
  async publish(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AnnouncementResponse> {
    return this.announcementsService.publish(user.organizationId, id, user.sub, user.role as any);
  }

  @Post(':id/archive')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Archivar anuncio (Solo HQ)' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({
    status: 200,
    description: 'Anuncio archivado',
    type: AnnouncementResponse,
  })
  @ApiResponse({ status: 404, description: 'Anuncio no encontrado' })
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AnnouncementResponse> {
    return this.announcementsService.archive(user.organizationId, id, user.sub, user.role as any);
  }

  // ==================== User Engagement Endpoints ====================

  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Registrar vista del anuncio' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({ status: 204, description: 'Vista registrada' })
  async trackView(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.announcementsService.trackView(user.organizationId, id, user.sub);
  }

  @Post(':id/acknowledge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Confirmar lectura del anuncio' })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({ status: 204, description: 'Confirmación registrada' })
  @ApiResponse({ status: 404, description: 'Anuncio no encontrado' })
  async trackAcknowledgment(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.announcementsService.trackAcknowledgment(user.organizationId, id, user.sub);
  }

  // ==================== Delete ====================

  @Delete(':id')
  @Roles('OPERATIONS_MANAGER')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar anuncio (Solo Operations Manager, solo borradores)',
  })
  @ApiParam({ name: 'id', description: 'ID del anuncio' })
  @ApiResponse({ status: 204, description: 'Anuncio eliminado' })
  @ApiResponse({ status: 400, description: 'Solo se pueden eliminar borradores' })
  @ApiResponse({ status: 404, description: 'Anuncio no encontrado' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.announcementsService.remove(user.organizationId, id, user.sub, user.role as any);
  }
}
