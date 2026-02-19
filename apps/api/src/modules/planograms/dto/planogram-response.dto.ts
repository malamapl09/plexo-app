import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanogramSubmissionStatus } from '@prisma/client';

export class PlanogramTemplateResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: [String] })
  referencePhotoUrls: string[];

  @ApiProperty({ type: [String] })
  targetStoreIds: string[];

  @ApiProperty({ type: [String] })
  targetRegionIds: string[];

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  createdBy?: { id: string; name: string; email: string };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  submissionCount?: number;

  @ApiPropertyOptional()
  approvedCount?: number;
}

export class PlanogramTemplateListResponse {
  @ApiProperty({ type: [PlanogramTemplateResponse] })
  templates: PlanogramTemplateResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PlanogramSubmissionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateId: string;

  @ApiPropertyOptional()
  templateName?: string;

  @ApiProperty()
  storeId: string;

  @ApiPropertyOptional()
  storeName?: string;

  @ApiProperty({ type: [String] })
  photoUrls: string[];

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ enum: PlanogramSubmissionStatus })
  status: PlanogramSubmissionStatus;

  @ApiPropertyOptional()
  submittedBy?: { id: string; name: string; email: string };

  @ApiPropertyOptional()
  reviewedBy?: { id: string; name: string; email: string };

  @ApiPropertyOptional()
  reviewNotes?: string;

  @ApiPropertyOptional()
  reviewedAt?: Date;

  @ApiProperty()
  submittedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PlanogramSubmissionListResponse {
  @ApiProperty({ type: [PlanogramSubmissionResponse] })
  submissions: PlanogramSubmissionResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class PlanogramDashboardResponse {
  @ApiProperty()
  totalTemplates: number;

  @ApiProperty()
  totalSubmissions: number;

  @ApiProperty()
  overallComplianceRate: number;

  @ApiProperty({ type: [Object] })
  complianceByStore: {
    storeId: string;
    storeName: string;
    approvedSubmissions: number;
    totalTemplates: number;
    complianceRate: number;
  }[];

  @ApiProperty({ type: [Object] })
  complianceByTemplate: {
    templateId: string;
    templateName: string;
    approvedSubmissions: number;
    totalTargetStores: number;
    complianceRate: number;
  }[];

  @ApiProperty({ type: [Object] })
  recentSubmissions: PlanogramSubmissionResponse[];
}
