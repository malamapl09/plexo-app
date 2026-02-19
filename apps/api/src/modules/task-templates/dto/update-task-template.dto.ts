import { PartialType } from '@nestjs/swagger';
import { CreateTaskTemplateDto } from './create-task-template.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateTaskTemplateDto extends PartialType(CreateTaskTemplateDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Si la plantilla está activa',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
