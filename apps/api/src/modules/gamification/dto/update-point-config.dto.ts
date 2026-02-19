import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePointConfigDto {
  @ApiProperty({ example: 15, description: 'Points awarded for this action' })
  @IsInt()
  @Min(0)
  points: number;

  @ApiPropertyOptional({
    example: 'Points awarded for completing a task on time',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
