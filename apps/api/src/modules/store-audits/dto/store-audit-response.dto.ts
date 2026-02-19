import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UserSummary {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;
}

class StoreSummary {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;
}

class AuditQuestionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  text: string;

  @ApiProperty()
  questionType: string;

  @ApiProperty()
  maxScore: number;

  @ApiProperty()
  requiresPhoto: boolean;
}

class AuditSectionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  weight: number;

  @ApiProperty({ type: [AuditQuestionResponse] })
  questions: AuditQuestionResponse[];
}

export class AuditTemplateResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [AuditSectionResponse] })
  sections: AuditSectionResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

class AuditAnswerResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  questionId: string;

  @ApiPropertyOptional()
  score?: number;

  @ApiPropertyOptional()
  booleanValue?: boolean;

  @ApiPropertyOptional()
  textValue?: string;

  @ApiProperty({ type: [String] })
  photoUrls: string[];

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;
}

export class CorrectiveActionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  findingId: string;

  @ApiProperty({ type: UserSummary })
  assignedTo: UserSummary;

  @ApiProperty()
  dueDate: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  completionNotes?: string;

  @ApiProperty({ type: [String] })
  completionPhotoUrls: string[];

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuditFindingResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeAuditId: string;

  @ApiPropertyOptional()
  sectionId?: string;

  @ApiProperty()
  severity: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  photoUrls: string[];

  @ApiProperty()
  status: string;

  @ApiPropertyOptional({ type: CorrectiveActionResponse })
  correctiveAction?: CorrectiveActionResponse;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class StoreAuditResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateId: string;

  @ApiPropertyOptional()
  templateName?: string;

  @ApiPropertyOptional({ type: AuditTemplateResponse })
  template?: AuditTemplateResponse;

  @ApiProperty({ type: StoreSummary })
  store: StoreSummary;

  @ApiProperty()
  scheduledDate: string;

  @ApiProperty()
  status: string;

  @ApiProperty({ type: UserSummary })
  auditor: UserSummary;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  overallScore?: number;

  @ApiPropertyOptional()
  actualScore?: number;

  @ApiPropertyOptional()
  maxPossibleScore?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: [AuditAnswerResponse] })
  answers: AuditAnswerResponse[];

  @ApiProperty({ type: [AuditFindingResponse] })
  findings: AuditFindingResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

class StoreScoreData {
  @ApiProperty()
  storeId: string;

  @ApiProperty()
  storeName: string;

  @ApiProperty()
  averageScore: number;

  @ApiProperty()
  auditCount: number;
}

export class AuditDashboardResponse {
  @ApiProperty()
  totalAudits: number;

  @ApiProperty()
  completedAudits: number;

  @ApiProperty()
  scheduledAudits: number;

  @ApiProperty()
  inProgressAudits: number;

  @ApiProperty()
  averageScore: number;

  @ApiProperty()
  openFindings: number;

  @ApiProperty()
  criticalFindings: number;

  @ApiProperty()
  overdueActions: number;

  @ApiProperty({ type: [StoreScoreData] })
  scoresByStore: StoreScoreData[];
}
