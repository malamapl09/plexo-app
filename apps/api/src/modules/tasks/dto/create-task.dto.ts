import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum DistributionType {
  ALL_STORES = 'ALL_STORES',
  BY_REGION = 'BY_REGION',
  SPECIFIC_STORES = 'SPECIFIC_STORES',
}

export class CreateTaskDto {
  @ApiProperty({
    example: 'Verificar precios de ofertas semanales',
    description: 'Título de la tarea',
  })
  @IsString()
  @IsNotEmpty({ message: 'El título es requerido' })
  title: string;

  @ApiPropertyOptional({
    example: 'Revisar que todos los precios de la circular estén actualizados en góndola',
    description: 'Descripción detallada de la tarea',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID del departamento (opcional, si aplica a un departamento específico)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID de departamento inválido' })
  departmentId?: string;

  @ApiProperty({
    enum: Priority,
    example: Priority.MEDIUM,
    description: 'Prioridad de la tarea',
  })
  @IsEnum(Priority, { message: 'Prioridad inválida' })
  priority: Priority;

  @ApiPropertyOptional({
    example: '2025-12-20T09:00:00Z',
    description: 'Hora programada para la tarea',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha programada inválida' })
  scheduledTime?: string;

  @ApiPropertyOptional({
    example: '2025-12-20T17:00:00Z',
    description: 'Fecha límite para completar la tarea',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha límite inválida' })
  dueTime?: string;

  @ApiProperty({
    enum: DistributionType,
    example: DistributionType.ALL_STORES,
    description: 'Tipo de distribución de la tarea',
  })
  @IsEnum(DistributionType, { message: 'Tipo de distribución inválido' })
  distributionType: DistributionType;

  @ApiPropertyOptional({
    example: ['region-santo-domingo'],
    description: 'IDs de regiones (si distributionType es BY_REGION)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'ID de región inválido' })
  regionIds?: string[];

  @ApiPropertyOptional({
    example: ['store-id-1', 'store-id-2'],
    description: 'IDs de tiendas específicas (si distributionType es SPECIFIC_STORES)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'ID de tienda inválido' })
  storeIds?: string[];

  @ApiPropertyOptional({
    description: 'ID de plantilla de tarea (si aplica)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID de plantilla inválido' })
  templateId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Si la tarea es recurrente',
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    example: { freq: 'DAILY', interval: 1 },
    description: 'Regla de recurrencia (formato RRULE simplificado)',
  })
  @IsOptional()
  recurringRule?: Record<string, any>;
}
