import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { IssueCategory, Priority } from '@prisma/client';

export class CreateIssueDto {
  @ApiProperty({
    description: 'Store ID where the issue occurred',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  storeId: string;

  @ApiProperty({
    description: 'Issue category for routing',
    enum: IssueCategory,
    example: 'MAINTENANCE',
  })
  @IsEnum(IssueCategory)
  category: IssueCategory;

  @ApiProperty({
    description: 'Issue priority',
    enum: Priority,
    example: 'HIGH',
  })
  @IsEnum(Priority)
  priority: Priority;

  @ApiProperty({
    description: 'Short title describing the issue',
    example: 'Aire acondicionado no funciona',
    minLength: 5,
    maxLength: 100,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'El aire acondicionado del área de electrodomésticos dejó de funcionar esta mañana. La temperatura está muy alta.',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({
    description: 'Photo URLs documenting the issue',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
