import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RegisterDeviceDto,
  DevicePlatform,
  SendNotificationDto,
  NotificationType,
  NotificationDataDto,
} from './dto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const serviceAccountPath = this.configService.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_PATH',
      );

      if (serviceAccountPath) {
        // Initialize with service account file
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(serviceAccountPath);
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.logger.log('Firebase Admin SDK initialized');
      } else {
        this.logger.warn(
          'Firebase service account not configured - notifications will be mocked',
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
    }
  }

  /**
   * Register a device token for a user
   */
  async registerDevice(orgId: string, userId: string, dto: RegisterDeviceDto): Promise<void> {
    const tp = this.prisma.forTenant(orgId);

    // Upsert device token
    await tp.deviceToken.upsert({
      where: {
        token: dto.token,
      },
      update: {
        userId,
        platform: dto.platform,
        deviceName: dto.deviceName,
        appVersion: dto.appVersion,
        lastActiveAt: new Date(),
      },
      create: {
        token: dto.token,
        userId,
        platform: dto.platform,
        deviceName: dto.deviceName,
        appVersion: dto.appVersion,
      },
    });

    this.logger.log(`Device registered for user ${userId}`);
  }

  /**
   * Unregister a device token
   */
  async unregisterDevice(orgId: string, userId: string, token: string): Promise<void> {
    const tp = this.prisma.forTenant(orgId);

    await tp.deviceToken.deleteMany({
      where: {
        token,
        userId,
      },
    });

    this.logger.log(`Device unregistered for user ${userId}`);
  }

  /**
   * Send notification to specific users
   */
  async sendToUsers(
    orgId: string,
    userIds: string[],
    title: string,
    body: string,
    data: NotificationDataDto,
  ): Promise<{ success: number; failure: number }> {
    const tp = this.prisma.forTenant(orgId);

    const tokens = await tp.deviceToken.findMany({
      where: {
        userId: { in: userIds },
      },
      select: { token: true },
    });

    if (tokens.length === 0) {
      this.logger.warn(`No device tokens found for users: ${userIds.join(', ')}`);
      return { success: 0, failure: 0 };
    }

    return this.sendToTokens(
      orgId,
      tokens.map((t) => t.token),
      title,
      body,
      data,
    );
  }

  /**
   * Send notification to all users in a store
   */
  async sendToStore(
    orgId: string,
    storeId: string,
    title: string,
    body: string,
    data: NotificationDataDto,
  ): Promise<{ success: number; failure: number }> {
    const tp = this.prisma.forTenant(orgId);

    const users = await tp.user.findMany({
      where: { storeId, isActive: true },
      select: { id: true },
    });

    if (users.length === 0) {
      return { success: 0, failure: 0 };
    }

    return this.sendToUsers(
      orgId,
      users.map((u) => u.id),
      title,
      body,
      data,
    );
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    orgId: string,
    topic: string,
    title: string,
    body: string,
    data: NotificationDataDto,
  ): Promise<boolean> {
    if (!this.firebaseApp) {
      this.logger.warn(`[MOCK] Sending to topic ${topic}: ${title}`);
      return true;
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data: this.serializeData(data),
        android: {
          priority: 'high',
          notification: {
            channelId: 'plexo_ops_channel',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      await admin.messaging().send(message);
      this.logger.log(`Notification sent to topic: ${topic}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send to topic ${topic}`, error);
      return false;
    }
  }

  /**
   * Send notification to specific device tokens
   */
  async sendToTokens(
    orgId: string,
    tokens: string[],
    title: string,
    body: string,
    data: NotificationDataDto,
  ): Promise<{ success: number; failure: number }> {
    if (!this.firebaseApp) {
      this.logger.warn(
        `[MOCK] Sending to ${tokens.length} tokens: ${title}`,
      );
      return { success: tokens.length, failure: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: this.serializeData(data),
        android: {
          priority: 'high',
          notification: {
            channelId: 'plexo_ops_channel',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // Clean up invalid tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });

        if (failedTokens.length > 0) {
          await this.cleanupInvalidTokens(orgId, failedTokens);
        }
      }

      this.logger.log(
        `Notifications sent: ${response.successCount} success, ${response.failureCount} failure`,
      );

      return {
        success: response.successCount,
        failure: response.failureCount,
      };
    } catch (error) {
      this.logger.error('Failed to send notifications', error);
      return { success: 0, failure: tokens.length };
    }
  }

  /**
   * Send notification using DTO
   */
  async send(orgId: string, dto: SendNotificationDto): Promise<{ success: number; failure: number }> {
    if (dto.topic) {
      const success = await this.sendToTopic(orgId, dto.topic, dto.title, dto.body, dto.data);
      return { success: success ? 1 : 0, failure: success ? 0 : 1 };
    }

    if (dto.storeId) {
      return this.sendToStore(orgId, dto.storeId, dto.title, dto.body, dto.data);
    }

    if (dto.userIds && dto.userIds.length > 0) {
      return this.sendToUsers(orgId, dto.userIds, dto.title, dto.body, dto.data);
    }

    return { success: 0, failure: 0 };
  }

  // ============================================
  // NOTIFICATION TEMPLATES
  // ============================================

  /**
   * Send task overdue notification
   */
  async notifyTaskOverdue(
    orgId: string,
    taskId: string,
    taskTitle: string,
    storeId: string,
    assignedUserIds: string[],
  ): Promise<void> {
    await this.sendToUsers(orgId, assignedUserIds, 'Tarea Vencida', `La tarea "${taskTitle}" ha vencido`, {
      type: NotificationType.TASK_OVERDUE,
      entityId: taskId,
      entityType: 'task',
    });
  }

  /**
   * Send issue assigned notification
   */
  async notifyIssueAssigned(
    orgId: string,
    issueId: string,
    issueTitle: string,
    assignedToId: string,
  ): Promise<void> {
    await this.sendToUsers(
      orgId,
      [assignedToId],
      'Incidencia Asignada',
      `Se te ha asignado la incidencia: "${issueTitle}"`,
      {
        type: NotificationType.ISSUE_ASSIGNED,
        entityId: issueId,
        entityType: 'issue',
      },
    );
  }

  /**
   * Send issue escalated notification
   */
  async notifyIssueEscalated(
    orgId: string,
    issueId: string,
    issueTitle: string,
    storeId: string,
  ): Promise<void> {
    // Send to store managers and supervisors
    await this.sendToTopic(
      orgId,
      `store_${storeId}`,
      'Incidencia Escalada',
      `La incidencia "${issueTitle}" ha sido escalada`,
      {
        type: NotificationType.ISSUE_ESCALATED,
        entityId: issueId,
        entityType: 'issue',
      },
    );
  }

  /**
   * Send issue resolved notification
   */
  async notifyIssueResolved(
    orgId: string,
    issueId: string,
    issueTitle: string,
    reportedById: string,
  ): Promise<void> {
    await this.sendToUsers(
      orgId,
      [reportedById],
      'Incidencia Resuelta',
      `La incidencia "${issueTitle}" ha sido resuelta`,
      {
        type: NotificationType.ISSUE_RESOLVED,
        entityId: issueId,
        entityType: 'issue',
      },
    );
  }

  /**
   * Send receiving arrived notification
   */
  async notifyReceivingArrived(
    orgId: string,
    receivingId: string,
    supplierName: string,
    storeId: string,
  ): Promise<void> {
    await this.sendToTopic(
      orgId,
      `store_${storeId}`,
      'Recepción Llegó',
      `El proveedor "${supplierName}" ha llegado`,
      {
        type: NotificationType.RECEIVING_ARRIVED,
        entityId: receivingId,
        entityType: 'receiving',
      },
    );
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private serializeData(data: NotificationDataDto): Record<string, string> {
    const result: Record<string, string> = {
      type: data.type,
    };

    if (data.entityId) result.entityId = data.entityId;
    if (data.entityType) result.entityType = data.entityType;

    // Flatten extra data
    if (data.extra) {
      Object.entries(data.extra).forEach(([key, value]) => {
        result[key] = value;
      });
    }

    return result;
  }

  private async cleanupInvalidTokens(orgId: string, tokens: string[]): Promise<void> {
    const tp = this.prisma.forTenant(orgId);

    await tp.deviceToken.deleteMany({
      where: {
        token: { in: tokens },
      },
    });

    this.logger.log(`Cleaned up ${tokens.length} invalid tokens`);
  }

  /**
   * Get user's registered devices
   */
  async getUserDevices(orgId: string, userId: string) {
    const tp = this.prisma.forTenant(orgId);

    return tp.deviceToken.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        deviceName: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });
  }
}
