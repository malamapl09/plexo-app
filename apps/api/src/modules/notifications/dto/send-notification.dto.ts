import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsUUID,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationType {
  TASK_OVERDUE = 'TASK_OVERDUE',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  ISSUE_REPORTED = 'ISSUE_REPORTED',
  ISSUE_ASSIGNED = 'ISSUE_ASSIGNED',
  ISSUE_ESCALATED = 'ISSUE_ESCALATED',
  ISSUE_RESOLVED = 'ISSUE_RESOLVED',
  RECEIVING_SCHEDULED = 'RECEIVING_SCHEDULED',
  RECEIVING_ARRIVED = 'RECEIVING_ARRIVED',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  GENERAL = 'GENERAL',
}

export class NotificationDataDto {
  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiPropertyOptional({
    description: 'Entity ID (task, issue, receiving)',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Entity type',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({
    description: 'Additional custom data',
  })
  @IsOptional()
  @IsObject()
  extra?: Record<string, string>;
}

export class SendNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'Tarea vencida',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'La tarea "Limpieza de área" ha vencido',
  })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'Notification data payload',
    type: NotificationDataDto,
  })
  @ValidateNested()
  @Type(() => NotificationDataDto)
  data: NotificationDataDto;

  @ApiPropertyOptional({
    description: 'User IDs to send notification to',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiPropertyOptional({
    description: 'Topic to send notification to (e.g., store_123, role_STORE_MANAGER)',
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({
    description: 'Store ID to send to all users in store',
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;
}

export class SendToTopicDto {
  @ApiProperty({
    description: 'Topic name',
    example: 'store_123',
  })
  @IsString()
  topic: string;

  @ApiProperty({
    description: 'Notification title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification body',
  })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'Notification data',
    type: NotificationDataDto,
  })
  @ValidateNested()
  @Type(() => NotificationDataDto)
  data: NotificationDataDto;
}
