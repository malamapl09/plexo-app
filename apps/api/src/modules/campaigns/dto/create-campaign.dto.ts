import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { CampaignType, Priority } from '@prisma/client';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Semana Santa 20% Electronica' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Campaña de descuentos para Semana Santa' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CampaignType, example: 'PROMOTION' })
  @IsEnum(CampaignType)
  @IsNotEmpty()
  type: CampaignType;

  @ApiProperty({ enum: Priority, example: 'HIGH' })
  @IsEnum(Priority)
  @IsNotEmpty()
  priority: Priority;

  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: '2026-03-15T23:59:59.000Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://minio.example.com/campaigns/ref-1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  referencePhotoUrls?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Banner 2x1m', 'Etiquetas de precio'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materialsList?: string[];

  @ApiPropertyOptional({ example: '1. Colocar banner en entrada...' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['store-uuid-1', 'store-uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetStoreIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['region-uuid-1'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetRegionIds?: string[];
}
