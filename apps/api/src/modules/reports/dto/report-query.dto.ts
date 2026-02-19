import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString, IsEnum } from 'class-validator';

export enum ReportFormat {
  JSON = 'json',
  EXCEL = 'excel',
}

export enum ReportPeriod {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'this_week',
  LAST_WEEK = 'last_week',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  CUSTOM = 'custom',
}

export class ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Report period preset',
    enum: ReportPeriod,
    default: ReportPeriod.TODAY,
  })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod = ReportPeriod.TODAY;

  @ApiPropertyOptional({
    description: 'Custom start date (required if period is CUSTOM)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Custom end date (required if period is CUSTOM)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by store ID',
  })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({
    description: 'Filter by region ID',
  })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({
    description: 'Output format',
    enum: ReportFormat,
    default: ReportFormat.JSON,
  })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat = ReportFormat.JSON;
}

export class ComplianceReportQueryDto extends ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Include task details',
  })
  @IsOptional()
  includeDetails?: boolean;
}

export class ReceivingReportQueryDto extends ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by supplier name',
  })
  @IsOptional()
  supplierName?: string;

  @ApiPropertyOptional({
    description: 'Include discrepancy details',
  })
  @IsOptional()
  includeDiscrepancies?: boolean;
}

export class IssueReportQueryDto extends ReportQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by category',
  })
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Include resolution times',
  })
  @IsOptional()
  includeResolutionTimes?: boolean;
}
