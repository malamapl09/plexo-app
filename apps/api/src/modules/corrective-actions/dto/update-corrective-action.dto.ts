import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CorrectiveActionStatus } from '@prisma/client';

export class UpdateCorrectiveActionDto {
  @ApiPropertyOptional({
    enum: CorrectiveActionStatus,
    description: 'Action status',
  })
  @IsEnum(CorrectiveActionStatus)
  @IsOptional()
  status?: CorrectiveActionStatus;

  @ApiPropertyOptional({ description: 'Completion notes (required when marking as COMPLETED)' })
  @IsString()
  @IsOptional()
  completionNotes?: string;

  @ApiPropertyOptional({
    description: 'Completion photo URLs',
    type: [String],
    example: ['https://s3.amazonaws.com/bucket/photo1.jpg'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  completionPhotoUrls?: string[];
}
