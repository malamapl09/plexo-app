import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Sends heartbeat pings to Better Stack after scheduled jobs complete.
 *
 * Each cron job has its own heartbeat URL configured via env vars.
 * If the URL is not set, the ping is silently skipped.
 */
@Injectable()
export class HeartbeatService {
  private readonly logger = new Logger(HeartbeatService.name);

  // Heartbeat URLs keyed by job name
  private readonly heartbeats: Record<string, string | undefined>;

  constructor(private configService: ConfigService) {
    this.heartbeats = {
      weeklyPointsReset: this.configService.get('BETTERSTACK_HEARTBEAT_WEEKLY_RESET'),
      monthlyPointsReset: this.configService.get('BETTERSTACK_HEARTBEAT_MONTHLY_RESET'),
      dailyCompliance: this.configService.get('BETTERSTACK_HEARTBEAT_DAILY_COMPLIANCE'),
      dailyEmployeeSync: this.configService.get('BETTERSTACK_HEARTBEAT_DAILY_SYNC'),
    };
  }

  async ping(jobName: string): Promise<void> {
    const url = this.heartbeats[jobName];
    if (!url) return;

    try {
      await fetch(url, { method: 'GET' });
    } catch (error) {
      this.logger.warn(`Heartbeat ping failed for ${jobName}: ${error.message}`);
    }
  }
}
