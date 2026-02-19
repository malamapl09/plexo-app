import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsUrl } from 'class-validator';

export class CompleteTaskDto {
  @ApiPropertyOptional({
    example: 'Tarea completada sin observaciones',
    description: 'Notas adicionales sobre la completación',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: ['https://storage.example.com/photos/task-123-1.jpg'],
    description: 'URLs de fotos de verificación',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
