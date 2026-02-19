import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;
}

export class StoreInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;
}

export class UserInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class TaskAssignmentResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty({ type: StoreInfo })
  store: StoreInfo;

  @ApiProperty()
  status: string;

  @ApiProperty()
  assignedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  completedAt?: Date | null;

  @ApiPropertyOptional({ type: UserInfo, nullable: true })
  completedBy?: UserInfo | null;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({ type: [String] })
  photoUrls: string[];
}

export class TaskResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ type: DepartmentInfo, nullable: true })
  department?: DepartmentInfo | null;

  @ApiProperty()
  priority: string;

  @ApiPropertyOptional({ nullable: true })
  scheduledTime?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  dueTime?: Date | null;

  @ApiProperty({ type: UserInfo })
  createdBy: UserInfo;

  @ApiProperty()
  isRecurring: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: [TaskAssignmentResponse] })
  assignments?: TaskAssignmentResponse[];
}

export class TaskListResponse {
  @ApiProperty({ type: [TaskResponse] })
  tasks: TaskResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ComplianceStats {
  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 32 })
  completed: number;

  @ApiProperty({ example: 10 })
  pending: number;

  @ApiProperty({ example: 3 })
  overdue: number;

  @ApiProperty({ example: 71.1 })
  completionRate: number;
}

export class StoreComplianceStats {
  @ApiProperty()
  storeId: string;

  @ApiProperty()
  storeName: string;

  @ApiProperty()
  storeCode: string;

  @ApiProperty({ type: ComplianceStats })
  stats: ComplianceStats;
}

export class ComplianceDashboardResponse {
  @ApiProperty({ type: ComplianceStats })
  overall: ComplianceStats;

  @ApiProperty({ type: [StoreComplianceStats] })
  byStore: StoreComplianceStats[];

  @ApiProperty()
  date: string;
}
