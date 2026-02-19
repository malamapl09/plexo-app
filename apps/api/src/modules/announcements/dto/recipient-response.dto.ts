import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipientStatus {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  userEmail: string;

  @ApiPropertyOptional()
  storeName?: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ enum: ['unread', 'read', 'acknowledged'] })
  status: 'unread' | 'read' | 'acknowledged';

  @ApiPropertyOptional()
  viewedAt?: Date;

  @ApiPropertyOptional()
  acknowledgedAt?: Date;
}

export class RecipientListResponse {
  @ApiProperty({ type: [RecipientStatus] })
  recipients: RecipientStatus[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
