import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleAuditDto {
  @ApiProperty({ description: 'Audit template UUID' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'Store UUID' })
  @IsUUID()
  storeId: string;

  @ApiProperty({ description: 'Scheduled date (YYYY-MM-DD)' })
  @IsDateString()
  scheduledDate: string;

  @ApiPropertyOptional({ description: 'Auditor UUID (defaults to current user)' })
  @IsUUID()
  @IsOptional()
  auditorId?: string;
}
