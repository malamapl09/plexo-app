import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class AnnouncementResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  priority: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  scope: string;

  @ApiProperty({ type: [String] })
  targetStoreIds: string[];

  @ApiProperty({ type: [String] })
  targetRegionIds: string[];

  @ApiProperty({ type: [String] })
  targetRoles: string[];

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty({ type: [String] })
  attachmentUrls: string[];

  @ApiProperty()
  requiresAck: boolean;

  @ApiPropertyOptional({ type: UserInfo })
  createdBy?: UserInfo;

  @ApiPropertyOptional()
  publishedAt?: Date;

  @ApiPropertyOptional()
  scheduledFor?: Date;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Engagement stats (optional, for list views)
  @ApiPropertyOptional()
  viewCount?: number;

  @ApiPropertyOptional()
  ackCount?: number;

  // Recipient stats (enhanced read receipts)
  @ApiPropertyOptional()
  totalRecipients?: number;

  @ApiPropertyOptional()
  readCount?: number;

  @ApiPropertyOptional()
  unreadCount?: number;

  // User-specific state (for mobile feed)
  @ApiPropertyOptional()
  isViewed?: boolean;

  @ApiPropertyOptional()
  isAcknowledged?: boolean;
}

export class AnnouncementListResponse {
  @ApiProperty({ type: [AnnouncementResponse] })
  announcements: AnnouncementResponse[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class AnnouncementAnalytics {
  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  uniqueViews: number;

  @ApiProperty()
  totalAcks: number;

  @ApiProperty()
  ackRate: number;

  @ApiProperty()
  totalRecipients: number;

  @ApiProperty()
  readRate: number;

  @ApiProperty()
  pendingAckCount: number;

  @ApiProperty({ type: [Object] })
  viewsByStore: { storeId: string; storeName: string; views: number }[];

  @ApiProperty({ type: [Object] })
  acksByStore: { storeId: string; storeName: string; acks: number }[];
}
