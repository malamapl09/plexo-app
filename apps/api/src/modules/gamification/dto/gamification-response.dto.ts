import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GamificationActionType } from '@prisma/client';

export class BadgeResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Task Master' })
  name: string;

  @ApiPropertyOptional({ example: 'Complete 10 tasks' })
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/badge.png' })
  iconUrl?: string;

  @ApiProperty({
    example: { type: 'count', actionType: 'TASK_COMPLETED', threshold: 10 },
  })
  criteria: Record<string, any>;

  @ApiProperty({ example: 42 })
  earnedCount: number;

  @ApiPropertyOptional({ example: true })
  isEarned?: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  earnedAt?: Date;
}

export class GamificationProfileResponse {
  @ApiProperty({ example: 1250 })
  totalPoints: number;

  @ApiProperty({ example: 85 })
  weeklyPoints: number;

  @ApiProperty({ example: 340 })
  monthlyPoints: number;

  @ApiProperty({ example: 3 })
  rank: number;

  @ApiProperty({ type: [BadgeResponse] })
  badges: BadgeResponse[];
}

export class LeaderboardEntryResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId: string;

  @ApiProperty({ example: 'Juan Pérez' })
  userName: string;

  @ApiPropertyOptional({ example: 'Duarte' })
  storeName?: string;

  @ApiProperty({ example: 1500 })
  totalPoints: number;

  @ApiProperty({ example: 120 })
  weeklyPoints: number;

  @ApiProperty({ example: 450 })
  monthlyPoints: number;

  @ApiProperty({ example: 1 })
  rank: number;
}

export class LeaderboardResponse {
  @ApiProperty({ type: [LeaderboardEntryResponse] })
  entries: LeaderboardEntryResponse[];

  @ApiProperty({ enum: ['weekly', 'monthly', 'allTime'], example: 'weekly' })
  period: 'weekly' | 'monthly' | 'allTime';

  @ApiProperty({ enum: ['store', 'region', 'all'], example: 'all' })
  scope: 'store' | 'region' | 'all';
}

export class PointConfigResponse {
  @ApiProperty({ enum: GamificationActionType, example: 'TASK_COMPLETED' })
  actionType: GamificationActionType;

  @ApiProperty({ example: 10 })
  points: number;

  @ApiPropertyOptional({ example: 'Points awarded for completing a task' })
  description?: string;

  @ApiProperty({ example: true })
  isActive: boolean;
}
