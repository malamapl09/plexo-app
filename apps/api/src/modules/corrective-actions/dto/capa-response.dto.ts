import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CorrectiveActionStatus,
  CAPASourceType,
  Priority,
} from '@prisma/client';

export class AssignedUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;
}

export class StoreDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;
}

export class CreatedByDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class FindingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  severity: string;
}

export class CapaDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  findingId?: string;

  @ApiPropertyOptional({ type: FindingDto })
  finding?: FindingDto;

  @ApiProperty({ enum: CAPASourceType })
  sourceType: CAPASourceType;

  @ApiPropertyOptional()
  sourceId?: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty({ type: StoreDto })
  store: StoreDto;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiProperty()
  assignedToId: string;

  @ApiProperty({ type: AssignedUserDto })
  assignedTo: AssignedUserDto;

  @ApiPropertyOptional()
  createdById?: string;

  @ApiPropertyOptional({ type: CreatedByDto })
  createdBy?: CreatedByDto;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty({ enum: CorrectiveActionStatus })
  status: CorrectiveActionStatus;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  completionNotes?: string;

  @ApiPropertyOptional({ type: [String] })
  completionPhotoUrls?: string[];

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  verifiedById?: string;

  @ApiPropertyOptional({ type: CreatedByDto })
  verifiedBy?: CreatedByDto;

  @ApiPropertyOptional()
  verifiedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CapaListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: CAPASourceType })
  sourceType: CAPASourceType;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiProperty({ enum: CorrectiveActionStatus })
  status: CorrectiveActionStatus;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty()
  storeId: string;

  @ApiProperty({ type: StoreDto })
  store: StoreDto;

  @ApiProperty({ type: AssignedUserDto })
  assignedTo: AssignedUserDto;

  @ApiPropertyOptional({ type: CreatedByDto })
  createdBy?: CreatedByDto;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  isOverdue: boolean;
}

export class CapaListResponseDto {
  @ApiProperty({ type: [CapaListItemDto] })
  items: CapaListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class CapaStatusSummaryDto {
  @ApiProperty()
  pending: number;

  @ApiProperty()
  inProgress: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  overdue: number;

  @ApiProperty()
  verified: number;
}

export class CapaByStoreDto {
  @ApiProperty()
  storeId: string;

  @ApiProperty()
  storeName: string;

  @ApiProperty()
  totalActions: number;

  @ApiProperty()
  pendingActions: number;

  @ApiProperty()
  overdueActions: number;

  @ApiProperty()
  completionRate: number;
}

export class CapaByAssigneeDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  totalAssigned: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  overdue: number;
}

export class CapaDashboardResponseDto {
  @ApiProperty({ type: CapaStatusSummaryDto })
  statusSummary: CapaStatusSummaryDto;

  @ApiProperty({ type: [CapaByStoreDto] })
  byStore: CapaByStoreDto[];

  @ApiProperty({ type: [CapaByAssigneeDto] })
  byAssignee: CapaByAssigneeDto[];

  @ApiProperty({ description: 'Average resolution time in hours' })
  avgResolutionTime: number;

  @ApiProperty({ description: 'Total actions created' })
  totalActions: number;
}
