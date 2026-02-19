import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsArray,
} from 'class-validator';
import { IssueCategory, IssueStatus, Priority } from '@prisma/client';

export class UpdateIssueDto {
  @ApiPropertyOptional({
    description: 'Issue status',
    enum: IssueStatus,
  })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({
    description: 'Issue priority',
    enum: Priority,
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'User ID to assign the issue to',
  })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({
    description: 'Additional photo URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}

export class AssignIssueDto {
  @ApiPropertyOptional({
    description: 'User ID to assign the issue to',
  })
  @IsUUID()
  assignedToId: string;
}

export class RecategorizeIssueDto {
  @ApiPropertyOptional({
    description: 'New issue category',
    enum: IssueCategory,
  })
  @IsEnum(IssueCategory)
  category: IssueCategory;
}

export class ResolveIssueDto {
  @ApiPropertyOptional({
    description: 'Resolution notes explaining how the issue was resolved',
    example: 'Se reemplazó el compresor del aire acondicionado. Funcionando correctamente ahora.',
  })
  @IsString()
  resolutionNotes: string;

  @ApiPropertyOptional({
    description: 'Photo URLs of the resolution',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoUrls?: string[];
}
