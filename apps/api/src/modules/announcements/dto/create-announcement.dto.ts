import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsArray,
  IsDateString,
  MaxLength,
} from 'class-validator';

export enum AnnouncementType {
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  OPERATIONAL_UPDATE = 'OPERATIONAL_UPDATE',
  POLICY_UPDATE = 'POLICY_UPDATE',
  TRAINING = 'TRAINING',
  EMERGENCY = 'EMERGENCY',
  GENERAL = 'GENERAL',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum AnnouncementScope {
  ALL = 'ALL',
  STORES = 'STORES',
  REGIONS = 'REGIONS',
  ROLES = 'ROLES',
}

export class CreateAnnouncementDto {
  @ApiProperty({
    example: 'Actualización de precios de temporada',
    description: 'Título del anuncio',
  })
  @IsString()
  @IsNotEmpty({ message: 'El título es requerido' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  title: string;

  @ApiProperty({
    example: 'A partir del lunes 25, todos los precios de temporada...',
    description: 'Contenido del anuncio (markdown permitido)',
  })
  @IsString()
  @IsNotEmpty({ message: 'El contenido es requerido' })
  content: string;

  @ApiPropertyOptional({
    example: 'Cambios importantes en precios de temporada',
    description: 'Resumen breve para vista previa',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'El resumen no puede exceder 300 caracteres' })
  summary?: string;

  @ApiProperty({
    enum: AnnouncementType,
    example: AnnouncementType.OPERATIONAL_UPDATE,
    description: 'Tipo de anuncio',
    default: AnnouncementType.GENERAL,
  })
  @IsOptional()
  @IsEnum(AnnouncementType, { message: 'Tipo de anuncio inválido' })
  type?: AnnouncementType;

  @ApiProperty({
    enum: Priority,
    example: Priority.MEDIUM,
    description: 'Prioridad del anuncio',
    default: Priority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(Priority, { message: 'Prioridad inválida' })
  priority?: Priority;

  @ApiProperty({
    enum: AnnouncementScope,
    example: AnnouncementScope.ALL,
    description: 'Alcance del anuncio',
    default: AnnouncementScope.ALL,
  })
  @IsOptional()
  @IsEnum(AnnouncementScope, { message: 'Alcance inválido' })
  scope?: AnnouncementScope;

  @ApiPropertyOptional({
    example: ['store-id-1', 'store-id-2'],
    description: 'IDs de tiendas objetivo (si scope es STORES)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'ID de tienda inválido' })
  targetStoreIds?: string[];

  @ApiPropertyOptional({
    example: ['region-id-1'],
    description: 'IDs de regiones objetivo (si scope es REGIONS)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'ID de región inválido' })
  targetRegionIds?: string[];

  @ApiPropertyOptional({
    example: ['STORE_MANAGER', 'DEPT_SUPERVISOR'],
    description: 'Roles objetivo (si scope es ROLES)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoles?: string[];

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'URL de imagen destacada',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/doc.pdf'],
    description: 'URLs de archivos adjuntos',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];

  @ApiPropertyOptional({
    example: false,
    description: 'Si requiere confirmación de lectura',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresAck?: boolean;

  @ApiPropertyOptional({
    example: '2025-12-25T09:00:00Z',
    description: 'Fecha programada para publicación',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha programada inválida' })
  scheduledFor?: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59Z',
    description: 'Fecha de expiración',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha de expiración inválida' })
  expiresAt?: string;
}
