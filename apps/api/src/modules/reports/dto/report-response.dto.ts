import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// COMPLIANCE REPORT
// ============================================

export class StoreComplianceDto {
  @ApiProperty()
  storeId: string;

  @ApiProperty()
  storeName: string;

  @ApiProperty()
  storeCode: string;

  @ApiProperty()
  totalTasks: number;

  @ApiProperty()
  completedTasks: number;

  @ApiProperty()
  pendingTasks: number;

  @ApiProperty()
  overdueTasks: number;

  @ApiProperty()
  complianceRate: number;

  @ApiPropertyOptional()
  completedOnTime?: number;

  @ApiPropertyOptional()
  onTimeRate?: number;
}

export class DepartmentComplianceDto {
  @ApiProperty()
  departmentId: string;

  @ApiProperty()
  departmentName: string;

  @ApiProperty()
  totalTasks: number;

  @ApiProperty()
  completedTasks: number;

  @ApiProperty()
  complianceRate: number;
}

export class ComplianceReportDto {
  @ApiProperty()
  reportDate: Date;

  @ApiProperty()
  periodStart: Date;

  @ApiProperty()
  periodEnd: Date;

  @ApiProperty()
  summary: {
    totalStores: number;
    totalTasks: number;
    totalCompleted: number;
    totalPending: number;
    totalOverdue: number;
    overallComplianceRate: number;
  };

  @ApiProperty({ type: [StoreComplianceDto] })
  byStore: StoreComplianceDto[];

  @ApiProperty({ type: [DepartmentComplianceDto] })
  byDepartment: DepartmentComplianceDto[];

  @ApiPropertyOptional()
  taskDetails?: any[];
}

// ============================================
// RECEIVING REPORT
// ============================================

export class SupplierSummaryDto {
  @ApiProperty()
  supplierName: string;

  @ApiProperty()
  supplierType: string;

  @ApiProperty()
  totalReceivings: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  withIssues: number;

  @ApiProperty()
  didNotArrive: number;

  @ApiProperty()
  totalDiscrepancies: number;

  @ApiProperty()
  discrepancyRate: number;

  @ApiPropertyOptional()
  avgProcessingTimeMinutes?: number;
}

export class ReceivingReportDto {
  @ApiProperty()
  reportDate: Date;

  @ApiProperty()
  periodStart: Date;

  @ApiProperty()
  periodEnd: Date;

  @ApiProperty()
  summary: {
    totalReceivings: number;
    completed: number;
    withIssues: number;
    didNotArrive: number;
    pending: number;
    totalDiscrepancies: number;
    avgProcessingTimeMinutes: number;
  };

  @ApiProperty({ type: [SupplierSummaryDto] })
  bySupplier: SupplierSummaryDto[];

  @ApiPropertyOptional()
  discrepancyDetails?: any[];
}

// ============================================
// ISSUE METRICS REPORT
// ============================================

export class CategoryMetricsDto {
  @ApiProperty()
  category: string;

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

  @ApiProperty()
  avgResolutionTimeHours: number;
}

export class PriorityMetricsDto {
  @ApiProperty()
  priority: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  resolved: number;

  @ApiProperty()
  avgResolutionTimeHours: number;
}

export class IssueMetricsReportDto {
  @ApiProperty()
  reportDate: Date;

  @ApiProperty()
  periodStart: Date;

  @ApiProperty()
  periodEnd: Date;

  @ApiProperty()
  summary: {
    totalIssues: number;
    reported: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    escalated: number;
    resolutionRate: number;
    avgResolutionTimeHours: number;
  };

  @ApiProperty({ type: [CategoryMetricsDto] })
  byCategory: CategoryMetricsDto[];

  @ApiProperty({ type: [PriorityMetricsDto] })
  byPriority: PriorityMetricsDto[];

  @ApiPropertyOptional()
  topIssueReporters?: any[];

  @ApiPropertyOptional()
  topResolvers?: any[];
}
