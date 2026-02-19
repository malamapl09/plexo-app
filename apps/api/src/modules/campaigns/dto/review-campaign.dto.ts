import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';
import { CampaignSubmissionStatus } from '@prisma/client';

export class ReviewCampaignDto {
  @ApiProperty({
    enum: [CampaignSubmissionStatus.APPROVED, CampaignSubmissionStatus.NEEDS_REVISION],
    example: 'APPROVED',
    description: 'Only APPROVED or NEEDS_REVISION are valid review decisions',
  })
  @IsIn([CampaignSubmissionStatus.APPROVED, CampaignSubmissionStatus.NEEDS_REVISION])
  @IsNotEmpty()
  status: CampaignSubmissionStatus;

  @ApiPropertyOptional({
    example: 'Excelente ejecucion, materiales bien posicionados',
  })
  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
