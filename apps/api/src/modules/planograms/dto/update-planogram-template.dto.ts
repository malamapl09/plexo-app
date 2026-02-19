import { PartialType } from '@nestjs/swagger';
import { CreatePlanogramTemplateDto } from './create-planogram-template.dto';

export class UpdatePlanogramTemplateDto extends PartialType(
  CreatePlanogramTemplateDto,
) {}
