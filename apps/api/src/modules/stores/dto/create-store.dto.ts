import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({
    example: 'Sucursal Winston Churchill',
    description: 'Nombre de la tienda',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  name: string;

  @ApiProperty({
    example: 'PLZ-001',
    description: 'Código único de la tienda',
  })
  @IsString()
  @IsNotEmpty({ message: 'El código es requerido' })
  code: string;

  @ApiProperty({
    example: 'Av. Winston Churchill, Santo Domingo',
    description: 'Dirección de la tienda',
  })
  @IsString()
  @IsNotEmpty({ message: 'La dirección es requerida' })
  address: string;

  @ApiProperty({
    required: false,
    example: 18.4861,
    description: 'Latitud de la tienda',
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    required: false,
    example: -69.9312,
    description: 'Longitud de la tienda',
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    description: 'ID de la región',
  })
  @IsUUID('4', { message: 'ID de región inválido' })
  @IsNotEmpty({ message: 'La región es requerida' })
  regionId: string;
}
