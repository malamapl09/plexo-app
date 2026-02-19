import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum QuestionTypeDto {
  SCORE = 'SCORE',
  YES_NO = 'YES_NO',
  TEXT = 'TEXT',
}

export class CreateAuditQuestionDto {
  @ApiProperty({ description: 'Question order within section' })
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({ description: 'Question text' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ enum: QuestionTypeDto, default: 'SCORE' })
  @IsEnum(QuestionTypeDto)
  @IsOptional()
  questionType?: QuestionTypeDto = QuestionTypeDto.SCORE;

  @ApiPropertyOptional({ description: 'Maximum score for this question', default: 5 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxScore?: number = 5;

  @ApiPropertyOptional({ description: 'Whether photo is required', default: false })
  @IsBoolean()
  @IsOptional()
  requiresPhoto?: boolean = false;
}

export class CreateAuditSectionDto {
  @ApiProperty({ description: 'Section order within template' })
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({ description: 'Section title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Section description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Section weight for scoring', default: 1.0 })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  weight?: number = 1.0;

  @ApiProperty({ type: [CreateAuditQuestionDto], description: 'Questions in this section' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAuditQuestionDto)
  questions: CreateAuditQuestionDto[];
}

export class CreateAuditTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [CreateAuditSectionDto], description: 'Sections in this template' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAuditSectionDto)
  sections: CreateAuditSectionDto[];
}
