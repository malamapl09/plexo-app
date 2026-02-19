import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';
import { ReceivingStatus } from '@prisma/client';

export class UpdateReceivingDto {
  @ApiPropertyOptional({
    description: 'Receiving status',
    enum: ReceivingStatus,
    example: 'IN_PROGRESS',
  })
  @IsOptional()
  @IsEnum(ReceivingStatus)
  status?: ReceivingStatus;

  @ApiPropertyOptional({
    description: 'Actual arrival time',
    example: '2024-01-15T08:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

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
    description: 'Number of items/boxes received',
    example: 48,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  itemCount?: number;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Photo URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiPropertyOptional({
    description: 'Signature URL (for confirmation)',
  })
  @IsOptional()
  @IsString()
  signatureUrl?: string;
}
