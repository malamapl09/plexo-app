import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReceivingStatus, SupplierType, DiscrepancyType } from '@prisma/client';

export class DiscrepancyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: DiscrepancyType })
  type: DiscrepancyType;

  @ApiProperty()
  productInfo: string;

  @ApiPropertyOptional()
  quantity?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: [String] })
  photoUrls: string[];

  @ApiProperty()
  createdAt: Date;
}

export class ReceivingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  store: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty({ enum: SupplierType })
  supplierType: SupplierType;

  @ApiProperty()
  supplierName: string;

  @ApiPropertyOptional()
  poNumber?: string;

  @ApiPropertyOptional()
  scheduledTime?: Date;

  @ApiPropertyOptional()
  arrivalTime?: Date;

  @ApiProperty({ enum: ReceivingStatus })
  status: ReceivingStatus;

  @ApiPropertyOptional()
  verifiedBy?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: [String] })
  photoUrls: string[];

  @ApiPropertyOptional()
  signatureUrl?: string;

  @ApiPropertyOptional()
  driverName?: string;

  @ApiPropertyOptional()
  truckPlate?: string;

  @ApiPropertyOptional()
  itemCount?: number;

  @ApiProperty({ type: [DiscrepancyResponseDto] })
  discrepancies: DiscrepancyResponseDto[];

  @ApiProperty()
  discrepancyCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ReceivingListResponseDto {
  @ApiProperty({ type: [ReceivingResponseDto] })
  data: ReceivingResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ReceivingStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  inProgress: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  withIssue: number;

  @ApiProperty()
  didNotArrive: number;

  @ApiProperty()
  totalDiscrepancies: number;
}

export class SupplierMetricsDto {
  @ApiProperty()
  supplierName: string;

  @ApiProperty({ enum: SupplierType })
  supplierType: SupplierType;

  @ApiProperty()
  totalReceivings: number;

  @ApiProperty()
  completedOnTime: number;

  @ApiProperty()
  withDiscrepancies: number;

  @ApiProperty()
  onTimeRate: number;

  @ApiProperty()
  discrepancyRate: number;

  @ApiProperty()
  totalDiscrepancies: number;

  @ApiProperty()
  discrepanciesByType: {
    MISSING: number;
    DAMAGED: number;
    WRONG_PRODUCT: number;
  };
}

export class ReceivingDashboardDto {
  @ApiProperty()
  stats: ReceivingStatsDto;

  @ApiProperty({ type: [SupplierMetricsDto] })
  supplierMetrics: SupplierMetricsDto[];

  @ApiProperty()
  recentReceivings: ReceivingResponseDto[];

  @ApiProperty()
  pendingReceivings: ReceivingResponseDto[];
}
