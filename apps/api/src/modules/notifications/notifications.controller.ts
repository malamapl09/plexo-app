import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  RegisterDeviceDto,
  UnregisterDeviceDto,
  SendNotificationDto,
  SendToTopicDto,
} from './dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-device')
  @ApiOperation({ summary: 'Register device for push notifications' })
  @ApiResponse({
    status: 201,
    description: 'Device registered successfully',
  })
  async registerDevice(
    @Body() dto: RegisterDeviceDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.notificationsService.registerDevice(req.user.organizationId, req.user.id, dto);
    return { message: 'Device registered successfully' };
  }

  @Delete('unregister-device')
  @ApiOperation({ summary: 'Unregister device from push notifications' })
  @ApiResponse({
    status: 200,
    description: 'Device unregistered successfully',
  })
  async unregisterDevice(
    @Body() dto: UnregisterDeviceDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.notificationsService.unregisterDevice(req.user.organizationId, req.user.id, dto.token);
    return { message: 'Device unregistered successfully' };
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get user registered devices' })
  @ApiResponse({
    status: 200,
    description: 'List of registered devices',
  })
  async getDevices(@Request() req: any) {
    return this.notificationsService.getUserDevices(req.user.organizationId, req.user.id);
  }

  @Post('send')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Send notification to users, store, or topic' })
  @ApiResponse({
    status: 200,
    description: 'Notification sent',
  })
  async sendNotification(
    @Body() dto: SendNotificationDto,
    @Request() req: any,
  ): Promise<{ success: number; failure: number }> {
    return this.notificationsService.send(req.user.organizationId, dto);
  }

  @Post('send-to-topic')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM')
  @ApiOperation({ summary: 'Send notification to a topic' })
  @ApiResponse({
    status: 200,
    description: 'Notification sent to topic',
  })
  async sendToTopic(
    @Body() dto: SendToTopicDto,
    @Request() req: any,
  ): Promise<{ success: boolean }> {
    const success = await this.notificationsService.sendToTopic(
      req.user.organizationId,
      dto.topic,
      dto.title,
      dto.body,
      dto.data,
    );
    return { success };
  }

  @Post('test')
  @ApiOperation({ summary: 'Send test notification to current user' })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent',
  })
  async sendTestNotification(
    @Request() req: any,
  ): Promise<{ success: number; failure: number }> {
    return this.notificationsService.sendToUsers(
      req.user.organizationId,
      [req.user.id],
      'Notificación de Prueba',
      'Esta es una notificación de prueba desde Plexo Operations',
      {
        type: 'GENERAL' as any,
        entityType: 'test',
      },
    );
  }
}
