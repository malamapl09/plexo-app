import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class BulkEnrollDto {
  @ApiProperty({ type: [String], example: ['user-uuid-1', 'user-uuid-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];
}

export class EnrollByRoleDto {
  @ApiProperty({ example: 'STORE_MANAGER' })
  @IsString()
  role: string;

  @ApiPropertyOptional({ type: [String], example: ['store-uuid-1'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  storeIds?: string[];
}
