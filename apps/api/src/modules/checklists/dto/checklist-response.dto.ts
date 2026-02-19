import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChecklistItemResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  requiresPhoto: boolean;

  @ApiProperty()
  requiresNote: boolean;
}

export class ChecklistTemplateResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  frequency: string;

  @ApiProperty()
  scope: string;

  @ApiProperty({ type: [String] })
  targetStoreIds: string[];

  @ApiProperty({ type: [String] })
  targetRegionIds: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: [ChecklistItemResponse] })
  items?: ChecklistItemResponse[];

  @ApiPropertyOptional()
  createdBy?: { id: string; name: string };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // For store view: today's submission status
  @ApiPropertyOptional()
  todaySubmission?: {
    id: string;
    status: string;
    completedItems: number;
    totalItems: number;
  };
}

export class ChecklistTemplateListResponse {
  @ApiProperty({ type: [ChecklistTemplateResponse] })
  templates: ChecklistTemplateResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ChecklistResponseDetail {
  @ApiProperty()
  id: string;

  @ApiProperty()
  itemId: string;

  @ApiPropertyOptional()
  itemTitle?: string;

  @ApiProperty()
  isCompleted: boolean;

  @ApiPropertyOptional()
  completedBy?: { id: string; name: string };

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty({ type: [String] })
  photoUrls: string[];

  @ApiPropertyOptional()
  notes?: string;
}

export class ChecklistSubmissionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateId: string;

  @ApiPropertyOptional()
  templateTitle?: string;

  @ApiProperty()
  storeId: string;

  @ApiPropertyOptional()
  storeName?: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  submittedBy?: { id: string; name: string };

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  score?: number;

  @ApiPropertyOptional({ type: [ChecklistResponseDetail] })
  responses?: ChecklistResponseDetail[];

  @ApiProperty()
  completedItems: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  createdAt: Date;
}

export class ChecklistSubmissionListResponse {
  @ApiProperty({ type: [ChecklistSubmissionResponse] })
  submissions: ChecklistSubmissionResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ChecklistDashboardResponse {
  @ApiProperty()
  totalTemplates: number;

  @ApiProperty()
  overallCompletionRate: number;

  @ApiProperty({ type: [Object] })
  completionByStore: {
    storeId: string;
    storeName: string;
    completionRate: number;
    completed: number;
    total: number;
  }[];

  @ApiProperty({ type: [Object] })
  completionByChecklist: {
    templateId: string;
    templateTitle: string;
    completionRate: number;
    completed: number;
    total: number;
  }[];
}
