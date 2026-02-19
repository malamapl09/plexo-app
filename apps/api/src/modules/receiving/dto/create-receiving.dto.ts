import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { SupplierType } from '@prisma/client';

export class CreateReceivingDto {
  @ApiProperty({
    description: 'Store ID where receiving takes place',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  storeId: string;

  @ApiProperty({
    description: 'Type of supplier',
    enum: SupplierType,
    example: 'DISTRIBUTION_CENTER',
  })
  @IsEnum(SupplierType)
  supplierType: SupplierType;

  @ApiProperty({
    description: 'Name of the supplier',
    example: 'Centro de Distribución Principal',
  })
  @IsString()
  supplierName: string;

  @ApiPropertyOptional({
    description: 'Purchase Order number',
    example: 'PO-2024-001234',
  })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional({
    description: 'Scheduled arrival time',
    example: '2024-01-15T08:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @ApiPropertyOptional({
    description: 'Driver name',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional({
    description: 'Truck license plate',
    example: 'A123456',
  })
  @IsOptional()
  @IsString()
  truckPlate?: string;

  @ApiPropertyOptional({
    description: 'Expected number of items/boxes',
    example: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  itemCount?: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Entrega de temporada navideña',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
