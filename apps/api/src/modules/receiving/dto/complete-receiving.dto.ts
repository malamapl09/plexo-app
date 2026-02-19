import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class CompleteReceivingDto {
  @ApiPropertyOptional({
    description: 'Final item count received',
    example: 48,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  itemCount?: number;

  @ApiPropertyOptional({
    description: 'Completion notes',
    example: 'Recepción completa, todo en orden',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Photo URLs of the receiving',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];

  @ApiProperty({
    description: 'Digital signature URL',
    example: 'https://storage.example.com/signatures/abc123.png',
  })
  @IsString()
  signatureUrl: string;
}
