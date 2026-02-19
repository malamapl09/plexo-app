import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum CorrectiveActionStatusDto {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  VERIFIED = 'VERIFIED',
}

export class UpdateCorrectiveActionDto {
  @ApiPropertyOptional({ enum: CorrectiveActionStatusDto, description: 'Action status' })
  @IsEnum(CorrectiveActionStatusDto)
  @IsOptional()
  status?: CorrectiveActionStatusDto;

  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsString()
  @IsOptional()
  completionNotes?: string;

  @ApiPropertyOptional({ description: 'Completion photo URLs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  completionPhotoUrls?: string[];
}
