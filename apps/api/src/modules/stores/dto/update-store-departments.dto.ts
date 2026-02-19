import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateStoreDepartmentsDto {
  @ApiProperty({ type: [String], description: 'Department IDs to activate for this store' })
  @IsArray()
  @IsString({ each: true })
  departmentIds: string[];
}
