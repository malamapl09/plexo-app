import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { CorrectiveActionStatus } from '@prisma/client';

@Injectable()
export class CorrectiveActionsScheduler {
  private readonly logger = new Logger(CorrectiveActionsScheduler.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * Mark overdue actions
   * Runs daily at 8:00 AM
   */
  @Cron('0 8 * * *')
  async markOverdue() {
    this.logger.log('Running markOverdue job...');

    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Start of today

      // Find actions past due date that are still PENDING or IN_PROGRESS
      const overdueActions = await this.prisma.correctiveAction.findMany({
        where: {
          dueDate: { lt: now },
          status: {
            in: [CorrectiveActionStatus.PENDING, CorrectiveActionStatus.IN_PROGRESS],
          },
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          store: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      if (overdueActions.length === 0) {
        this.logger.log('No overdue actions found');
        return;
      }

      this.logger.log(`Found ${overdueActions.length} overdue actions`);

      // Update status to OVERDUE
      await this.prisma.correctiveAction.updateMany({
        where: {
          id: { in: overdueActions.map((a) => a.id) },
        },
        data: {
          status: CorrectiveActionStatus.OVERDUE,
        },
      });

      // Emit WebSocket events for each overdue action
      for (const action of overdueActions) {
        const actionWithStatus = { ...action, status: CorrectiveActionStatus.OVERDUE };

        // Notify assignee
        this.eventsGateway.emitToUser(
          action.assignedToId,
          'capa:overdue',
          actionWithStatus,
        );

        // Notify store
        if (action.storeId) {
          this.eventsGateway.emitToStore(
            action.storeId,
            'capa:overdue',
            actionWithStatus,
          );
        }

        // Notify HQ
        this.eventsGateway.emitToHQ('capa:overdue', actionWithStatus);
      }

      this.logger.log(`Marked ${overdueActions.length} actions as OVERDUE`);
    } catch (error) {
      this.logger.error(`Error in markOverdue job: ${error.message}`, error.stack);
    }
  }

  /**
   * Send due soon notifications
   * Runs daily at 9:00 AM
   */
  @Cron('0 9 * * *')
  async sendDueSoonNotifications() {
    this.logger.log('Running sendDueSoonNotifications job...');

    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Calculate dates for 1 day and 3 days from now
      const oneDayFromNow = new Date(now);
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      // Find actions due in 1 day
      const dueInOneDay = await this.prisma.correctiveAction.findMany({
        where: {
          dueDate: {
            gte: oneDayFromNow,
            lt: new Date(oneDayFromNow.getTime() + 24 * 60 * 60 * 1000),
          },
          status: {
            in: [CorrectiveActionStatus.PENDING, CorrectiveActionStatus.IN_PROGRESS],
          },
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          store: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      // Find actions due in 3 days
      const dueInThreeDays = await this.prisma.correctiveAction.findMany({
        where: {
          dueDate: {
            gte: threeDaysFromNow,
            lt: new Date(threeDaysFromNow.getTime() + 24 * 60 * 60 * 1000),
          },
          status: {
            in: [CorrectiveActionStatus.PENDING, CorrectiveActionStatus.IN_PROGRESS],
          },
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          store: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      // Send notifications for actions due in 1 day
      if (dueInOneDay.length > 0) {
        this.logger.log(`Sending notifications for ${dueInOneDay.length} actions due in 1 day`);

        for (const action of dueInOneDay) {
          this.eventsGateway.emitToUser(action.assignedToId, 'capa:due_soon', {
            ...action,
            daysUntilDue: 1,
            urgency: 'high',
          });
        }
      }

      // Send notifications for actions due in 3 days
      if (dueInThreeDays.length > 0) {
        this.logger.log(
          `Sending notifications for ${dueInThreeDays.length} actions due in 3 days`,
        );

        for (const action of dueInThreeDays) {
          this.eventsGateway.emitToUser(action.assignedToId, 'capa:due_soon', {
            ...action,
            daysUntilDue: 3,
            urgency: 'medium',
          });
        }
      }

      if (dueInOneDay.length === 0 && dueInThreeDays.length === 0) {
        this.logger.log('No actions due soon');
      }
    } catch (error) {
      this.logger.error(
        `Error in sendDueSoonNotifications job: ${error.message}`,
        error.stack,
      );
    }
  }
}
