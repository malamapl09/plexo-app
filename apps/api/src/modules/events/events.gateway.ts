import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  storeId?: string;
  role?: string;
  orgId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure appropriately for production
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Store user info on socket
      client.userId = payload.sub;
      client.storeId = payload.storeId;
      client.role = payload.role;
      client.orgId = payload.org;

      // Add to connected clients
      this.connectedClients.set(client.id, client);

      const orgPrefix = payload.org ? `org:${payload.org}:` : '';

      // Join user-specific room
      client.join(`user:${payload.sub}`);

      // Join org-scoped store room if applicable
      if (payload.storeId) {
        client.join(`${orgPrefix}store:${payload.storeId}`);
      }

      // Join org-scoped role room
      client.join(`${orgPrefix}role:${payload.role}`);

      // HQ roles join org-scoped HQ room
      if (['OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR'].includes(payload.role)) {
        client.join(`${orgPrefix}hq`);
      }

      this.logger.log(
        `Client connected: ${client.id} (User: ${payload.sub}, Org: ${payload.org || 'none'}, Store: ${payload.storeId || 'HQ'})`,
      );

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to Plexo Operations',
        userId: payload.sub,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ============================================
  // ROOM SUBSCRIPTIONS
  // ============================================

  @SubscribeMessage('subscribe:store')
  handleSubscribeStore(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() storeId: string,
  ) {
    // Only HQ roles can subscribe to other stores
    if (
      client.role && ['OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR'].includes(client.role)
    ) {
      const orgPrefix = client.orgId ? `org:${client.orgId}:` : '';
      client.join(`${orgPrefix}store:${storeId}`);
      this.logger.log(`Client ${client.id} subscribed to ${orgPrefix}store:${storeId}`);
      return { success: true, storeId };
    }
    return { success: false, error: 'Unauthorized' };
  }

  @SubscribeMessage('unsubscribe:store')
  handleUnsubscribeStore(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() storeId: string,
  ) {
    const orgPrefix = client.orgId ? `org:${client.orgId}:` : '';
    client.leave(`${orgPrefix}store:${storeId}`);
    return { success: true };
  }

  // Helper to build org-scoped room names
  private storeRoom(storeId: string, orgId?: string): string {
    return orgId ? `org:${orgId}:store:${storeId}` : `store:${storeId}`;
  }

  private hqRoom(orgId?: string): string {
    return orgId ? `org:${orgId}:hq` : 'hq';
  }

  // ============================================
  // BROADCAST METHODS (called by services)
  // ============================================

  // Task Events
  emitTaskCreated(task: any, storeIds: string[], orgId?: string) {
    storeIds.forEach((storeId) => {
      this.server.to(this.storeRoom(storeId, orgId)).emit('task:created', task);
    });
    this.server.to(this.hqRoom(orgId)).emit('task:created', task);
    this.logger.debug(`Emitted task:created to ${storeIds.length} stores`);
  }

  emitTaskUpdated(task: any, orgId?: string) {
    this.server.to(this.storeRoom(task.storeId, orgId)).emit('task:updated', task);
    this.server.to(this.hqRoom(orgId)).emit('task:updated', task);
  }

  emitTaskCompleted(task: any, orgId?: string) {
    this.server.to(this.storeRoom(task.storeId, orgId)).emit('task:completed', task);
    this.server.to(this.hqRoom(orgId)).emit('task:completed', task);
    this.logger.debug(`Emitted task:completed for task ${task.id}`);
  }

  emitComplianceUpdate(storeId: string, compliance: any, orgId?: string) {
    this.server.to(this.storeRoom(storeId, orgId)).emit('compliance:updated', compliance);
    this.server.to(this.hqRoom(orgId)).emit('compliance:updated', { storeId, ...compliance });
  }

  // Receiving Events
  emitReceivingCreated(receiving: any, orgId?: string) {
    this.server.to(this.storeRoom(receiving.storeId, orgId)).emit('receiving:created', receiving);
    this.server.to(this.hqRoom(orgId)).emit('receiving:created', receiving);
  }

  emitReceivingUpdated(receiving: any, orgId?: string) {
    this.server.to(this.storeRoom(receiving.storeId, orgId)).emit('receiving:updated', receiving);
    this.server.to(this.hqRoom(orgId)).emit('receiving:updated', receiving);
  }

  emitReceivingCompleted(receiving: any, orgId?: string) {
    this.server.to(this.storeRoom(receiving.storeId, orgId)).emit('receiving:completed', receiving);
    this.server.to(this.hqRoom(orgId)).emit('receiving:completed', receiving);
  }

  emitDiscrepancyReported(discrepancy: any, storeId: string, orgId?: string) {
    this.server.to(this.storeRoom(storeId, orgId)).emit('discrepancy:reported', discrepancy);
    this.server.to(this.hqRoom(orgId)).emit('discrepancy:reported', { storeId, ...discrepancy });
  }

  // Issue Events
  emitIssueCreated(issue: any, orgId?: string) {
    this.server.to(this.storeRoom(issue.storeId, orgId)).emit('issue:created', issue);
    this.server.to(this.hqRoom(orgId)).emit('issue:created', issue);
  }

  emitIssueUpdated(issue: any, orgId?: string) {
    this.server.to(this.storeRoom(issue.storeId, orgId)).emit('issue:updated', issue);
    this.server.to(this.hqRoom(orgId)).emit('issue:updated', issue);
  }

  emitIssueAssigned(issue: any, orgId?: string) {
    this.server.to(this.storeRoom(issue.storeId, orgId)).emit('issue:assigned', issue);
    this.server.to(this.hqRoom(orgId)).emit('issue:assigned', issue);

    // Notify assigned user directly
    if (issue.assignedTo?.id) {
      this.server.to(`user:${issue.assignedTo.id}`).emit('issue:assigned_to_me', issue);
    }
  }

  emitIssueResolved(issue: any, orgId?: string) {
    this.server.to(this.storeRoom(issue.storeId, orgId)).emit('issue:resolved', issue);
    this.server.to(this.hqRoom(orgId)).emit('issue:resolved', issue);

    // Notify reporter
    if (issue.reportedById) {
      this.server.to(`user:${issue.reportedById}`).emit('issue:resolved', issue);
    }
  }

  emitIssueEscalated(issue: any, orgId?: string) {
    this.server.to(this.hqRoom(orgId)).emit('issue:escalated', issue);
    this.logger.warn(`Issue ${issue.id} escalated`);
  }

  // Verification Events
  emitVerificationPending(data: {
    entityType: string;
    entityId: string;
    task?: any;
    issue?: any;
    storeId: string;
    submittedByRole: string;
    orgId?: string;
  }) {
    // Notify store
    this.server.to(this.storeRoom(data.storeId, data.orgId)).emit('verification:pending', data);
    // Notify HQ (supervisors who can verify)
    this.server.to(this.hqRoom(data.orgId)).emit('verification:pending', data);
    this.logger.debug(`Emitted verification:pending for ${data.entityType} ${data.entityId}`);
  }

  emitVerificationComplete(data: {
    entityType: string;
    entityId: string;
    status: 'VERIFIED' | 'REJECTED';
    task?: any;
    issue?: any;
    storeId: string;
    verifiedById: string;
    rejectionReason?: string;
    orgId?: string;
  }) {
    // Notify store
    this.server.to(this.storeRoom(data.storeId, data.orgId)).emit('verification:complete', data);
    // Notify HQ
    this.server.to(this.hqRoom(data.orgId)).emit('verification:complete', data);
    this.logger.debug(
      `Emitted verification:complete (${data.status}) for ${data.entityType} ${data.entityId}`,
    );
  }

  emitTaskRejected(task: any, orgId?: string) {
    this.server.to(this.storeRoom(task.storeId, orgId)).emit('task:rejected', task);
    this.server.to(this.hqRoom(orgId)).emit('task:rejected', task);
    // Notify the user who completed the task
    if (task.completedById) {
      this.server.to(`user:${task.completedById}`).emit('task:rejected', task);
    }
    this.logger.debug(`Emitted task:rejected for task ${task.id}`);
  }

  emitIssueRejected(issue: any, orgId?: string) {
    this.server.to(this.storeRoom(issue.storeId, orgId)).emit('issue:rejected', issue);
    this.server.to(this.hqRoom(orgId)).emit('issue:rejected', issue);
    // Notify the user who resolved the issue
    if (issue.resolvedById) {
      this.server.to(`user:${issue.resolvedById}`).emit('issue:rejected', issue);
    }
    this.logger.debug(`Emitted issue:rejected for issue ${issue.id}`);
  }

  // Dashboard/Summary Events
  emitDashboardUpdate(storeId: string | null, summary: any, orgId?: string) {
    if (storeId) {
      this.server.to(this.storeRoom(storeId, orgId)).emit('dashboard:updated', summary);
    }
    this.server.to(this.hqRoom(orgId)).emit('dashboard:updated', { storeId, ...summary });
  }

  // Checklist Events
  emitChecklistSubmissionCompleted(data: any, storeId: string, orgId?: string) {
    this.server.to(this.storeRoom(storeId, orgId)).emit('checklist:completed', data);
    this.server.to(this.hqRoom(orgId)).emit('checklist:completed', { storeId, ...data });
    this.logger.debug(`Emitted checklist:completed for store ${storeId}`);
  }

  // Store Audit Events
  emitAuditScheduled(data: any, storeId: string, orgId?: string) {
    this.server.to(this.storeRoom(storeId, orgId)).emit('audit:scheduled', data);
    this.server.to(this.hqRoom(orgId)).emit('audit:scheduled', { storeId, ...data });
  }

  emitAuditCompleted(data: any, storeId: string, orgId?: string) {
    this.server.to(this.storeRoom(storeId, orgId)).emit('audit:completed', data);
    this.server.to(this.hqRoom(orgId)).emit('audit:completed', { storeId, ...data });
    this.logger.debug(`Emitted audit:completed for store ${storeId}`);
  }

  emitFindingReported(data: any, storeId: string, orgId?: string) {
    this.server.to(this.storeRoom(storeId, orgId)).emit('finding:reported', data);
    this.server.to(this.hqRoom(orgId)).emit('finding:reported', { storeId, ...data });
  }

  emitCorrectiveActionAssigned(data: any, assignedToId: string, orgId?: string) {
    this.server.to(`user:${assignedToId}`).emit('corrective-action:assigned', data);
    this.server.to(this.hqRoom(orgId)).emit('corrective-action:assigned', data);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getConnectedClientsByStore(storeId: string): number {
    let count = 0;
    this.connectedClients.forEach((client) => {
      if (client.storeId === storeId) count++;
    });
    return count;
  }

  // Send to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Send to specific store (org-scoped)
  emitToStore(storeId: string, event: string, data: any, orgId?: string) {
    this.server.to(this.storeRoom(storeId, orgId)).emit(event, data);
  }

  // Broadcast to all HQ users (org-scoped)
  emitToHQ(event: string, data: any, orgId?: string) {
    this.server.to(this.hqRoom(orgId)).emit(event, data);
  }
}
