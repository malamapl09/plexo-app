import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreatePlanogramTemplateDto {
  @ApiProperty({ example: 'Planograma Sección Lácteos Q1 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Disposición de productos lácteos para el primer trimestre' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String], example: ['https://minio.example.com/planograms/ref-photo-1.jpg'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  referencePhotoUrls: string[];

  @ApiPropertyOptional({ type: [String], example: ['store-uuid-1', 'store-uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetStoreIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['region-uuid-1'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetRegionIds?: string[];

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
