import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  ComplianceReportDto,
  ReceivingReportDto,
  IssueMetricsReportDto,
} from './dto';

@Injectable()
export class ExcelService {
  private readonly headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Plexo brand color (indigo)
    },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  private readonly cellStyle: Partial<ExcelJS.Style> = {
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
    alignment: { vertical: 'middle' },
  };

  /**
   * Generate compliance report Excel file
   */
  async generateComplianceReport(report: ComplianceReportDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = process.env.APP_NAME || 'Plexo';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Resumen');
    this.addComplianceSummary(summarySheet, report);

    // By Store sheet
    const storeSheet = workbook.addWorksheet('Por Tienda');
    this.addStoreCompliance(storeSheet, report);

    // By Department sheet
    const deptSheet = workbook.addWorksheet('Por Departamento');
    this.addDepartmentCompliance(deptSheet, report);

    // Task details sheet if included
    if (report.taskDetails && report.taskDetails.length > 0) {
      const detailsSheet = workbook.addWorksheet('Detalle de Tareas');
      this.addTaskDetails(detailsSheet, report.taskDetails);
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private addComplianceSummary(sheet: ExcelJS.Worksheet, report: ComplianceReportDto) {
    // Title
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Reporte de Cumplimiento - Plexo Operations';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // Period info
    sheet.getCell('A3').value = 'Período:';
    sheet.getCell('B3').value = `${this.formatDate(report.periodStart)} - ${this.formatDate(report.periodEnd)}`;
    sheet.getCell('A4').value = 'Generado:';
    sheet.getCell('B4').value = this.formatDate(report.reportDate);

    // Summary data
    const summaryData = [
      ['Métrica', 'Valor'],
      ['Total de Tiendas', report.summary.totalStores],
      ['Total de Tareas', report.summary.totalTasks],
      ['Tareas Completadas', report.summary.totalCompleted],
      ['Tareas Pendientes', report.summary.totalPending],
      ['Tareas Vencidas', report.summary.totalOverdue],
      ['Tasa de Cumplimiento', `${report.summary.overallComplianceRate.toFixed(1)}%`],
    ];

    let rowNum = 6;
    summaryData.forEach((row, index) => {
      const excelRow = sheet.getRow(rowNum + index);
      excelRow.values = ['', ...row];
      if (index === 0) {
        excelRow.eachCell((cell, colNumber) => {
          if (colNumber > 1) cell.style = this.headerStyle;
        });
      } else {
        excelRow.eachCell((cell, colNumber) => {
          if (colNumber > 1) cell.style = this.cellStyle;
        });
      }
    });

    // Adjust column widths
    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 20;
  }

  private addStoreCompliance(sheet: ExcelJS.Worksheet, report: ComplianceReportDto) {
    const headers = [
      'Código',
      'Tienda',
      'Total Tareas',
      'Completadas',
      'Pendientes',
      'Vencidas',
      'Tasa Cumplimiento',
    ];

    // Add headers
    const headerRow = sheet.getRow(1);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.style = this.headerStyle;
    });

    // Add data
    report.byStore.forEach((store, index) => {
      const row = sheet.getRow(index + 2);
      row.values = [
        store.storeCode,
        store.storeName,
        store.totalTasks,
        store.completedTasks,
        store.pendingTasks,
        store.overdueTasks,
        `${store.complianceRate.toFixed(1)}%`,
      ];
      row.eachCell((cell) => {
        cell.style = this.cellStyle;
      });

      // Highlight low compliance
      if (store.complianceRate < 80) {
        row.getCell(7).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCDD2' }, // Light red
        };
      }
    });

    // Auto-fit columns
    sheet.columns.forEach((column) => {
      column.width = 18;
    });
  }

  private addDepartmentCompliance(sheet: ExcelJS.Worksheet, report: ComplianceReportDto) {
    const headers = ['Departamento', 'Total Tareas', 'Completadas', 'Tasa Cumplimiento'];

    const headerRow = sheet.getRow(1);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.style = this.headerStyle;
    });

    report.byDepartment.forEach((dept, index) => {
      const row = sheet.getRow(index + 2);
      row.values = [
        dept.departmentName,
        dept.totalTasks,
        dept.completedTasks,
        `${dept.complianceRate.toFixed(1)}%`,
      ];
      row.eachCell((cell) => {
        cell.style = this.cellStyle;
      });
    });

    sheet.columns.forEach((column) => {
      column.width = 20;
    });
  }

  private addTaskDetails(sheet: ExcelJS.Worksheet, tasks: any[]) {
    const headers = [
      'Tienda',
      'Tarea',
      'Departamento',
      'Prioridad',
      'Estado',
      'Hora Programada',
      'Hora Completada',
      'Completado Por',
    ];

    const headerRow = sheet.getRow(1);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.style = this.headerStyle;
    });

    tasks.forEach((task, index) => {
      const row = sheet.getRow(index + 2);
      row.values = [
        task.storeName || task.storeCode,
        task.title,
        task.departmentName || 'N/A',
        this.translatePriority(task.priority),
        this.translateTaskStatus(task.status),
        task.scheduledTime ? this.formatDateTime(task.scheduledTime) : 'N/A',
        task.completedAt ? this.formatDateTime(task.completedAt) : 'N/A',
        task.completedByName || 'N/A',
      ];
      row.eachCell((cell) => {
        cell.style = this.cellStyle;
      });
    });

    sheet.columns.forEach((column) => {
      column.width = 18;
    });
  }

  /**
   * Generate receiving report Excel file
   */
  async generateReceivingReport(report: ReceivingReportDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = process.env.APP_NAME || 'Plexo';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Resumen');
    this.addReceivingSummary(summarySheet, report);

    // By Supplier sheet
    const supplierSheet = workbook.addWorksheet('Por Proveedor');
    this.addSupplierSummary(supplierSheet, report);

    // Discrepancy details if included
    if (report.discrepancyDetails && report.discrepancyDetails.length > 0) {
      const discSheet = workbook.addWorksheet('Discrepancias');
      this.addDiscrepancyDetails(discSheet, report.discrepancyDetails);
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private addReceivingSummary(sheet: ExcelJS.Worksheet, report: ReceivingReportDto) {
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Reporte de Recepciones - Plexo Operations';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.getCell('A3').value = 'Período:';
    sheet.getCell('B3').value = `${this.formatDate(report.periodStart)} - ${this.formatDate(report.periodEnd)}`;

    const summaryData = [
      ['Métrica', 'Valor'],
      ['Total Recepciones', report.summary.totalReceivings],
      ['Completadas', report.summary.completed],
      ['Con Incidencias', report.summary.withIssues],
      ['No Llegaron', report.summary.didNotArrive],
      ['Pendientes', report.summary.pending],
      ['Total Discrepancias', report.summary.totalDiscrepancies],
      ['Tiempo Promedio (min)', report.summary.avgProcessingTimeMinutes.toFixed(0)],
    ];

    let rowNum = 5;
    summaryData.forEach((row, index) => {
      const excelRow = sheet.getRow(rowNum + index);
      excelRow.values = ['', ...row];
      if (index === 0) {
        excelRow.eachCell((cell, colNumber) => {
          if (colNumber > 1) cell.style = this.headerStyle;
        });
      } else {
        excelRow.eachCell((cell, colNumber) => {
          if (colNumber > 1) cell.style = this.cellStyle;
        });
      }
    });

    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 20;
  }

  private addSupplierSummary(sheet: ExcelJS.Worksheet, report: ReceivingReportDto) {
    const headers = [
      'Proveedor',
      'Tipo',
      'Total',
      'Completadas',
      'Con Incidencias',
      'No Llegaron',
      'Discrepancias',
      'Tasa Discrepancias',
    ];

    const headerRow = sheet.getRow(1);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.style = this.headerStyle;
    });

    report.bySupplier.forEach((supplier, index) => {
      const row = sheet.getRow(index + 2);
      row.values = [
        supplier.supplierName,
        this.translateSupplierType(supplier.supplierType),
        supplier.totalReceivings,
        supplier.completed,
        supplier.withIssues,
        supplier.didNotArrive,
        supplier.totalDiscrepancies,
        `${supplier.discrepancyRate.toFixed(1)}%`,
      ];
      row.eachCell((cell) => {
        cell.style = this.cellStyle;
      });

      // Highlight high discrepancy rate
      if (supplier.discrepancyRate > 10) {
        row.getCell(8).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCDD2' },
        };
      }
    });

    sheet.columns.forEach((column) => {
      column.width = 18;
    });
  }

  private addDiscrepancyDetails(sheet: ExcelJS.Worksheet, discrepancies: any[]) {
    const headers = [
      'Fecha',
      'Proveedor',
      'Tienda',
      'Tipo',
      'Producto',
      'Cantidad',
      'Notas',
    ];

    const headerRow = sheet.getRow(1);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.style = this.headerStyle;
    });

    discrepancies.forEach((disc, index) => {
      const row = sheet.getRow(index + 2);
      row.values = [
        this.formatDate(disc.createdAt),
        disc.supplierName,
        disc.storeName,
        this.translateDiscrepancyType(disc.type),
        disc.productInfo,
        disc.quantity || 'N/A',
        disc.notes || '',
      ];
      row.eachCell((cell) => {
        cell.style = this.cellStyle;
      });
    });

    sheet.columns.forEach((column) => {
      column.width = 18;
    });
  }

  /**
   * Generate issue metrics report Excel file
   */
  async generateIssueMetricsReport(report: IssueMetricsReportDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = process.env.APP_NAME || 'Plexo';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Resumen');
    this.addIssuesSummary(summarySheet, report);

    // By Category sheet
    const categorySheet = workbook.addWorksheet('Por Categoría');
    this.addCategoryMetrics(categorySheet, report);

    // By Priority sheet
    const prioritySheet = workbook.addWorksheet('Por Prioridad');
    this.addPriorityMetrics(prioritySheet, report);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private addIssuesSummary(sheet: ExcelJS.Worksheet, report: IssueMetricsReportDto) {
    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Reporte de Incidencias - Plexo Operations';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.getCell('A3').value = 'Período:';
    sheet.getCell('B3').value = `${this.formatDate(report.periodStart)} - ${this.formatDate(report.periodEnd)}`;

    const summaryData = [
      ['Métrica', 'Valor'],
      ['Total Incidencias', report.summary.totalIssues],
      ['Reportadas', report.summary.reported],
      ['Asignadas', report.summary.assigned],
      ['En Proceso', report.summary.inProgress],
      ['Resueltas', report.summary.resolved],
      ['Escaladas', report.summary.escalated],
      ['Tasa de Resolución', `${report.summary.resolutionRate.toFixed(1)}%`],
      ['Tiempo Promedio (hrs)', report.summary.avgResolutionTimeHours.toFixed(1)],
    ];

    let rowNum = 5;
    summaryData.forEach((row, index) => {
      const excelRow = sheet.getRow(rowNum + index);
      excelRow.values = ['', ...row];
      if (index === 0) {
        excelRow.eachCell((cell, colNumber) => {
          if (colNumber > 1) cell.style = this.headerStyle;
        });
      } else {
        excelRow.eachCell((cell, colNumber) => {
          if (colNumber > 1) cell.style = this.cellStyle;
        });
      }
    });

    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 20;
  }

  private addCategoryMetrics(sheet: ExcelJS.Worksheet, report: IssueMetricsReportDto) {
    const headers = [
      'Categoría',
      'Total',
      'Abiertas',
      'Resueltas',
      'Escaladas',
      'Tiempo Prom. (hrs)',
    ];

    const headerRow = sheet.getRow(1);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.style = this.headerStyle;
    });

    report.byCategory.forEach((cat, index) => {
      const row = sheet.getRow(index + 2);
      row.values = [
        cat.categoryLabel,
        cat.total,
        cat.open,
        cat.resolved,
        cat.escalated,
        cat.avgResolutionTimeHours.toFixed(1),
      ];
      row.eachCell((cell) => {
        cell.style = this.cellStyle;
      });
    });

    sheet.columns.forEach((column) => {
      column.width = 18;
    });
  }

  private addPriorityMetrics(sheet: ExcelJS.Worksheet, report: IssueMetricsReportDto) {
    const headers = ['Prioridad', 'Total', 'Resueltas', 'Tiempo Prom. (hrs)'];

    const headerRow = sheet.getRow(1);
    headerRow.values = headers;
    headerRow.eachCell((cell) => {
      cell.style = this.headerStyle;
    });

    report.byPriority.forEach((priority, index) => {
      const row = sheet.getRow(index + 2);
      row.values = [
        this.translatePriority(priority.priority),
        priority.total,
        priority.resolved,
        priority.avgResolutionTimeHours.toFixed(1),
      ];
      row.eachCell((cell) => {
        cell.style = this.cellStyle;
      });
    });

    sheet.columns.forEach((column) => {
      column.width = 18;
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private translatePriority(priority: string): string {
    const map: Record<string, string> = {
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
    };
    return map[priority] || priority;
  }

  private translateTaskStatus(status: string): string {
    const map: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Proceso',
      COMPLETED: 'Completada',
      OVERDUE: 'Vencida',
    };
    return map[status] || status;
  }

  private translateSupplierType(type: string): string {
    const map: Record<string, string> = {
      DISTRIBUTION_CENTER: 'Centro Distribución',
      THIRD_PARTY: 'Proveedor Externo',
    };
    return map[type] || type;
  }

  private translateDiscrepancyType(type: string): string {
    const map: Record<string, string> = {
      MISSING: 'Faltante',
      DAMAGED: 'Dañado',
      WRONG_PRODUCT: 'Producto Incorrecto',
    };
    return map[type] || type;
  }
}
