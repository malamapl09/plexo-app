import { PartialType } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @ApiProperty({
    required: false,
    description: 'Estado activo de la tienda',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
