import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:plexo_ops/core/config/app_config.dart';

/// Socket event types
enum SocketEvent {
  // Connection
  connected,
  disconnected,

  // Task events
  taskCreated,
  taskUpdated,
  taskCompleted,

  // Compliance events
  complianceUpdated,

  // Receiving events
  receivingCreated,
  receivingUpdated,
  receivingCompleted,
  discrepancyReported,

  // Issue events
  issueCreated,
  issueUpdated,
  issueAssigned,
  issueAssignedToMe,
  issueResolved,
  issueEscalated,

  // Dashboard events
  dashboardUpdated,
}

/// Socket event data
class SocketEventData {
  final SocketEvent event;
  final Map<String, dynamic> data;
  final DateTime timestamp;

  SocketEventData({
    required this.event,
    required this.data,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

/// Socket connection state
enum SocketConnectionState {
  disconnected,
  connecting,
  connected,
  error,
}

/// Socket service for real-time updates
class SocketService {
  io.Socket? _socket;
  final String _baseUrl;
  String? _token;

  final _connectionStateController = StreamController<SocketConnectionState>.broadcast();
  final _eventController = StreamController<SocketEventData>.broadcast();

  SocketConnectionState _currentState = SocketConnectionState.disconnected;

  SocketService({required String baseUrl}) : _baseUrl = baseUrl;

  /// Stream of connection state changes
  Stream<SocketConnectionState> get connectionState => _connectionStateController.stream;

  /// Stream of socket events
  Stream<SocketEventData> get events => _eventController.stream;

  /// Current connection state
  SocketConnectionState get currentState => _currentState;

  /// Whether the socket is connected
  bool get isConnected => _currentState == SocketConnectionState.connected;

  /// Connect to the WebSocket server
  void connect(String token) {
    if (_socket != null && _token == token) {
      return; // Already connected with same token
    }

    _token = token;
    _updateState(SocketConnectionState.connecting);

    _socket = io.io(
      '$_baseUrl/events',
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .setReconnectionDelay(1000)
          .build(),
    );

    _setupListeners();
  }

  void _setupListeners() {
    _socket?.onConnect((_) {
      debugPrint('[WebSocket] Connected');
      _updateState(SocketConnectionState.connected);
    });

    _socket?.onDisconnect((_) {
      debugPrint('[WebSocket] Disconnected');
      _updateState(SocketConnectionState.disconnected);
    });

    _socket?.onConnectError((error) {
      debugPrint('[WebSocket] Connection error: $error');
      _updateState(SocketConnectionState.error);
    });

    _socket?.onError((error) {
      debugPrint('[WebSocket] Error: $error');
    });

    // Register event listeners
    _registerEventListeners();
  }

  void _registerEventListeners() {
    // Connection confirmation
    _socket?.on('connected', (data) {
      _emitEvent(SocketEvent.connected, data as Map<String, dynamic>);
    });

    // Task events
    _socket?.on('task:created', (data) {
      _emitEvent(SocketEvent.taskCreated, _toMap(data));
    });

    _socket?.on('task:updated', (data) {
      _emitEvent(SocketEvent.taskUpdated, _toMap(data));
    });

    _socket?.on('task:completed', (data) {
      _emitEvent(SocketEvent.taskCompleted, _toMap(data));
    });

    // Compliance events
    _socket?.on('compliance:updated', (data) {
      _emitEvent(SocketEvent.complianceUpdated, _toMap(data));
    });

    // Receiving events
    _socket?.on('receiving:created', (data) {
      _emitEvent(SocketEvent.receivingCreated, _toMap(data));
    });

    _socket?.on('receiving:updated', (data) {
      _emitEvent(SocketEvent.receivingUpdated, _toMap(data));
    });

    _socket?.on('receiving:completed', (data) {
      _emitEvent(SocketEvent.receivingCompleted, _toMap(data));
    });

    _socket?.on('discrepancy:reported', (data) {
      _emitEvent(SocketEvent.discrepancyReported, _toMap(data));
    });

    // Issue events
    _socket?.on('issue:created', (data) {
      _emitEvent(SocketEvent.issueCreated, _toMap(data));
    });

    _socket?.on('issue:updated', (data) {
      _emitEvent(SocketEvent.issueUpdated, _toMap(data));
    });

    _socket?.on('issue:assigned', (data) {
      _emitEvent(SocketEvent.issueAssigned, _toMap(data));
    });

    _socket?.on('issue:assigned_to_me', (data) {
      _emitEvent(SocketEvent.issueAssignedToMe, _toMap(data));
    });

    _socket?.on('issue:resolved', (data) {
      _emitEvent(SocketEvent.issueResolved, _toMap(data));
    });

    _socket?.on('issue:escalated', (data) {
      _emitEvent(SocketEvent.issueEscalated, _toMap(data));
    });

    // Dashboard events
    _socket?.on('dashboard:updated', (data) {
      _emitEvent(SocketEvent.dashboardUpdated, _toMap(data));
    });
  }

  Map<String, dynamic> _toMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {'data': data};
  }

  void _emitEvent(SocketEvent event, Map<String, dynamic> data) {
    _eventController.add(SocketEventData(event: event, data: data));
  }

  void _updateState(SocketConnectionState state) {
    _currentState = state;
    _connectionStateController.add(state);
  }

  /// Subscribe to a specific store's updates (for HQ users)
  void subscribeToStore(String storeId) {
    _socket?.emit('subscribe:store', storeId);
  }

  /// Unsubscribe from a specific store's updates
  void unsubscribeFromStore(String storeId) {
    _socket?.emit('unsubscribe:store', storeId);
  }

  /// Disconnect from the WebSocket server
  void disconnect() {
    _socket?.dispose();
    _socket = null;
    _token = null;
    _updateState(SocketConnectionState.disconnected);
  }

  /// Dispose resources
  void dispose() {
    disconnect();
    _connectionStateController.close();
    _eventController.close();
  }
}

/// Provider for SocketService
final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService(baseUrl: AppConfig.wsBaseUrl);

  ref.onDispose(() {
    service.dispose();
  });

  return service;
});

/// Provider for socket connection state
final socketConnectionStateProvider = StreamProvider<SocketConnectionState>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return socketService.connectionState;
});

/// Provider for socket events stream
final socketEventsProvider = StreamProvider<SocketEventData>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  return socketService.events;
});

/// Provider that filters events by type
final socketEventsByTypeProvider = StreamProvider.family<SocketEventData, SocketEvent>((ref, eventType) {
  final socketService = ref.watch(socketServiceProvider);
  return socketService.events.where((event) => event.event == eventType);
});
