import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentInfo {
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

export class TaskTemplateResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: DepartmentInfo })
  department?: DepartmentInfo;

  @ApiProperty()
  priority: string;

  @ApiPropertyOptional()
  defaultScheduledTime?: string;

  @ApiPropertyOptional()
  defaultDueTime?: string;

  @ApiProperty()
  distributionType: string;

  @ApiProperty({ type: [String] })
  defaultRegionIds: string[];

  @ApiProperty({ type: [String] })
  defaultStoreIds: string[];

  @ApiProperty()
  isRecurring: boolean;

  @ApiPropertyOptional()
  recurringRule?: Record<string, any>;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: UserInfo })
  createdBy?: UserInfo;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TaskTemplateListResponse {
  @ApiProperty({ type: [TaskTemplateResponse] })
  templates: TaskTemplateResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
