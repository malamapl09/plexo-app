import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ReportQueryDto,
  ComplianceReportQueryDto,
  ReceivingReportQueryDto,
  IssueReportQueryDto,
  ReportPeriod,
} from './dto/report-query.dto';
import {
  ComplianceReportDto,
  StoreComplianceDto,
  DepartmentComplianceDto,
  ReceivingReportDto,
  SupplierSummaryDto,
  IssueMetricsReportDto,
  CategoryMetricsDto,
  PriorityMetricsDto,
} from './dto/report-response.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // DATE RANGE HELPERS
  // ============================================

  private getDateRange(query: ReportQueryDto): { start: Date; end: Date } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (query.period) {
      case ReportPeriod.TODAY:
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };

      case ReportPeriod.YESTERDAY:
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday,
          end: today,
        };

      case ReportPeriod.THIS_WEEK:
        const dayOfWeek = today.getDay();
        const monday = new Date(
          today.getTime() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 24 * 60 * 60 * 1000,
        );
        return {
          start: monday,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };

      case ReportPeriod.LAST_WEEK:
        const currentDayOfWeek = today.getDay();
        const lastMonday = new Date(
          today.getTime() -
            ((currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1) + 7) * 24 * 60 * 60 * 1000,
        );
        const lastSunday = new Date(lastMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
        return {
          start: lastMonday,
          end: lastSunday,
        };

      case ReportPeriod.THIS_MONTH:
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: firstOfMonth,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };

      case ReportPeriod.LAST_MONTH:
        const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          start: firstOfLastMonth,
          end: firstOfThisMonth,
        };

      case ReportPeriod.CUSTOM:
        if (!query.startDate || !query.endDate) {
          throw new Error('Custom period requires startDate and endDate');
        }
        return {
          start: new Date(query.startDate),
          end: new Date(query.endDate),
        };

      default:
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
    }
  }

  // ============================================
  // COMPLIANCE REPORT
  // ============================================

  async getComplianceReport(orgId: string, query: ComplianceReportQueryDto): Promise<ComplianceReportDto> {
    const tp = this.prisma.forTenant(orgId);
    const { start, end } = this.getDateRange(query);

    // Build store filter
    const storeFilter: any = { isActive: true };
    if (query.storeId) {
      storeFilter.id = query.storeId;
    }
    if (query.regionId) {
      storeFilter.regionId = query.regionId;
    }

    // Get all stores
    const stores = await tp.store.findMany({
      where: storeFilter,
      select: { id: true, name: true, code: true },
    });

    const storeIds = stores.map((s) => s.id);

    // Get task assignments in date range
    const assignments = await tp.taskAssignment.findMany({
      where: {
        storeId: { in: storeIds },
        assignedAt: { gte: start, lt: end },
      },
      include: {
        task: {
          include: { department: true },
        },
      },
    });

    // Aggregate by store
    const byStore: StoreComplianceDto[] = stores.map((store) => {
      const storeAssignments = assignments.filter((a) => a.storeId === store.id);
      const total = storeAssignments.length;
      const completed = storeAssignments.filter((a) => a.status === 'COMPLETED').length;
      const pending = storeAssignments.filter(
        (a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS',
      ).length;
      const overdue = storeAssignments.filter((a) => a.status === 'OVERDUE').length;

      // Calculate on-time completions (completed before due time)
      const completedOnTime = storeAssignments.filter((a) => {
        if (a.status !== 'COMPLETED' || !a.completedAt) return false;
        const dueTime = a.task.dueTime;
        return dueTime ? a.completedAt <= dueTime : true;
      }).length;

      return {
        storeId: store.id,
        storeName: store.name,
        storeCode: store.code,
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdue,
        complianceRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        completedOnTime,
        onTimeRate: completed > 0 ? Math.round((completedOnTime / completed) * 100) : 0,
      };
    });

    // Aggregate by department
    const departmentMap = new Map<string, { name: string; total: number; completed: number }>();
    assignments.forEach((a) => {
      if (a.task.department) {
        const deptId = a.task.department.id;
        const existing = departmentMap.get(deptId) || {
          name: a.task.department.name,
          total: 0,
          completed: 0,
        };
        existing.total++;
        if (a.status === 'COMPLETED') existing.completed++;
        departmentMap.set(deptId, existing);
      }
    });

    const byDepartment: DepartmentComplianceDto[] = Array.from(departmentMap.entries()).map(
      ([id, data]) => ({
        departmentId: id,
        departmentName: data.name,
        totalTasks: data.total,
        completedTasks: data.completed,
        complianceRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      }),
    );

    // Calculate summary
    const totalTasks = assignments.length;
    const totalCompleted = assignments.filter((a) => a.status === 'COMPLETED').length;
    const totalPending = assignments.filter(
      (a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS',
    ).length;
    const totalOverdue = assignments.filter((a) => a.status === 'OVERDUE').length;

    const report: ComplianceReportDto = {
      reportDate: new Date(),
      periodStart: start,
      periodEnd: end,
      summary: {
        totalStores: stores.length,
        totalTasks,
        totalCompleted,
        totalPending,
        totalOverdue,
        overallComplianceRate: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
      },
      byStore,
      byDepartment,
    };

    // Include task details if requested
    if (query.includeDetails) {
      report.taskDetails = assignments.map((a) => ({
        taskId: a.taskId,
        taskTitle: a.task.title,
        storeId: a.storeId,
        department: a.task.department?.name,
        status: a.status,
        assignedAt: a.assignedAt,
        completedAt: a.completedAt,
        dueTime: a.task.dueTime,
      }));
    }

    return report;
  }

  // ============================================
  // RECEIVING REPORT
  // ============================================

  async getReceivingReport(orgId: string, query: ReceivingReportQueryDto): Promise<ReceivingReportDto> {
    const tp = this.prisma.forTenant(orgId);
    const { start, end } = this.getDateRange(query);

    // Build filter
    const filter: any = {
      createdAt: { gte: start, lt: end },
    };
    if (query.storeId) {
      filter.storeId = query.storeId;
    }
    if (query.supplierName) {
      filter.supplierName = { contains: query.supplierName, mode: 'insensitive' };
    }

    // Get receivings
    const receivings = await tp.receiving.findMany({
      where: filter,
      include: {
        discrepancies: true,
        store: true,
      },
    });

    // Aggregate by supplier
    const supplierMap = new Map<
      string,
      {
        type: string;
        total: number;
        completed: number;
        withIssues: number;
        didNotArrive: number;
        discrepancies: number;
        processingTimes: number[];
      }
    >();

    receivings.forEach((r) => {
      const existing = supplierMap.get(r.supplierName) || {
        type: r.supplierType,
        total: 0,
        completed: 0,
        withIssues: 0,
        didNotArrive: 0,
        discrepancies: 0,
        processingTimes: [],
      };

      existing.total++;
      if (r.status === 'COMPLETED') existing.completed++;
      if (r.status === 'WITH_ISSUE') existing.withIssues++;
      if (r.status === 'DID_NOT_ARRIVE') existing.didNotArrive++;
      existing.discrepancies += r.discrepancies.length;

      // Calculate processing time if arrival and completion times exist
      if (r.arrivalTime && r.status === 'COMPLETED') {
        const processingMs = r.updatedAt.getTime() - r.arrivalTime.getTime();
        existing.processingTimes.push(processingMs / (1000 * 60)); // Convert to minutes
      }

      supplierMap.set(r.supplierName, existing);
    });

    const bySupplier: SupplierSummaryDto[] = Array.from(supplierMap.entries()).map(
      ([name, data]) => ({
        supplierName: name,
        supplierType: data.type,
        totalReceivings: data.total,
        completed: data.completed,
        withIssues: data.withIssues,
        didNotArrive: data.didNotArrive,
        totalDiscrepancies: data.discrepancies,
        discrepancyRate:
          data.total > 0 ? Math.round((data.withIssues / data.total) * 100 * 10) / 10 : 0,
        avgProcessingTimeMinutes:
          data.processingTimes.length > 0
            ? Math.round(
                data.processingTimes.reduce((a, b) => a + b, 0) / data.processingTimes.length,
              )
            : undefined,
      }),
    );

    // Calculate summary
    const totalReceivings = receivings.length;
    const completed = receivings.filter((r) => r.status === 'COMPLETED').length;
    const withIssues = receivings.filter((r) => r.status === 'WITH_ISSUE').length;
    const didNotArrive = receivings.filter((r) => r.status === 'DID_NOT_ARRIVE').length;
    const pending = receivings.filter(
      (r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS',
    ).length;
    const totalDiscrepancies = receivings.reduce((sum, r) => sum + r.discrepancies.length, 0);

    // Calculate average processing time
    const processingTimes = receivings
      .filter((r) => r.arrivalTime && r.status === 'COMPLETED')
      .map((r) => (r.updatedAt.getTime() - r.arrivalTime!.getTime()) / (1000 * 60));
    const avgProcessingTimeMinutes =
      processingTimes.length > 0
        ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
        : 0;

    const report: ReceivingReportDto = {
      reportDate: new Date(),
      periodStart: start,
      periodEnd: end,
      summary: {
        totalReceivings,
        completed,
        withIssues,
        didNotArrive,
        pending,
        totalDiscrepancies,
        avgProcessingTimeMinutes,
      },
      bySupplier,
    };

    // Include discrepancy details if requested
    if (query.includeDiscrepancies) {
      report.discrepancyDetails = receivings
        .filter((r) => r.discrepancies.length > 0)
        .flatMap((r) =>
          r.discrepancies.map((d) => ({
            receivingId: r.id,
            storeName: r.store.name,
            supplierName: r.supplierName,
            type: d.type,
            productInfo: d.productInfo,
            quantity: d.quantity,
            notes: d.notes,
            createdAt: d.createdAt,
          })),
        );
    }

    return report;
  }

  // ============================================
  // ISSUE METRICS REPORT
  // ============================================

  async getIssueMetricsReport(orgId: string, query: IssueReportQueryDto): Promise<IssueMetricsReportDto> {
    const tp = this.prisma.forTenant(orgId);
    const { start, end } = this.getDateRange(query);

    // Build filter
    const filter: any = {
      createdAt: { gte: start, lt: end },
    };
    if (query.storeId) {
      filter.storeId = query.storeId;
    }
    if (query.category) {
      filter.category = query.category;
    }

    // Get issues
    const issues = await tp.issue.findMany({
      where: filter,
      include: {
        reportedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        store: true,
      },
    });

    // Category labels in Spanish
    const categoryLabels: Record<string, string> = {
      MAINTENANCE: 'Mantenimiento',
      CLEANING: 'Limpieza',
      SECURITY: 'Seguridad',
      IT_SYSTEMS: 'Sistemas TI',
      PERSONNEL: 'Personal',
      INVENTORY: 'Inventario',
    };

    // Aggregate by category
    const categoryMap = new Map<
      string,
      {
        total: number;
        open: number;
        resolved: number;
        escalated: number;
        resolutionTimes: number[];
      }
    >();

    issues.forEach((issue) => {
      const existing = categoryMap.get(issue.category) || {
        total: 0,
        open: 0,
        resolved: 0,
        escalated: 0,
        resolutionTimes: [],
      };

      existing.total++;
      if (issue.status === 'RESOLVED') {
        existing.resolved++;
        if (issue.resolvedAt) {
          const resolutionMs = issue.resolvedAt.getTime() - issue.createdAt.getTime();
          existing.resolutionTimes.push(resolutionMs / (1000 * 60 * 60)); // Hours
        }
      } else {
        existing.open++;
      }
      if (issue.escalatedAt) existing.escalated++;

      categoryMap.set(issue.category, existing);
    });

    const byCategory: CategoryMetricsDto[] = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        categoryLabel: categoryLabels[category] || category,
        total: data.total,
        open: data.open,
        resolved: data.resolved,
        escalated: data.escalated,
        avgResolutionTimeHours:
          data.resolutionTimes.length > 0
            ? Math.round(
                (data.resolutionTimes.reduce((a, b) => a + b, 0) / data.resolutionTimes.length) *
                  10,
              ) / 10
            : 0,
      }),
    );

    // Aggregate by priority
    const priorityMap = new Map<string, { total: number; resolved: number; resolutionTimes: number[] }>();

    issues.forEach((issue) => {
      const existing = priorityMap.get(issue.priority) || {
        total: 0,
        resolved: 0,
        resolutionTimes: [],
      };

      existing.total++;
      if (issue.status === 'RESOLVED') {
        existing.resolved++;
        if (issue.resolvedAt) {
          const resolutionMs = issue.resolvedAt.getTime() - issue.createdAt.getTime();
          existing.resolutionTimes.push(resolutionMs / (1000 * 60 * 60));
        }
      }

      priorityMap.set(issue.priority, existing);
    });

    const byPriority: PriorityMetricsDto[] = Array.from(priorityMap.entries()).map(
      ([priority, data]) => ({
        priority,
        total: data.total,
        resolved: data.resolved,
        avgResolutionTimeHours:
          data.resolutionTimes.length > 0
            ? Math.round(
                (data.resolutionTimes.reduce((a, b) => a + b, 0) / data.resolutionTimes.length) *
                  10,
              ) / 10
            : 0,
      }),
    );

    // Calculate summary
    const totalIssues = issues.length;
    const reported = issues.filter((i) => i.status === 'REPORTED').length;
    const assigned = issues.filter((i) => i.status === 'ASSIGNED').length;
    const inProgress = issues.filter((i) => i.status === 'IN_PROGRESS').length;
    const resolved = issues.filter((i) => i.status === 'RESOLVED').length;
    const escalated = issues.filter((i) => i.escalatedAt !== null).length;

    // Average resolution time
    const resolutionTimes = issues
      .filter((i) => i.status === 'RESOLVED' && i.resolvedAt)
      .map((i) => (i.resolvedAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60));
    const avgResolutionTimeHours =
      resolutionTimes.length > 0
        ? Math.round((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) * 10) /
          10
        : 0;

    const report: IssueMetricsReportDto = {
      reportDate: new Date(),
      periodStart: start,
      periodEnd: end,
      summary: {
        totalIssues,
        reported,
        assigned,
        inProgress,
        resolved,
        escalated,
        resolutionRate: totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0,
        avgResolutionTimeHours,
      },
      byCategory,
      byPriority,
    };

    // Include top reporters and resolvers if resolution times requested
    if (query.includeResolutionTimes) {
      // Top issue reporters
      const reporterMap = new Map<string, { name: string; count: number }>();
      issues.forEach((i) => {
        const existing = reporterMap.get(i.reportedBy.id) || { name: i.reportedBy.name, count: 0 };
        existing.count++;
        reporterMap.set(i.reportedBy.id, existing);
      });
      report.topIssueReporters = Array.from(reporterMap.entries())
        .map(([id, data]) => ({ userId: id, name: data.name, issuesReported: data.count }))
        .sort((a, b) => b.issuesReported - a.issuesReported)
        .slice(0, 10);

      // Top resolvers
      const resolverMap = new Map<string, { name: string; count: number }>();
      issues
        .filter((i) => i.status === 'RESOLVED' && i.assignedTo)
        .forEach((i) => {
          const existing = resolverMap.get(i.assignedTo!.id) || {
            name: i.assignedTo!.name,
            count: 0,
          };
          existing.count++;
          resolverMap.set(i.assignedTo!.id, existing);
        });
      report.topResolvers = Array.from(resolverMap.entries())
        .map(([id, data]) => ({ userId: id, name: data.name, issuesResolved: data.count }))
        .sort((a, b) => b.issuesResolved - a.issuesResolved)
        .slice(0, 10);
    }

    return report;
  }
}
