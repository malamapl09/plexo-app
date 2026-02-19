import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';

/// Notification types used in the app
enum NotificationType {
  taskOverdue,
  taskAssigned,
  issueReported,
  issueAssigned,
  issueEscalated,
  issueResolved,
  receivingScheduled,
  receivingArrived,
  general,
}

/// Parsed notification payload
class NotificationPayload {
  final NotificationType type;
  final String? entityId;
  final String? entityType;
  final Map<String, dynamic> data;

  NotificationPayload({
    required this.type,
    this.entityId,
    this.entityType,
    this.data = const {},
  });

  factory NotificationPayload.fromMap(Map<String, dynamic> map) {
    return NotificationPayload(
      type: _parseType(map['type'] as String?),
      entityId: map['entityId'] as String?,
      entityType: map['entityType'] as String?,
      data: map,
    );
  }

  static NotificationType _parseType(String? type) {
    switch (type) {
      case 'TASK_OVERDUE':
        return NotificationType.taskOverdue;
      case 'TASK_ASSIGNED':
        return NotificationType.taskAssigned;
      case 'ISSUE_REPORTED':
        return NotificationType.issueReported;
      case 'ISSUE_ASSIGNED':
        return NotificationType.issueAssigned;
      case 'ISSUE_ESCALATED':
        return NotificationType.issueEscalated;
      case 'ISSUE_RESOLVED':
        return NotificationType.issueResolved;
      case 'RECEIVING_SCHEDULED':
        return NotificationType.receivingScheduled;
      case 'RECEIVING_ARRIVED':
        return NotificationType.receivingArrived;
      default:
        return NotificationType.general;
    }
  }
}

/// Background message handler - must be top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Handling background message: ${message.messageId}');
}

/// Notification service state
class NotificationState {
  final bool isInitialized;
  final bool hasPermission;
  final String? fcmToken;
  final NotificationPayload? lastNotification;

  const NotificationState({
    this.isInitialized = false,
    this.hasPermission = false,
    this.fcmToken,
    this.lastNotification,
  });

  NotificationState copyWith({
    bool? isInitialized,
    bool? hasPermission,
    String? fcmToken,
    NotificationPayload? lastNotification,
  }) {
    return NotificationState(
      isInitialized: isInitialized ?? this.isInitialized,
      hasPermission: hasPermission ?? this.hasPermission,
      fcmToken: fcmToken ?? this.fcmToken,
      lastNotification: lastNotification ?? this.lastNotification,
    );
  }
}

class NotificationService extends StateNotifier<NotificationState> {
  final FirebaseMessaging _messaging;
  final FlutterLocalNotificationsPlugin _localNotifications;
  final Ref _ref;

  StreamSubscription<RemoteMessage>? _foregroundSubscription;
  StreamSubscription<String>? _tokenRefreshSubscription;

  // Callback for handling notification taps
  void Function(NotificationPayload)? onNotificationTap;

  // Android notification channel
  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'plexo_ops_channel',
    'Plexo',
    description: 'Notificaciones de la aplicación Plexo',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  NotificationService(
    this._ref, {
    FirebaseMessaging? messaging,
    FlutterLocalNotificationsPlugin? localNotifications,
  })  : _messaging = messaging ?? FirebaseMessaging.instance,
        _localNotifications =
            localNotifications ?? FlutterLocalNotificationsPlugin(),
        super(const NotificationState());

  /// Initialize the notification service
  Future<void> initialize() async {
    if (state.isInitialized) return;

    try {
      // Set up background message handler
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Initialize local notifications
      await _initializeLocalNotifications();

      // Request permission
      final hasPermission = await _requestPermission();

      // Get FCM token
      String? token;
      if (hasPermission) {
        token = await _messaging.getToken();
        debugPrint('FCM Token: $token');
        if (token != null) {
          _registerTokenWithBackend(token);
        }
      }

      // Listen for foreground messages
      _foregroundSubscription =
          FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Listen for notification taps when app is in background
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Check for initial message (app opened from terminated state)
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }

      // Listen for token refresh
      _tokenRefreshSubscription =
          _messaging.onTokenRefresh.listen(_handleTokenRefresh);

      state = state.copyWith(
        isInitialized: true,
        hasPermission: hasPermission,
        fcmToken: token,
      );
    } catch (e) {
      debugPrint('Error initializing notifications: $e');
    }
  }

  /// Initialize local notifications plugin
  Future<void> _initializeLocalNotifications() async {
    // Android settings
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS settings
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onLocalNotificationTap,
    );

    // Create Android notification channel
    if (Platform.isAndroid) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);
    }
  }

  /// Request notification permission
  Future<bool> _requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
    );

    final authorized = settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;

    return authorized;
  }

  /// Handle foreground messages - show local notification
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    debugPrint('Foreground message received: ${message.messageId}');

    final notification = message.notification;
    final android = message.notification?.android;

    // Show local notification on Android
    if (notification != null && android != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            _channel.id,
            _channel.name,
            channelDescription: _channel.description,
            icon: android.smallIcon ?? '@mipmap/ic_launcher',
            importance: Importance.high,
            priority: Priority.high,
            color: const Color(0xFFE53935), // Red color for Plexo
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: jsonEncode(message.data),
      );
    }

    // Update state with last notification
    final payload = NotificationPayload.fromMap(message.data);
    state = state.copyWith(lastNotification: payload);
  }

  /// Handle notification tap from FCM
  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('Notification tapped: ${message.messageId}');
    final payload = NotificationPayload.fromMap(message.data);
    state = state.copyWith(lastNotification: payload);
    onNotificationTap?.call(payload);
  }

  /// Handle local notification tap
  void _onLocalNotificationTap(NotificationResponse response) {
    if (response.payload != null) {
      try {
        final data = jsonDecode(response.payload!) as Map<String, dynamic>;
        final payload = NotificationPayload.fromMap(data);
        onNotificationTap?.call(payload);
      } catch (e) {
        debugPrint('Error parsing notification payload: $e');
      }
    }
  }

  /// Handle token refresh
  void _handleTokenRefresh(String newToken) {
    debugPrint('FCM Token refreshed: $newToken');
    state = state.copyWith(fcmToken: newToken);
    // TODO: Send new token to backend
    _registerTokenWithBackend(newToken);
  }

  /// Register FCM token with backend
  Future<void> _registerTokenWithBackend(String token) async {
    try {
      final apiClient = _ref.read(apiClientProvider);
      await apiClient.post('/notifications/register-device', data: {
        'token': token,
        'platform': Platform.isIOS ? 'IOS' : 'ANDROID',
      });
      debugPrint('FCM token registered with backend');
    } catch (e) {
      debugPrint('Failed to register FCM token with backend: $e');
    }
  }

  /// Get current FCM token
  Future<String?> getToken() async {
    if (!state.hasPermission) return null;
    return await _messaging.getToken();
  }

  /// Subscribe to a topic
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
    debugPrint('Subscribed to topic: $topic');
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
    debugPrint('Unsubscribed from topic: $topic');
  }

  /// Subscribe to store-specific notifications
  Future<void> subscribeToStore(String storeId) async {
    await subscribeToTopic('store_$storeId');
  }

  /// Subscribe to role-based notifications
  Future<void> subscribeToRole(String role) async {
    await subscribeToTopic('role_$role');
  }

  /// Clear all subscriptions (on logout)
  Future<void> clearSubscriptions() async {
    // Topics will be managed by backend
    await _messaging.deleteToken();
    state = state.copyWith(fcmToken: null);
  }

  @override
  void dispose() {
    _foregroundSubscription?.cancel();
    _tokenRefreshSubscription?.cancel();
    super.dispose();
  }
}

// Provider
final notificationServiceProvider =
    StateNotifierProvider<NotificationService, NotificationState>((ref) {
  return NotificationService(ref);
});

// Convenience providers
final fcmTokenProvider = Provider<String?>((ref) {
  return ref.watch(notificationServiceProvider).fcmToken;
});

final hasNotificationPermissionProvider = Provider<bool>((ref) {
  return ref.watch(notificationServiceProvider).hasPermission;
});
