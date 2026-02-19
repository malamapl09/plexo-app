import { Controller, Get, Query, Res, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiProduces } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { ExcelService } from './excel.service';
import {
  ComplianceReportQueryDto,
  ReceivingReportQueryDto,
  IssueReportQueryDto,
  ReportFormat,
} from './dto/report-query.dto';
import {
  ComplianceReportDto,
  ReceivingReportDto,
  IssueMetricsReportDto,
} from './dto/report-response.dto';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly excelService: ExcelService,
  ) {}

  // ============================================
  // COMPLIANCE REPORT
  // ============================================

  @Get('compliance')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Obtener reporte de cumplimiento de tareas' })
  @ApiProduces('application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async getComplianceReport(
    @Query() query: ComplianceReportQueryDto,
    @Res({ passthrough: true }) res: Response,
    @Request() req: any,
  ): Promise<ComplianceReportDto | void> {
    const report = await this.reportsService.getComplianceReport(req.user.organizationId, query);

    if (query.format === ReportFormat.EXCEL) {
      const buffer = await this.excelService.generateComplianceReport(report);

      const filename = `reporte_cumplimiento_${this.formatDateForFilename(report.periodStart)}_${this.formatDateForFilename(report.periodEnd)}.xlsx`;

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(buffer);
      return;
    }

    return report;
  }

  // ============================================
  // RECEIVING REPORT
  // ============================================

  @Get('receiving')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Obtener reporte de recepciones' })
  @ApiProduces('application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async getReceivingReport(
    @Query() query: ReceivingReportQueryDto,
    @Res({ passthrough: true }) res: Response,
    @Request() req: any,
  ): Promise<ReceivingReportDto | void> {
    const report = await this.reportsService.getReceivingReport(req.user.organizationId, query);

    if (query.format === ReportFormat.EXCEL) {
      const buffer = await this.excelService.generateReceivingReport(report);

      const filename = `reporte_recepciones_${this.formatDateForFilename(report.periodStart)}_${this.formatDateForFilename(report.periodEnd)}.xlsx`;

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(buffer);
      return;
    }

    return report;
  }

  // ============================================
  // ISSUE METRICS REPORT
  // ============================================

  @Get('issues')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Obtener reporte de métricas de incidencias' })
  @ApiProduces('application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async getIssueMetricsReport(
    @Query() query: IssueReportQueryDto,
    @Res({ passthrough: true }) res: Response,
    @Request() req: any,
  ): Promise<IssueMetricsReportDto | void> {
    const report = await this.reportsService.getIssueMetricsReport(req.user.organizationId, query);

    if (query.format === ReportFormat.EXCEL) {
      const buffer = await this.excelService.generateIssueMetricsReport(report);

      const filename = `reporte_incidencias_${this.formatDateForFilename(report.periodStart)}_${this.formatDateForFilename(report.periodEnd)}.xlsx`;

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });

      res.send(buffer);
      return;
    }

    return report;
  }

  // ============================================
  // DASHBOARD SUMMARY
  // ============================================

  @Get('dashboard')
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Obtener resumen para dashboard' })
  async getDashboardSummary(
    @Query() query: ComplianceReportQueryDto,
    @Request() req: any,
  ) {
    const orgId = req.user.organizationId;
    const [compliance, receiving, issues] = await Promise.all([
      this.reportsService.getComplianceReport(orgId, query),
      this.reportsService.getReceivingReport(orgId, query),
      this.reportsService.getIssueMetricsReport(orgId, query),
    ]);

    return {
      reportDate: new Date(),
      periodStart: compliance.periodStart,
      periodEnd: compliance.periodEnd,
      tasks: {
        total: compliance.summary.totalTasks,
        completed: compliance.summary.totalCompleted,
        pending: compliance.summary.totalPending,
        overdue: compliance.summary.totalOverdue,
        complianceRate: compliance.summary.overallComplianceRate,
      },
      receiving: {
        total: receiving.summary.totalReceivings,
        completed: receiving.summary.completed,
        withIssues: receiving.summary.withIssues,
        pending: receiving.summary.pending,
        discrepancies: receiving.summary.totalDiscrepancies,
      },
      issues: {
        total: issues.summary.totalIssues,
        open: issues.summary.reported + issues.summary.assigned + issues.summary.inProgress,
        resolved: issues.summary.resolved,
        escalated: issues.summary.escalated,
        resolutionRate: issues.summary.resolutionRate,
      },
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
