import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';
import { PlanogramSubmissionStatus } from '@prisma/client';

export class ReviewPlanogramDto {
  @ApiProperty({
    enum: PlanogramSubmissionStatus,
    example: 'APPROVED'
  })
  @IsIn([PlanogramSubmissionStatus.APPROVED, PlanogramSubmissionStatus.NEEDS_REVISION])
  @IsNotEmpty()
  status: PlanogramSubmissionStatus;

  @ApiPropertyOptional({ example: 'Productos bien posicionados, pero ajustar altura del estante superior' })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
