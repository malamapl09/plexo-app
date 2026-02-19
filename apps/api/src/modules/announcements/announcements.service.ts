import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { NotificationType } from '../notifications/dto';
import {
  CreateAnnouncementDto,
  AnnouncementType,
  Priority,
  AnnouncementScope,
} from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import {
  AnnouncementResponse,
  AnnouncementListResponse,
  AnnouncementAnalytics,
} from './dto/announcement-response.dto';
import {
  RecipientStatus,
  RecipientListResponse,
} from './dto/recipient-response.dto';
import {
  AnnouncementType as PrismaAnnouncementType,
  AnnouncementStatus as PrismaAnnouncementStatus,
  Priority as PrismaPriority,
} from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  /**
   * Create a new announcement (as draft)
   */
  async create(
    orgId: string,
    createDto: CreateAnnouncementDto,
    createdById: string,
    createdByRole: string,
  ): Promise<AnnouncementResponse> {
    const tp = this.prisma.forTenant(orgId);

    const announcement = await tp.announcement.create({
      data: {
        title: createDto.title,
        content: createDto.content,
        summary: createDto.summary,
        type: (createDto.type || AnnouncementType.GENERAL) as PrismaAnnouncementType,
        priority: (createDto.priority || Priority.MEDIUM) as PrismaPriority,
        status: 'DRAFT',
        scope: createDto.scope || 'ALL',
        targetStoreIds: createDto.targetStoreIds || [],
        targetRegionIds: createDto.targetRegionIds || [],
        targetRoles: createDto.targetRoles || [],
        imageUrl: createDto.imageUrl,
        attachmentUrls: createDto.attachmentUrls || [],
        requiresAck: createDto.requiresAck || false,
        createdById,
        scheduledFor: createDto.scheduledFor ? new Date(createDto.scheduledFor) : null,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ANNOUNCEMENT',
      entityId: announcement.id,
      action: 'CREATED',
      performedById: createdById,
      performedByRole: createdByRole,
      newValue: { title: announcement.title, type: announcement.type, status: 'DRAFT' },
    });

    return this.formatAnnouncementResponse(announcement);
  }

  /**
   * Find all announcements (for HQ management)
   */
  async findAll(
    orgId: string,
    page = 1,
    limit = 20,
    status?: string,
    type?: string,
    search?: string,
  ): Promise<AnnouncementListResponse> {
    const tp = this.prisma.forTenant(orgId);

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [announcements, total] = await Promise.all([
      tp.announcement.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              views: true,
              acknowledgments: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      tp.announcement.count({ where }),
    ]);

    return {
      announcements: announcements.map((a) =>
        this.formatAnnouncementResponse(a, a._count?.views, a._count?.acknowledgments),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get announcement feed for a specific user (mobile)
   */
  async getFeed(
    orgId: string,
    userId: string,
    userRole: string,
    userStoreId?: string,
    page = 1,
    limit = 20,
  ): Promise<AnnouncementListResponse> {
    const tp = this.prisma.forTenant(orgId);

    // Get user's region if they have a store
    let userRegionId: string | null = null;
    if (userStoreId) {
      const store = await tp.store.findUnique({
        where: { id: userStoreId },
        select: { regionId: true },
      });
      userRegionId = store?.regionId || null;
    }

    // Build filter for announcements visible to this user
    const where: any = {
      status: 'PUBLISHED',
      OR: [
        // ALL scope - everyone can see
        { scope: 'ALL' },
        // STORES scope - user's store is in targetStoreIds
        ...(userStoreId
          ? [{ scope: 'STORES', targetStoreIds: { has: userStoreId } }]
          : []),
        // REGIONS scope - user's region is in targetRegionIds
        ...(userRegionId
          ? [{ scope: 'REGIONS', targetRegionIds: { has: userRegionId } }]
          : []),
        // ROLES scope - user's role is in targetRoles
        { scope: 'ROLES', targetRoles: { has: userRole } },
      ],
      // Not expired
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      ],
    };

    const [announcements, total] = await Promise.all([
      tp.announcement.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          views: {
            where: { userId },
            select: { viewedAt: true },
          },
          acknowledgments: {
            where: { userId },
            select: { acknowledgedAt: true },
          },
        },
        orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      tp.announcement.count({ where }),
    ]);

    return {
      announcements: announcements.map((a) => ({
        ...this.formatAnnouncementResponse(a),
        isViewed: a.views.length > 0,
        isAcknowledged: a.acknowledgments.length > 0,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single announcement by ID
   */
  async findOne(orgId: string, id: string): Promise<AnnouncementResponse> {
    const tp = this.prisma.forTenant(orgId);

    const announcement = await tp.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            views: true,
            acknowledgments: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    return this.formatAnnouncementResponse(
      announcement,
      announcement._count?.views,
      announcement._count?.acknowledgments,
    );
  }

  /**
   * Update an announcement
   */
  async update(
    orgId: string,
    id: string,
    updateDto: UpdateAnnouncementDto,
    userId: string,
    userRole: string,
  ): Promise<AnnouncementResponse> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    if (existing.status === 'PUBLISHED') {
      throw new BadRequestException(
        'No se puede editar un anuncio publicado. Archívelo primero.',
      );
    }

    const updated = await tp.announcement.update({
      where: { id },
      data: {
        title: updateDto.title,
        content: updateDto.content,
        summary: updateDto.summary,
        type: updateDto.type as PrismaAnnouncementType,
        priority: updateDto.priority as PrismaPriority,
        scope: updateDto.scope,
        targetStoreIds: updateDto.targetStoreIds,
        targetRegionIds: updateDto.targetRegionIds,
        targetRoles: updateDto.targetRoles,
        imageUrl: updateDto.imageUrl,
        attachmentUrls: updateDto.attachmentUrls,
        requiresAck: updateDto.requiresAck,
        scheduledFor: updateDto.scheduledFor
          ? new Date(updateDto.scheduledFor)
          : undefined,
        expiresAt: updateDto.expiresAt ? new Date(updateDto.expiresAt) : undefined,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ANNOUNCEMENT',
      entityId: id,
      action: 'UPDATED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { title: existing.title },
      newValue: updateDto,
    });

    return this.formatAnnouncementResponse(updated);
  }

  /**
   * Publish an announcement
   */
  async publish(orgId: string, id: string, userId: string, userRole: string): Promise<AnnouncementResponse> {
    const tp = this.prisma.forTenant(orgId);

    const announcement = await tp.announcement.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    if (announcement.status === 'PUBLISHED') {
      throw new BadRequestException('El anuncio ya está publicado');
    }

    const published = await tp.announcement.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    const response = this.formatAnnouncementResponse(published);

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ANNOUNCEMENT',
      entityId: id,
      action: 'STATUS_CHANGED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { status: announcement.status },
      newValue: { status: 'PUBLISHED' },
      fieldChanged: 'status',
    });

    // Broadcast via WebSocket
    this.broadcastAnnouncement(response);

    // Send push notifications
    await this.sendAnnouncementNotifications(orgId, response);

    return response;
  }

  /**
   * Archive an announcement
   */
  async archive(orgId: string, id: string, userId: string, userRole: string): Promise<AnnouncementResponse> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    const archived = await tp.announcement.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ANNOUNCEMENT',
      entityId: id,
      action: 'STATUS_CHANGED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { status: existing.status },
      newValue: { status: 'ARCHIVED' },
      fieldChanged: 'status',
    });

    return this.formatAnnouncementResponse(archived);
  }

  /**
   * Track view for an announcement
   */
  async trackView(orgId: string, announcementId: string, userId: string): Promise<void> {
    const tp = this.prisma.forTenant(orgId);

    await tp.announcementView.upsert({
      where: {
        announcementId_userId: { announcementId, userId },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        announcementId,
        userId,
      },
    });
  }

  /**
   * Track acknowledgment for an announcement
   */
  async trackAcknowledgment(orgId: string, announcementId: string, userId: string): Promise<void> {
    const tp = this.prisma.forTenant(orgId);

    const announcement = await tp.announcement.findUnique({
      where: { id: announcementId },
      select: { requiresAck: true },
    });

    if (!announcement) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    // Also track as viewed
    await this.trackView(orgId, announcementId, userId);

    await tp.announcementAck.upsert({
      where: {
        announcementId_userId: { announcementId, userId },
      },
      update: {
        acknowledgedAt: new Date(),
      },
      create: {
        announcementId,
        userId,
      },
    });
  }

  /**
   * Get analytics for an announcement
   */
  async getAnalytics(orgId: string, id: string): Promise<AnnouncementAnalytics> {
    const tp = this.prisma.forTenant(orgId);

    const announcement = await tp.announcement.findUnique({
      where: { id },
      include: {
        views: {
          include: {
            user: {
              select: {
                storeId: true,
                store: {
                  select: { name: true },
                },
              },
            },
          },
        },
        acknowledgments: {
          include: {
            user: {
              select: {
                storeId: true,
                store: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    // Calculate views by store
    const viewsByStore = new Map<string, { storeName: string; count: number }>();
    announcement.views.forEach((view) => {
      if (view.user.storeId) {
        const existing = viewsByStore.get(view.user.storeId);
        if (existing) {
          existing.count++;
        } else {
          viewsByStore.set(view.user.storeId, {
            storeName: view.user.store?.name || 'Unknown',
            count: 1,
          });
        }
      }
    });

    // Calculate acks by store
    const acksByStore = new Map<string, { storeName: string; count: number }>();
    announcement.acknowledgments.forEach((ack) => {
      if (ack.user.storeId) {
        const existing = acksByStore.get(ack.user.storeId);
        if (existing) {
          existing.count++;
        } else {
          acksByStore.set(ack.user.storeId, {
            storeName: ack.user.store?.name || 'Unknown',
            count: 1,
          });
        }
      }
    });

    const totalViews = announcement.views.length;
    const totalAcks = announcement.acknowledgments.length;

    // Resolve total recipients for rates
    const allRecipients = await this.resolveRecipients(orgId, announcement);
    const totalRecipients = allRecipients.length;
    const readRate = totalRecipients > 0 ? Math.round((totalViews / totalRecipients) * 100) : 0;
    const pendingAckCount = announcement.requiresAck
      ? totalRecipients - totalAcks
      : 0;

    return {
      totalViews,
      uniqueViews: totalViews,
      totalAcks,
      ackRate: totalViews > 0 ? Math.round((totalAcks / totalViews) * 100) : 0,
      totalRecipients,
      readRate,
      pendingAckCount,
      viewsByStore: Array.from(viewsByStore.entries()).map(([storeId, data]) => ({
        storeId,
        storeName: data.storeName,
        views: data.count,
      })),
      acksByStore: Array.from(acksByStore.entries()).map(([storeId, data]) => ({
        storeId,
        storeName: data.storeName,
        acks: data.count,
      })),
    };
  }

  /**
   * Delete an announcement (only drafts)
   */
  async remove(orgId: string, id: string, userId: string, userRole: string): Promise<void> {
    const tp = this.prisma.forTenant(orgId);

    const existing = await tp.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException(
        'Solo se pueden eliminar anuncios en borrador',
      );
    }

    await tp.announcement.delete({
      where: { id },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'ANNOUNCEMENT',
      entityId: id,
      action: 'DELETED',
      performedById: userId,
      performedByRole: userRole,
      previousValue: { title: existing.title, status: existing.status },
    });
  }

  /**
   * Get paginated recipients with read/ack status
   */
  async getRecipients(
    orgId: string,
    announcementId: string,
    page = 1,
    limit = 20,
  ): Promise<RecipientListResponse> {
    const tp = this.prisma.forTenant(orgId);

    const announcement = await tp.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    const allRecipients = await this.resolveRecipients(orgId, announcement);
    const total = allRecipients.length;

    // Get views and acks for these users
    const userIds = allRecipients.map((u) => u.id);
    const [views, acks] = await Promise.all([
      tp.announcementView.findMany({
        where: { announcementId, userId: { in: userIds } },
      }),
      tp.announcementAck.findMany({
        where: { announcementId, userId: { in: userIds } },
      }),
    ]);

    const viewMap = new Map(views.map((v) => [v.userId, v.viewedAt]));
    const ackMap = new Map(acks.map((a) => [a.userId, a.acknowledgedAt]));

    // Build recipient list with status
    const recipients: RecipientStatus[] = allRecipients
      .slice((page - 1) * limit, page * limit)
      .map((user) => {
        const viewedAt = viewMap.get(user.id);
        const acknowledgedAt = ackMap.get(user.id);
        let status: 'unread' | 'read' | 'acknowledged' = 'unread';
        if (acknowledgedAt) status = 'acknowledged';
        else if (viewedAt) status = 'read';

        return {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          storeName: user.store?.name,
          role: user.role,
          status,
          viewedAt: viewedAt || undefined,
          acknowledgedAt: acknowledgedAt || undefined,
        };
      });

    return {
      recipients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Send reminder to unread/unacknowledged users
   */
  async sendReminder(
    orgId: string,
    announcementId: string,
    userId: string,
    userRole: string,
  ): Promise<{ sent: number }> {
    const tp = this.prisma.forTenant(orgId);

    const announcement = await tp.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException('Anuncio no encontrado');
    }

    if (announcement.status !== 'PUBLISHED') {
      throw new BadRequestException('Solo se pueden enviar recordatorios de anuncios publicados');
    }

    const allRecipients = await this.resolveRecipients(orgId, announcement);
    const userIds = allRecipients.map((u) => u.id);

    // Find users who haven't viewed/acknowledged
    const views = await tp.announcementView.findMany({
      where: { announcementId, userId: { in: userIds } },
      select: { userId: true },
    });
    const viewedUserIds = new Set(views.map((v) => v.userId));
    const unreadUserIds = userIds.filter((id) => !viewedUserIds.has(id));

    if (unreadUserIds.length === 0) {
      return { sent: 0 };
    }

    // Send push notifications
    try {
      const title = 'Recordatorio: ' + announcement.title;
      const body = announcement.summary || announcement.content.slice(0, 100);
      await this.notificationsService.sendToUsers(
        orgId,
        unreadUserIds,
        title,
        body,
        {
          type: NotificationType.ANNOUNCEMENT,
          entityId: announcementId,
          entityType: 'announcement',
        },
      );
    } catch (error) {
      console.error('Failed to send reminders:', error);
    }

    return { sent: unreadUserIds.length };
  }

  // ==================== Private Methods ====================

  /**
   * Resolve announcement scope to actual user list
   */
  private async resolveRecipients(orgId: string, announcement: any) {
    const tp = this.prisma.forTenant(orgId);

    let where: any = { isActive: true };

    switch (announcement.scope) {
      case 'ALL':
        // All active users
        break;
      case 'STORES':
        where.storeId = { in: announcement.targetStoreIds };
        break;
      case 'REGIONS':
        where.store = { regionId: { in: announcement.targetRegionIds } };
        break;
      case 'ROLES':
        where.role = { in: announcement.targetRoles };
        break;
    }

    return tp.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        store: { select: { name: true } },
      },
    });
  }

  private formatAnnouncementResponse(
    announcement: any,
    viewCount?: number,
    ackCount?: number,
    totalRecipients?: number,
  ): AnnouncementResponse {
    return {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      summary: announcement.summary,
      type: announcement.type,
      priority: announcement.priority,
      status: announcement.status,
      scope: announcement.scope,
      targetStoreIds: announcement.targetStoreIds || [],
      targetRegionIds: announcement.targetRegionIds || [],
      targetRoles: announcement.targetRoles || [],
      imageUrl: announcement.imageUrl,
      attachmentUrls: announcement.attachmentUrls || [],
      requiresAck: announcement.requiresAck,
      createdBy: announcement.createdBy,
      publishedAt: announcement.publishedAt,
      scheduledFor: announcement.scheduledFor,
      expiresAt: announcement.expiresAt,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      viewCount,
      ackCount,
      totalRecipients,
      readCount: viewCount,
      unreadCount: totalRecipients !== undefined && viewCount !== undefined
        ? totalRecipients - viewCount
        : undefined,
    };
  }

  private broadcastAnnouncement(announcement: AnnouncementResponse): void {
    const eventData = {
      id: announcement.id,
      title: announcement.title,
      summary: announcement.summary,
      type: announcement.type,
      priority: announcement.priority,
      requiresAck: announcement.requiresAck,
      publishedAt: announcement.publishedAt,
    };

    switch (announcement.scope) {
      case 'ALL':
        // Broadcast to all connected users
        this.eventsGateway.emitToHQ('announcement:published', eventData);
        // Also emit to all stores (since we don't have an 'all' room)
        // The mobile app will filter based on scope
        break;

      case 'STORES':
        announcement.targetStoreIds.forEach((storeId) => {
          this.eventsGateway.emitToStore(storeId, 'announcement:published', eventData);
        });
        this.eventsGateway.emitToHQ('announcement:published', eventData);
        break;

      case 'REGIONS':
        // For regions, we need to get stores in those regions
        // This is simplified - in production, cache region->store mappings
        this.eventsGateway.emitToHQ('announcement:published', eventData);
        break;

      case 'ROLES':
        announcement.targetRoles.forEach((role) => {
          // The events gateway has role-based rooms
          this.eventsGateway.server.to(`role:${role}`).emit('announcement:published', eventData);
        });
        break;
    }
  }

  private async sendAnnouncementNotifications(
    orgId: string,
    announcement: AnnouncementResponse,
  ): Promise<void> {
    const tp = this.prisma.forTenant(orgId);

    const title =
      announcement.type === 'EMERGENCY'
        ? `🚨 ${announcement.title}`
        : announcement.title;

    const body = announcement.summary || announcement.content.slice(0, 100);

    const data = {
      type: NotificationType.ANNOUNCEMENT,
      entityId: announcement.id,
      entityType: 'announcement',
    };

    try {
      switch (announcement.scope) {
        case 'ALL':
          // Send to all users via topic
          await this.notificationsService.sendToTopic(orgId, 'all_users', title, body, data);
          break;

        case 'STORES':
          // Send to each target store
          for (const storeId of announcement.targetStoreIds) {
            await this.notificationsService.sendToStore(orgId, storeId, title, body, data);
          }
          break;

        case 'REGIONS':
          // Get all stores in target regions and send
          const stores = await tp.store.findMany({
            where: {
              regionId: { in: announcement.targetRegionIds },
              isActive: true,
            },
            select: { id: true },
          });
          for (const store of stores) {
            await this.notificationsService.sendToStore(orgId, store.id, title, body, data);
          }
          break;

        case 'ROLES':
          // Get all users with target roles
          const users = await tp.user.findMany({
            where: {
              role: { in: announcement.targetRoles },
              isActive: true,
            },
            select: { id: true },
          });
          await this.notificationsService.sendToUsers(
            orgId,
            users.map((u) => u.id),
            title,
            body,
            data,
          );
          break;
      }
    } catch (error) {
      // Log but don't fail the publish
      console.error('Failed to send announcement notifications:', error);
    }
  }
}
