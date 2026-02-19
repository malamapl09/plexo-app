import { IsString, IsOptional, IsInt, IsBoolean, IsArray, IsUUID, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Question UUID' })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({ description: 'Score for SCORE type questions' })
  @IsInt()
  @Min(0)
  @IsOptional()
  @ValidateIf((o) => o.score !== undefined && o.score !== null)
  score?: number;

  @ApiPropertyOptional({ description: 'Boolean value for YES_NO type questions' })
  @IsBoolean()
  @IsOptional()
  @ValidateIf((o) => o.booleanValue !== undefined && o.booleanValue !== null)
  booleanValue?: boolean;

  @ApiPropertyOptional({ description: 'Text value for TEXT type questions' })
  @IsString()
  @IsOptional()
  textValue?: string;

  @ApiPropertyOptional({ description: 'Photo URLs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photoUrls?: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
