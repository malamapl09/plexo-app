import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsArray,
  Matches,
} from 'class-validator';

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

export class CreateTaskTemplateDto {
  @ApiProperty({
    example: 'Verificación de precios diaria',
    description: 'Nombre de la plantilla',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiPropertyOptional({
    example: 'Revisar que todos los precios estén actualizados',
    description: 'Descripción de la plantilla',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID del departamento por defecto',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID de departamento inválido' })
  departmentId?: string;

  @ApiProperty({
    enum: Priority,
    example: Priority.MEDIUM,
    description: 'Prioridad por defecto',
    default: Priority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(Priority, { message: 'Prioridad inválida' })
  priority?: Priority;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Hora programada por defecto (formato HH:mm)',
  })
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Hora programada debe estar en formato HH:mm',
  })
  defaultScheduledTime?: string;

  @ApiPropertyOptional({
    example: '17:00',
    description: 'Hora límite por defecto (formato HH:mm)',
  })
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Hora límite debe estar en formato HH:mm',
  })
  defaultDueTime?: string;

  @ApiProperty({
    enum: DistributionType,
    example: DistributionType.ALL_STORES,
    description: 'Tipo de distribución por defecto',
    default: DistributionType.ALL_STORES,
  })
  @IsOptional()
  @IsEnum(DistributionType, { message: 'Tipo de distribución inválido' })
  distributionType?: DistributionType;

  @ApiPropertyOptional({
    example: ['region-id-1'],
    description: 'IDs de regiones por defecto',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'ID de región inválido' })
  defaultRegionIds?: string[];

  @ApiPropertyOptional({
    example: ['store-id-1', 'store-id-2'],
    description: 'IDs de tiendas por defecto',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'ID de tienda inválido' })
  defaultStoreIds?: string[];

  @ApiPropertyOptional({
    example: false,
    description: 'Si las tareas creadas desde esta plantilla son recurrentes',
    default: false,
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
