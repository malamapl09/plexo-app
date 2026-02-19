import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsUUID,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';

export class SubmitPlanogramDto {
  @ApiProperty({ example: 'store-uuid' })
  @IsUUID()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({
    type: [String],
    example: ['https://minio.example.com/planograms/submission-1.jpg', 'https://minio.example.com/planograms/submission-2.jpg']
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  photoUrls: string[];

  @ApiPropertyOptional({ example: 'Implementado según referencia con pequeños ajustes por disponibilidad de espacio' })
  @IsOptional()
  @IsString()
  notes?: string;
}
