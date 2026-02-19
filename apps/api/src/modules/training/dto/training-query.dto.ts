import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  TrainingCourseCategory,
  TrainingEnrollmentStatus,
} from '@prisma/client';

export class CourseQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: TrainingCourseCategory })
  @IsOptional()
  @IsEnum(TrainingCourseCategory)
  category?: TrainingCourseCategory;

  @ApiPropertyOptional({ example: 'recepcion' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class EnrollmentQueryDto {
  @ApiPropertyOptional({ enum: TrainingEnrollmentStatus })
  @IsOptional()
  @IsEnum(TrainingEnrollmentStatus)
  status?: TrainingEnrollmentStatus;
}
