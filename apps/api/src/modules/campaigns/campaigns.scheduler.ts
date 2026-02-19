import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CampaignStatus, CampaignSubmissionStatus } from '@prisma/client';

@Injectable()
export class CampaignsScheduler {
  private readonly logger = new Logger(CampaignsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Mark expired campaigns as COMPLETED
   * Runs daily at 7:00 AM
   */
  @Cron('0 7 * * *')
  async markExpired() {
    this.logger.log('Running markExpired job...');

    try {
      const now = new Date();

      const expiredCampaigns = await this.prisma.campaign.findMany({
        where: {
          status: CampaignStatus.ACTIVE,
          endDate: { lt: now },
        },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
        },
      });

      if (expiredCampaigns.length === 0) {
        this.logger.log('No expired campaigns found');
        return;
      }

      this.logger.log(`Found ${expiredCampaigns.length} expired campaigns`);

      await this.prisma.campaign.updateMany({
        where: {
          id: { in: expiredCampaigns.map((c) => c.id) },
        },
        data: {
          status: CampaignStatus.COMPLETED,
        },
      });

      for (const campaign of expiredCampaigns) {
        if (campaign.targetStoreIds.length > 0) {
          campaign.targetStoreIds.forEach((storeId) => {
            this.eventsGateway.emitToStore(storeId, 'campaign:completed', {
              campaignId: campaign.id,
              title: campaign.title,
            });
          });
        }

        this.eventsGateway.emitToHQ('campaign:completed', {
          campaignId: campaign.id,
          title: campaign.title,
        });
      }

      this.logger.log(
        `Marked ${expiredCampaigns.length} campaigns as COMPLETED`,
      );
    } catch (error) {
      this.logger.error(
        `Error in markExpired job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Send deadline reminders for campaigns ending in 1 or 3 days
   * Runs daily at 9:00 AM
   */
  @Cron('0 9 * * *')
  async sendDeadlineReminders() {
    this.logger.log('Running sendDeadlineReminders job...');

    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const oneDayFromNow = new Date(now);
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const campaigns = await this.prisma.campaign.findMany({
        where: {
          status: CampaignStatus.ACTIVE,
          OR: [
            {
              endDate: {
                gte: oneDayFromNow,
                lt: new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000),
              },
            },
            {
              endDate: {
                gte: threeDaysFromNow,
                lt: new Date(
                  threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000,
                ),
              },
            },
          ],
        },
      });

      if (campaigns.length === 0) {
        this.logger.log('No campaigns with upcoming deadlines');
        return;
      }

      const stores = await this.prisma.store.findMany({
        select: { id: true, name: true },
      });

      for (const campaign of campaigns) {
        const daysUntilDue = Math.ceil(
          (campaign.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );

        const targetStores =
          campaign.targetStoreIds.length > 0
            ? stores.filter((s) => campaign.targetStoreIds.includes(s.id))
            : stores;

        // Find stores without approved submissions
        for (const store of targetStores) {
          const approvedSubmission =
            await this.prisma.campaignSubmission.findFirst({
              where: {
                campaignId: campaign.id,
                storeId: store.id,
                status: CampaignSubmissionStatus.APPROVED,
              },
            });

          if (!approvedSubmission) {
            this.eventsGateway.emitToStore(
              store.id,
              'campaign:deadline_reminder',
              {
                campaignId: campaign.id,
                title: campaign.title,
                endDate: campaign.endDate,
                daysUntilDue,
                urgency: daysUntilDue <= 1 ? 'high' : 'medium',
              },
            );
          }
        }
      }

      this.logger.log(
        `Sent deadline reminders for ${campaigns.length} campaigns`,
      );
    } catch (error) {
      this.logger.error(
        `Error in sendDeadlineReminders job: ${error.message}`,
        error.stack,
      );
    }
  }
}
