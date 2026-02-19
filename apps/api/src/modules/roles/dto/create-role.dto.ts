import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional, Matches, Min } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'AREA_MANAGER', description: 'Clave única del rol (UPPER_SNAKE_CASE, inmutable)' })
  @IsString()
  @IsNotEmpty({ message: 'La clave del rol es requerida' })
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'La clave debe ser UPPER_SNAKE_CASE (ej: AREA_MANAGER)' })
  key: string;

  @ApiProperty({ example: 'Gerente de Área', description: 'Etiqueta visible del rol' })
  @IsString()
  @IsNotEmpty({ message: 'La etiqueta es requerida' })
  label: string;

  @ApiProperty({ required: false, example: 'Supervisa múltiples departamentos' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'teal', default: 'gray' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 50, description: 'Nivel jerárquico (mayor nivel puede verificar trabajo de menor nivel)' })
  @IsInt()
  @Min(1)
  level: number;

  @ApiProperty({ required: false, example: 3, description: 'Orden de visualización' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
