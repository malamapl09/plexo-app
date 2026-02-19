import { io, Socket } from 'socket.io-client';

// Socket.IO event types
export interface TaskEvent {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status?: string;
  storeId?: string;
  assignments?: any[];
  [key: string]: any;
}

export interface ReceivingEvent {
  id: string;
  storeId: string;
  supplierName: string;
  status: string;
  [key: string]: any;
}

export interface IssueEvent {
  id: string;
  storeId: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  assignedTo?: { id: string; name: string };
  [key: string]: any;
}

export interface ComplianceEvent {
  storeId?: string;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
}

export interface DiscrepancyEvent {
  id: string;
  storeId?: string;
  type: string;
  productInfo: string;
  [key: string]: any;
}

export type SocketEventMap = {
  // Connection events
  connected: { message: string; userId: string; timestamp: string };

  // Task events
  'task:created': TaskEvent;
  'task:updated': TaskEvent;
  'task:completed': TaskEvent;

  // Compliance events
  'compliance:updated': ComplianceEvent;

  // Receiving events
  'receiving:created': ReceivingEvent;
  'receiving:updated': ReceivingEvent;
  'receiving:completed': ReceivingEvent;
  'discrepancy:reported': DiscrepancyEvent;

  // Issue events
  'issue:created': IssueEvent;
  'issue:updated': IssueEvent;
  'issue:assigned': IssueEvent;
  'issue:assigned_to_me': IssueEvent;
  'issue:resolved': IssueEvent;
  'issue:escalated': IssueEvent;

  // Dashboard events
  'dashboard:updated': any;
};

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    this.socket = io(`${apiUrl}/events`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
    });

    // Re-register all listeners after reconnection
    this.socket.on('connect', () => {
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          this.socket?.on(event, callback);
        });
      });
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  on<K extends keyof SocketEventMap>(
    event: K,
    callback: (data: SocketEventMap[K]) => void
  ) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    this.socket?.on(event, callback as any);

    return () => {
      this.off(event, callback);
    };
  }

  off<K extends keyof SocketEventMap>(
    event: K,
    callback: (data: SocketEventMap[K]) => void
  ) {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback as any);
  }

  // Subscribe to a specific store's updates (for HQ users)
  subscribeToStore(storeId: string) {
    this.socket?.emit('subscribe:store', storeId);
  }

  // Unsubscribe from a specific store's updates
  unsubscribeFromStore(storeId: string) {
    this.socket?.emit('unsubscribe:store', storeId);
  }
}

// Singleton instance
export const socketService = new SocketService();
