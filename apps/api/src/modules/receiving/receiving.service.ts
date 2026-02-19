import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { ReceivingStatus, SupplierType, DiscrepancyType } from '@prisma/client';
import {
  CreateReceivingDto,
  UpdateReceivingDto,
  CompleteReceivingDto,
  CreateDiscrepancyDto,
  ReceivingQueryDto,
  ReceivingResponseDto,
  ReceivingListResponseDto,
  ReceivingDashboardDto,
  SupplierMetricsDto,
} from './dto';

@Injectable()
export class ReceivingService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private auditService: AuditService,
  ) {}

  async create(orgId: string, dto: CreateReceivingDto, userId: string, userRole: string): Promise<ReceivingResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    // Verify store exists
    const store = await tp.store.findUnique({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new NotFoundException('Tienda no encontrada');
    }

    const receiving = await tp.receiving.create({
      data: {
        storeId: dto.storeId,
        supplierType: dto.supplierType,
        supplierName: dto.supplierName,
        poNumber: dto.poNumber,
        scheduledTime: dto.scheduledTime ? new Date(dto.scheduledTime) : null,
        driverName: dto.driverName,
        truckPlate: dto.truckPlate,
        itemCount: dto.itemCount,
        notes: dto.notes,
        status: ReceivingStatus.PENDING,
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        verifiedBy: {
          select: { id: true, name: true },
        },
        discrepancies: true,
      },
    });

    const response = this.mapToResponse(receiving);

    // Emit WebSocket event
    this.eventsGateway.emitReceivingCreated(response);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'RECEIVING',
      entityId: receiving.id,
      action: 'CREATED',
      performedById: userId,
      performedByRole: userRole,
      newValue: { supplierName: dto.supplierName, storeId: dto.storeId, status: 'PENDING' },
    });

    return response;
  }

  async findAll(
    orgId: string,
    query: ReceivingQueryDto,
    user: { id: string; role: string; storeId?: string },
  ): Promise<ReceivingListResponseDto> {
    const tp = this.prisma.forTenant(orgId);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on user role and filters
    const where: any = {};

    // Role-based filtering
    if (user.role === 'STORE_MANAGER' || user.role === 'DEPT_SUPERVISOR') {
      if (!user.storeId) {
        throw new ForbiddenException('Usuario no asignado a ninguna tienda');
      }
      where.storeId = user.storeId;
    } else if (query.storeId) {
      where.storeId = query.storeId;
    }

    // Region filter (for regional supervisors or HQ filtering by region)
    if (query.regionId) {
      where.store = { regionId: query.regionId };
    }

    // Status filter
    if (query.status) {
      where.status = query.status;
    }

    // Supplier type filter
    if (query.supplierType) {
      where.supplierType = query.supplierType;
    }

    // Date filters
    if (query.date) {
      const dateStart = new Date(query.date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(query.date);
      dateEnd.setHours(23, 59, 59, 999);

      where.OR = [
        { scheduledTime: { gte: dateStart, lte: dateEnd } },
        { arrivalTime: { gte: dateStart, lte: dateEnd } },
        { createdAt: { gte: dateStart, lte: dateEnd } },
      ];
    } else if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const [receivings, total] = await Promise.all([
      tp.receiving.findMany({
        where,
        include: {
          store: {
            select: { id: true, name: true, code: true },
          },
          verifiedBy: {
            select: { id: true, name: true },
          },
          discrepancies: true,
        },
        orderBy: [
          { scheduledTime: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      tp.receiving.count({ where }),
    ]);

    return {
      data: receivings.map((r) => this.mapToResponse(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(orgId: string, id: string): Promise<ReceivingResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const receiving = await tp.receiving.findUnique({
      where: { id },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        verifiedBy: {
          select: { id: true, name: true },
        },
        discrepancies: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!receiving) {
      throw new NotFoundException('Recepción no encontrada');
    }

    return this.mapToResponse(receiving);
  }

  async update(orgId: string, id: string, dto: UpdateReceivingDto, userId: string, userRole: string): Promise<ReceivingResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.receiving.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Recepción no encontrada');
    }

    // Validate status transitions
    if (dto.status) {
      this.validateStatusTransition(existing.status, dto.status);
    }

    const receiving = await tp.receiving.update({
      where: { id },
      data: {
        status: dto.status,
        arrivalTime: dto.arrivalTime ? new Date(dto.arrivalTime) : undefined,
        driverName: dto.driverName,
        truckPlate: dto.truckPlate,
        itemCount: dto.itemCount,
        notes: dto.notes,
        photoUrls: dto.photoUrls,
        signatureUrl: dto.signatureUrl,
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        verifiedBy: {
          select: { id: true, name: true },
        },
        discrepancies: true,
      },
    });

    const response = this.mapToResponse(receiving);

    // Emit WebSocket event
    this.eventsGateway.emitReceivingUpdated(response);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'RECEIVING',
      entityId: id,
      action: 'UPDATED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { status: existing.status },
      newValue: dto,
    });

    return response;
  }

  async startReceiving(orgId: string, id: string, userId: string, userRole: string): Promise<ReceivingResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.receiving.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Recepción no encontrada');
    }

    if (existing.status !== ReceivingStatus.PENDING) {
      throw new BadRequestException('Solo se pueden iniciar recepciones pendientes');
    }

    const receiving = await tp.receiving.update({
      where: { id },
      data: {
        status: ReceivingStatus.IN_PROGRESS,
        arrivalTime: new Date(),
        verifiedById: userId,
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        verifiedBy: {
          select: { id: true, name: true },
        },
        discrepancies: true,
      },
    });

    const response = this.mapToResponse(receiving);

    // Emit WebSocket event
    this.eventsGateway.emitReceivingUpdated(response);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'RECEIVING',
      entityId: id,
      action: 'STATUS_CHANGED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { status: 'PENDING' },
      newValue: { status: 'IN_PROGRESS' },
      fieldChanged: 'status',
    });

    return response;
  }

  async complete(
    orgId: string,
    id: string,
    dto: CompleteReceivingDto,
    userId: string,
    userRole: string,
  ): Promise<ReceivingResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.receiving.findUnique({
      where: { id },
      include: { discrepancies: true },
    });

    if (!existing) {
      throw new NotFoundException('Recepción no encontrada');
    }

    if (existing.status === ReceivingStatus.COMPLETED) {
      throw new BadRequestException('Esta recepción ya está completada');
    }

    // Determine final status based on discrepancies
    const hasDiscrepancies = existing.discrepancies.length > 0;
    const finalStatus = hasDiscrepancies
      ? ReceivingStatus.WITH_ISSUE
      : ReceivingStatus.COMPLETED;

    const receiving = await tp.receiving.update({
      where: { id },
      data: {
        status: finalStatus,
        itemCount: dto.itemCount ?? existing.itemCount,
        notes: dto.notes ?? existing.notes,
        photoUrls: dto.photoUrls ?? existing.photoUrls,
        signatureUrl: dto.signatureUrl,
        verifiedById: userId,
        arrivalTime: existing.arrivalTime ?? new Date(),
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        verifiedBy: {
          select: { id: true, name: true },
        },
        discrepancies: true,
      },
    });

    const response = this.mapToResponse(receiving);

    // Emit WebSocket event
    this.eventsGateway.emitReceivingCompleted(response);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'RECEIVING',
      entityId: id,
      action: 'COMPLETED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { status: existing.status },
      newValue: { status: finalStatus },
      fieldChanged: 'status',
    });

    return response;
  }

  async markDidNotArrive(orgId: string, id: string, notes: string, userId: string, userRole: string): Promise<ReceivingResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.receiving.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Recepción no encontrada');
    }

    if (existing.status !== ReceivingStatus.PENDING) {
      throw new BadRequestException('Solo se pueden marcar recepciones pendientes como no llegadas');
    }

    const receiving = await tp.receiving.update({
      where: { id },
      data: {
        status: ReceivingStatus.DID_NOT_ARRIVE,
        notes: notes || existing.notes,
      },
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        verifiedBy: {
          select: { id: true, name: true },
        },
        discrepancies: true,
      },
    });

    const response = this.mapToResponse(receiving);

    // Emit WebSocket event
    this.eventsGateway.emitReceivingUpdated(response);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'RECEIVING',
      entityId: id,
      action: 'STATUS_CHANGED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { status: 'PENDING' },
      newValue: { status: 'DID_NOT_ARRIVE' },
      fieldChanged: 'status',
      notes: notes || undefined,
    });

    return response;
  }

  async addDiscrepancy(
    orgId: string,
    receivingId: string,
    dto: CreateDiscrepancyDto,
    userId: string,
    userRole: string,
  ): Promise<ReceivingResponseDto> {
    const tp = this.prisma.forTenant(orgId);

    const receiving = await tp.receiving.findUnique({
      where: { id: receivingId },
    });

    if (!receiving) {
      throw new NotFoundException('Recepción no encontrada');
    }

    if (receiving.status === ReceivingStatus.COMPLETED) {
      throw new BadRequestException('No se pueden agregar discrepancias a una recepción completada');
    }

    // Create discrepancy and update receiving status if needed
    const discrepancy = await this.prisma.$transaction(async (tx) => {
      const newDiscrepancy = await tx.discrepancy.create({
        data: {
          receivingId,
          type: dto.type,
          productInfo: dto.productInfo,
          quantity: dto.quantity,
          notes: dto.notes,
          photoUrls: dto.photoUrls || [],
        },
      });

      // If receiving is in progress, mark it as having issues
      if (receiving.status === ReceivingStatus.IN_PROGRESS) {
        await tx.receiving.update({
          where: { id: receivingId },
          data: { status: ReceivingStatus.WITH_ISSUE },
        });
      }

      return newDiscrepancy;
    });

    const response = await this.findOne(orgId, receivingId);

    // Emit WebSocket events
    this.eventsGateway.emitDiscrepancyReported(discrepancy, response.storeId);
    this.eventsGateway.emitReceivingUpdated(response);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'RECEIVING',
      entityId: receivingId,
      action: 'UPDATED',
      performedById: userId,
      performedByRole: userRole,
      newValue: { discrepancyType: dto.type, productInfo: dto.productInfo },
      notes: 'Discrepancy added',
    });

    return response;
  }

  async removeDiscrepancy(orgId: string, discrepancyId: string, userId: string, userRole: string): Promise<void> {
    const tp = this.prisma.forTenant(orgId);

    const discrepancy = await tp.discrepancy.findUnique({
      where: { id: discrepancyId },
      include: { receiving: true },
    });

    if (!discrepancy) {
      throw new NotFoundException('Discrepancia no encontrada');
    }

    if (
      discrepancy.receiving.status === ReceivingStatus.COMPLETED ||
      discrepancy.receiving.status === ReceivingStatus.WITH_ISSUE
    ) {
      throw new BadRequestException('No se pueden eliminar discrepancias de recepciones finalizadas');
    }

    await tp.discrepancy.delete({
      where: { id: discrepancyId },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'RECEIVING',
      entityId: discrepancy.receivingId,
      action: 'UPDATED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { discrepancyId, type: discrepancy.type, productInfo: discrepancy.productInfo },
      notes: 'Discrepancy removed',
    });
  }

  async getStoreReceivings(
    orgId: string,
    storeId: string,
    date?: string,
  ): Promise<ReceivingResponseDto[]> {
    const tp = this.prisma.forTenant(orgId);
    const where: any = { storeId };

    if (date) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      where.OR = [
        { scheduledTime: { gte: dateStart, lte: dateEnd } },
        { arrivalTime: { gte: dateStart, lte: dateEnd } },
        { createdAt: { gte: dateStart, lte: dateEnd } },
      ];
    }

    const receivings = await tp.receiving.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true, code: true },
        },
        verifiedBy: {
          select: { id: true, name: true },
        },
        discrepancies: true,
      },
      orderBy: [
        { scheduledTime: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return receivings.map((r) => this.mapToResponse(r));
  }

  async getDashboard(
    orgId: string,
    storeId?: string,
    regionId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ReceivingDashboardDto> {
    const tp = this.prisma.forTenant(orgId);
    const where: any = {};

    if (storeId) {
      where.storeId = storeId;
    }

    if (regionId) {
      where.store = { regionId };
    }

    // Default to today if no date range specified
    if (!startDate && !endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      where.OR = [
        { scheduledTime: { gte: today, lt: tomorrow } },
        { arrivalTime: { gte: today, lt: tomorrow } },
        { createdAt: { gte: today, lt: tomorrow } },
      ];
    } else {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Get stats
    const [
      total,
      pending,
      inProgress,
      completed,
      withIssue,
      didNotArrive,
      discrepancyCount,
    ] = await Promise.all([
      tp.receiving.count({ where }),
      tp.receiving.count({ where: { ...where, status: ReceivingStatus.PENDING } }),
      tp.receiving.count({ where: { ...where, status: ReceivingStatus.IN_PROGRESS } }),
      tp.receiving.count({ where: { ...where, status: ReceivingStatus.COMPLETED } }),
      tp.receiving.count({ where: { ...where, status: ReceivingStatus.WITH_ISSUE } }),
      tp.receiving.count({ where: { ...where, status: ReceivingStatus.DID_NOT_ARRIVE } }),
      tp.discrepancy.count({
        where: { receiving: where },
      }),
    ]);

    // Get supplier metrics
    const supplierMetrics = await this.getSupplierMetrics(orgId, where);

    // Get recent and pending receivings
    const [recentReceivings, pendingReceivings] = await Promise.all([
      tp.receiving.findMany({
        where: {
          ...where,
          status: { in: [ReceivingStatus.COMPLETED, ReceivingStatus.WITH_ISSUE] },
        },
        include: {
          store: { select: { id: true, name: true, code: true } },
          verifiedBy: { select: { id: true, name: true } },
          discrepancies: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      tp.receiving.findMany({
        where: { ...where, status: ReceivingStatus.PENDING },
        include: {
          store: { select: { id: true, name: true, code: true } },
          verifiedBy: { select: { id: true, name: true } },
          discrepancies: true,
        },
        orderBy: { scheduledTime: 'asc' },
        take: 10,
      }),
    ]);

    return {
      stats: {
        total,
        pending,
        inProgress,
        completed,
        withIssue,
        didNotArrive,
        totalDiscrepancies: discrepancyCount,
      },
      supplierMetrics,
      recentReceivings: recentReceivings.map((r) => this.mapToResponse(r)),
      pendingReceivings: pendingReceivings.map((r) => this.mapToResponse(r)),
    };
  }

  private async getSupplierMetrics(orgId: string, baseWhere: any): Promise<SupplierMetricsDto[]> {
    const tp = this.prisma.forTenant(orgId);

    // Get all receivings grouped by supplier
    const receivings = await tp.receiving.findMany({
      where: baseWhere,
      include: {
        discrepancies: true,
      },
    });

    // Group by supplier
    const supplierMap = new Map<string, {
      supplierType: SupplierType;
      total: number;
      completed: number;
      onTime: number;
      withDiscrepancies: number;
      discrepancies: { type: DiscrepancyType }[];
    }>();

    for (const receiving of receivings) {
      const key = receiving.supplierName;
      const existing = supplierMap.get(key) || {
        supplierType: receiving.supplierType,
        total: 0,
        completed: 0,
        onTime: 0,
        withDiscrepancies: 0,
        discrepancies: [],
      };

      existing.total++;

      if (
        receiving.status === ReceivingStatus.COMPLETED ||
        receiving.status === ReceivingStatus.WITH_ISSUE
      ) {
        existing.completed++;

        // Check if on time (arrived within 30 min of scheduled)
        if (receiving.scheduledTime && receiving.arrivalTime) {
          const diff = Math.abs(
            receiving.arrivalTime.getTime() - receiving.scheduledTime.getTime(),
          );
          if (diff <= 30 * 60 * 1000) {
            existing.onTime++;
          }
        } else if (!receiving.scheduledTime && receiving.arrivalTime) {
          // If no scheduled time, count as on time
          existing.onTime++;
        }
      }

      if (receiving.discrepancies.length > 0) {
        existing.withDiscrepancies++;
        existing.discrepancies.push(...receiving.discrepancies);
      }

      supplierMap.set(key, existing);
    }

    // Convert to response format
    const metrics: SupplierMetricsDto[] = [];
    for (const [supplierName, data] of supplierMap.entries()) {
      const discrepanciesByType = {
        MISSING: 0,
        DAMAGED: 0,
        WRONG_PRODUCT: 0,
      };

      for (const d of data.discrepancies) {
        discrepanciesByType[d.type]++;
      }

      metrics.push({
        supplierName,
        supplierType: data.supplierType,
        totalReceivings: data.total,
        completedOnTime: data.onTime,
        withDiscrepancies: data.withDiscrepancies,
        onTimeRate: data.completed > 0 ? (data.onTime / data.completed) * 100 : 0,
        discrepancyRate: data.total > 0 ? (data.withDiscrepancies / data.total) * 100 : 0,
        totalDiscrepancies: data.discrepancies.length,
        discrepanciesByType,
      });
    }

    // Sort by total receivings descending
    return metrics.sort((a, b) => b.totalReceivings - a.totalReceivings);
  }

  private validateStatusTransition(
    current: ReceivingStatus,
    next: ReceivingStatus,
  ): void {
    const validTransitions: Record<ReceivingStatus, ReceivingStatus[]> = {
      [ReceivingStatus.PENDING]: [
        ReceivingStatus.IN_PROGRESS,
        ReceivingStatus.DID_NOT_ARRIVE,
      ],
      [ReceivingStatus.IN_PROGRESS]: [
        ReceivingStatus.COMPLETED,
        ReceivingStatus.WITH_ISSUE,
      ],
      [ReceivingStatus.COMPLETED]: [],
      [ReceivingStatus.WITH_ISSUE]: [],
      [ReceivingStatus.DID_NOT_ARRIVE]: [],
    };

    if (!validTransitions[current].includes(next)) {
      throw new BadRequestException(
        `Transición de estado inválida: ${current} → ${next}`,
      );
    }
  }

  private mapToResponse(receiving: any): ReceivingResponseDto {
    return {
      id: receiving.id,
      storeId: receiving.storeId,
      store: receiving.store,
      supplierType: receiving.supplierType,
      supplierName: receiving.supplierName,
      poNumber: receiving.poNumber,
      scheduledTime: receiving.scheduledTime,
      arrivalTime: receiving.arrivalTime,
      status: receiving.status,
      verifiedBy: receiving.verifiedBy,
      notes: receiving.notes,
      photoUrls: receiving.photoUrls || [],
      signatureUrl: receiving.signatureUrl,
      driverName: receiving.driverName,
      truckPlate: receiving.truckPlate,
      itemCount: receiving.itemCount,
      discrepancies: receiving.discrepancies || [],
      discrepancyCount: receiving.discrepancies?.length || 0,
      createdAt: receiving.createdAt,
      updatedAt: receiving.updatedAt,
    };
  }
}
