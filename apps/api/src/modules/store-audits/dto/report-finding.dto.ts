import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FindingSeverityDto {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class ReportFindingDto {
  @ApiPropertyOptional({ description: 'Section UUID where finding was identified' })
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({ enum: FindingSeverityDto, description: 'Severity level' })
  @IsEnum(FindingSeverityDto)
  severity: FindingSeverityDto;

  @ApiProperty({ description: 'Finding title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Finding description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Photo URLs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photoUrls?: string[];
}
