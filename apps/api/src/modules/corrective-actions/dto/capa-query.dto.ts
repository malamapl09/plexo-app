import { IsOptional, IsEnum, IsUUID, IsInt, Min, IsDateString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { CorrectiveActionStatus, CAPASourceType } from '@prisma/client';

export class CapaQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: CorrectiveActionStatus,
    description: 'Filter by status',
  })
  @IsEnum(CorrectiveActionStatus)
  @IsOptional()
  status?: CorrectiveActionStatus;

  @ApiPropertyOptional({ description: 'Filter by store UUID' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned user UUID' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({
    enum: CAPASourceType,
    description: 'Filter by source type',
  })
  @IsEnum(CAPASourceType)
  @IsOptional()
  sourceType?: CAPASourceType;

  @ApiPropertyOptional({
    description: 'Filter overdue actions only',
    type: Boolean,
  })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'Filter by due date from (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by due date to (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
