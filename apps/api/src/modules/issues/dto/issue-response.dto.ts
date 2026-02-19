import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssueCategory, IssueStatus, Priority, VerificationStatus } from '@prisma/client';

export class IssueResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  store: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty({ enum: IssueCategory })
  category: IssueCategory;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: IssueStatus })
  status: IssueStatus;

  @ApiProperty()
  reportedBy: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional()
  assignedTo?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional()
  resolvedBy?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional()
  verifiedBy?: {
    id: string;
    name: string;
  };

  @ApiProperty({ type: [String] })
  photoUrls: string[];

  @ApiPropertyOptional()
  resolutionNotes?: string;

  @ApiPropertyOptional()
  resolvedAt?: Date;

  @ApiPropertyOptional({ enum: VerificationStatus })
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional()
  verifiedAt?: Date;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  escalatedAt?: Date;

  @ApiProperty()
  isEscalated: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class IssueListResponseDto {
  @ApiProperty({ type: [IssueResponseDto] })
  data: IssueResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class IssueStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  reported: number;

  @ApiProperty()
  assigned: number;

  @ApiProperty()
  inProgress: number;

  @ApiProperty()
  resolved: number;

  @ApiProperty()
  escalated: number;

  @ApiProperty()
  avgResolutionTimeHours: number;
}

export class IssueCategoryStatsDto {
  @ApiProperty({ enum: IssueCategory })
  category: IssueCategory;

  @ApiProperty()
  categoryLabel: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  open: number;

  @ApiProperty()
  resolved: number;

  @ApiProperty()
  escalated: number;
}

export class IssueDashboardDto {
  @ApiProperty()
  stats: IssueStatsDto;

  @ApiProperty({ type: [IssueCategoryStatsDto] })
  byCategory: IssueCategoryStatsDto[];

  @ApiProperty({ type: [IssueResponseDto] })
  recentIssues: IssueResponseDto[];

  @ApiProperty({ type: [IssueResponseDto] })
  escalatedIssues: IssueResponseDto[];

  @ApiProperty({ type: [IssueResponseDto] })
  highPriorityIssues: IssueResponseDto[];
}
