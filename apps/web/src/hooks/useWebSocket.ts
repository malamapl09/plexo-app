'use client';

import { useEffect, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  socketService,
  SocketEventMap,
  TaskEvent,
  IssueEvent,
  ReceivingEvent,
  ComplianceEvent,
} from '@/lib/socket';

interface UseWebSocketOptions {
  token?: string | null;
  enabled?: boolean;
  onTaskCreated?: (task: TaskEvent) => void;
  onTaskUpdated?: (task: TaskEvent) => void;
  onTaskCompleted?: (task: TaskEvent) => void;
  onComplianceUpdate?: (compliance: ComplianceEvent) => void;
  onReceivingCreated?: (receiving: ReceivingEvent) => void;
  onReceivingUpdated?: (receiving: ReceivingEvent) => void;
  onReceivingCompleted?: (receiving: ReceivingEvent) => void;
  onIssueCreated?: (issue: IssueEvent) => void;
  onIssueUpdated?: (issue: IssueEvent) => void;
  onIssueAssigned?: (issue: IssueEvent) => void;
  onIssueResolved?: (issue: IssueEvent) => void;
  onIssueEscalated?: (issue: IssueEvent) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token, enabled = true } = options;
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  // Connect on mount
  useEffect(() => {
    if (!enabled || !token) return;

    socketService.connect(token);

    const checkConnection = setInterval(() => {
      setIsConnected(socketService.isConnected());
    }, 1000);

    return () => {
      clearInterval(checkConnection);
    };
  }, [token, enabled]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled || !token) return;

    const cleanups: (() => void)[] = [];

    // Task events
    if (options.onTaskCreated) {
      cleanups.push(socketService.on('task:created', options.onTaskCreated));
    }
    if (options.onTaskUpdated) {
      cleanups.push(socketService.on('task:updated', options.onTaskUpdated));
    }
    if (options.onTaskCompleted) {
      cleanups.push(socketService.on('task:completed', options.onTaskCompleted));
    }

    // Compliance events
    if (options.onComplianceUpdate) {
      cleanups.push(socketService.on('compliance:updated', options.onComplianceUpdate));
    }

    // Receiving events
    if (options.onReceivingCreated) {
      cleanups.push(socketService.on('receiving:created', options.onReceivingCreated));
    }
    if (options.onReceivingUpdated) {
      cleanups.push(socketService.on('receiving:updated', options.onReceivingUpdated));
    }
    if (options.onReceivingCompleted) {
      cleanups.push(socketService.on('receiving:completed', options.onReceivingCompleted));
    }

    // Issue events
    if (options.onIssueCreated) {
      cleanups.push(socketService.on('issue:created', options.onIssueCreated));
    }
    if (options.onIssueUpdated) {
      cleanups.push(socketService.on('issue:updated', options.onIssueUpdated));
    }
    if (options.onIssueAssigned) {
      cleanups.push(socketService.on('issue:assigned', options.onIssueAssigned));
    }
    if (options.onIssueResolved) {
      cleanups.push(socketService.on('issue:resolved', options.onIssueResolved));
    }
    if (options.onIssueEscalated) {
      cleanups.push(socketService.on('issue:escalated', options.onIssueEscalated));
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [token, enabled, options]);

  // Invalidate queries helper
  const invalidateQueries = useCallback(
    (keys: string[]) => {
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
    [queryClient]
  );

  // Subscribe/unsubscribe to store
  const subscribeToStore = useCallback((storeId: string) => {
    socketService.subscribeToStore(storeId);
  }, []);

  const unsubscribeFromStore = useCallback((storeId: string) => {
    socketService.unsubscribeFromStore(storeId);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    subscribeToStore,
    unsubscribeFromStore,
    invalidateQueries,
    disconnect,
  };
}

// Hook for auto-invalidating queries on WebSocket events
export function useWebSocketAutoInvalidate(token?: string | null) {
  const queryClient = useQueryClient();

  useWebSocket({
    token,
    enabled: !!token,
    onTaskCreated: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
    onTaskUpdated: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onTaskCompleted: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
    onComplianceUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
    onReceivingCreated: () => {
      queryClient.invalidateQueries({ queryKey: ['receiving'] });
    },
    onReceivingUpdated: () => {
      queryClient.invalidateQueries({ queryKey: ['receiving'] });
    },
    onReceivingCompleted: () => {
      queryClient.invalidateQueries({ queryKey: ['receiving'] });
    },
    onIssueCreated: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onIssueUpdated: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onIssueAssigned: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onIssueResolved: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
    onIssueEscalated: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}
