import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';
import { DiscrepancyType } from '@prisma/client';

export class CreateDiscrepancyDto {
  @ApiProperty({
    description: 'Type of discrepancy',
    enum: DiscrepancyType,
    example: 'DAMAGED',
  })
  @IsEnum(DiscrepancyType)
  type: DiscrepancyType;

  @ApiProperty({
    description: 'Product information (name, SKU, description)',
    example: 'Televisor Samsung 55" - SKU: TV-SAM-55-001',
  })
  @IsString()
  productInfo: string;

  @ApiPropertyOptional({
    description: 'Quantity affected',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Additional notes about the discrepancy',
    example: 'Caja dañada durante el transporte, producto con golpes visibles',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Photo URLs documenting the discrepancy',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
