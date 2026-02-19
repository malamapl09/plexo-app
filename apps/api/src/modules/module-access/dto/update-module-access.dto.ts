import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateModuleAccessDto {
  @ApiProperty({
    description: 'Map of module name to access boolean',
    example: { tasks: true, reports: false, users: false },
  })
  @IsObject()
  modules: Record<string, boolean>;
}
