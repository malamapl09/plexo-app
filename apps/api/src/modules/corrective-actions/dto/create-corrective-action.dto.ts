import { IsString, IsDateString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CAPASourceType, Priority } from '@prisma/client';

export class CreateCorrectiveActionDto {
  @ApiPropertyOptional({
    enum: CAPASourceType,
    description: 'Source type of the corrective action',
    default: CAPASourceType.MANUAL,
  })
  @IsEnum(CAPASourceType)
  @IsOptional()
  sourceType?: CAPASourceType = CAPASourceType.MANUAL;

  @ApiPropertyOptional({ description: 'Source entity ID (e.g., issue ID, checklist submission ID)' })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @ApiPropertyOptional({ description: 'Audit finding UUID (if source is AUDIT_FINDING)' })
  @IsUUID()
  @IsOptional()
  findingId?: string;

  @ApiProperty({ description: 'Title of the corrective action' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed description of the action required' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'User UUID to assign action to' })
  @IsUUID()
  assignedToId: string;

  @ApiProperty({ description: 'Store UUID where action should be performed' })
  @IsUUID()
  storeId: string;

  @ApiProperty({ description: 'Due date (YYYY-MM-DD or ISO date)' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    enum: Priority,
    description: 'Priority level',
    default: Priority.MEDIUM,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority = Priority.MEDIUM;
}
