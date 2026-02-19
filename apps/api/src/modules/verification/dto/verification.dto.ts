import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class VerifyTaskDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

export class RejectTaskDto {
  @ApiProperty({ description: 'Razón del rechazo' })
  @IsString()
  @IsNotEmpty({ message: 'La razón de rechazo es requerida' })
  rejectionReason: string;
}

export class VerifyIssueDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

export class RejectIssueDto {
  @ApiProperty({ description: 'Razón del rechazo' })
  @IsString()
  @IsNotEmpty({ message: 'La razón de rechazo es requerida' })
  rejectionReason: string;
}

export class PendingVerificationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeId?: string;
}
