import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsArray,
  IsInt,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ChecklistFrequencyDto {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ONE_TIME = 'ONE_TIME',
}

export class CreateChecklistItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({ example: 'Verificar limpieza del piso' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Asegurar que el piso este limpio y seco' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresPhoto?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresNote?: boolean;
}

export class CreateChecklistTemplateDto {
  @ApiProperty({ example: 'Apertura de Tienda' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Checklist diario de apertura' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiProperty({ enum: ChecklistFrequencyDto, example: 'DAILY' })
  @IsEnum(ChecklistFrequencyDto)
  frequency: ChecklistFrequencyDto;

  @ApiPropertyOptional({ example: 'ALL', default: 'ALL' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetStoreIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetRegionIds?: string[];

  @ApiProperty({ type: [CreateChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  items: CreateChecklistItemDto[];
}
