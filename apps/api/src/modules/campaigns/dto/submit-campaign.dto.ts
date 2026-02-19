import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsUUID,
  ArrayMinSize,
  IsOptional,
} from 'class-validator';

export class SubmitCampaignDto {
  @ApiProperty({ example: 'store-uuid' })
  @IsUUID()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({
    type: [String],
    example: [
      'https://minio.example.com/campaigns/submission-1.jpg',
      'https://minio.example.com/campaigns/submission-2.jpg',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  photoUrls: string[];

  @ApiPropertyOptional({
    example: 'Banner colocado en entrada principal, etiquetas actualizadas',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
