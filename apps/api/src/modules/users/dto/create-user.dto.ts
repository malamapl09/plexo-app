import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsUUID,
  IsArray,
  IsEnum,
} from 'class-validator';

export enum IssueCategory {
  MAINTENANCE = 'MAINTENANCE',
  CLEANING = 'CLEANING',
  SECURITY = 'SECURITY',
  IT_SYSTEMS = 'IT_SYSTEMS',
  PERSONNEL = 'PERSONNEL',
  INVENTORY = 'INVENTORY',
}

export class CreateUserDto {
  @ApiProperty({
    example: 'usuario@empresa.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @IsNotEmpty({ message: 'El correo es requerido' })
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Contraseña del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({
    example: 'STORE_MANAGER',
    description: 'Clave del rol del usuario (validado contra la tabla roles)',
  })
  @IsString({ message: 'Rol inválido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  role: string;

  @ApiProperty({
    required: false,
    description: 'ID de la tienda (para Store Manager y Dept Supervisor)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID de tienda inválido' })
  storeId?: string;

  @ApiProperty({
    required: false,
    description: 'ID del departamento (para Dept Supervisor)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID de departamento inválido' })
  departmentId?: string;

  @ApiProperty({
    required: false,
    enum: IssueCategory,
    isArray: true,
    description: 'Categorías de incidencias que este usuario puede manejar',
    example: [IssueCategory.MAINTENANCE, IssueCategory.CLEANING],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(IssueCategory, { each: true, message: 'Categoría de incidencia inválida' })
  issueCategories?: IssueCategory[];
}
