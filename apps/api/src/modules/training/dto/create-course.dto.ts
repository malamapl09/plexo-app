import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TrainingCourseCategory,
  TrainingLessonType,
  TrainingQuizQuestionType,
} from '@prisma/client';

export class CreateQuizOptionDto {
  @ApiProperty({ example: 'Opcion A' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuizQuestionDto {
  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  sortOrder: number;

  @ApiProperty({ example: 'Cual es el primer paso al recibir mercancia?' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ enum: TrainingQuizQuestionType, example: 'MULTIPLE_CHOICE' })
  @IsEnum(TrainingQuizQuestionType)
  type: TrainingQuizQuestionType;

  @ApiProperty({ type: [CreateQuizOptionDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDto)
  options: CreateQuizOptionDto[];

  @ApiPropertyOptional({ example: 'Se debe verificar la orden de compra primero' })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateLessonDto {
  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  sortOrder: number;

  @ApiProperty({ example: 'Introduccion al proceso' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: TrainingLessonType, example: 'TEXT' })
  @IsEnum(TrainingLessonType)
  type: TrainingLessonType;

  @ApiPropertyOptional({ example: 'Contenido de la leccion...' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'https://minio.example.com/documents/manual.pdf' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedMinutes?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ type: [CreateQuizQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions?: CreateQuizQuestionDto[];
}

export class CreateCourseDto {
  @ApiProperty({ example: 'Recepcion de Mercancia' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Procedimiento estandar para recepcion de mercancia' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TrainingCourseCategory, example: 'OPERATIONS' })
  @IsEnum(TrainingCourseCategory)
  category: TrainingCourseCategory;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({ example: 'ALL' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetStoreIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRoleIds?: string[];

  @ApiPropertyOptional({ example: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  certificationValidDays?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({ type: [CreateLessonDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLessonDto)
  lessons?: CreateLessonDto[];
}
