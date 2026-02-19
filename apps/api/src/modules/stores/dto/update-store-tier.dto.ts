import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { StoreTier } from '@prisma/client';

export class UpdateStoreTierDto {
  @ApiProperty({ enum: StoreTier, example: 'MEDIUM' })
  @IsEnum(StoreTier)
  tier: StoreTier;

  @ApiPropertyOptional({ example: true, description: 'Lock tier to prevent auto-update' })
  @IsOptional()
  @IsBoolean()
  override?: boolean;
}
