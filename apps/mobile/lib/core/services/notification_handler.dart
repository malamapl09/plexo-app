import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plexo_ops/core/services/notification_service.dart';

/// Handles notification routing and actions
class NotificationHandler {
  final Ref _ref;
  final GlobalKey<NavigatorState> navigatorKey;

  NotificationHandler(this._ref, this.navigatorKey);

  /// Initialize handler and set up callbacks
  void initialize() {
    final notificationService = _ref.read(notificationServiceProvider.notifier);
    notificationService.onNotificationTap = _handleNotificationTap;
  }

  /// Handle notification tap and navigate to appropriate screen
  void _handleNotificationTap(NotificationPayload payload) {
    final context = navigatorKey.currentContext;
    if (context == null) return;

    switch (payload.type) {
      case NotificationType.taskOverdue:
      case NotificationType.taskAssigned:
        _navigateToTask(context, payload);
        break;

      case NotificationType.issueReported:
      case NotificationType.issueAssigned:
      case NotificationType.issueEscalated:
      case NotificationType.issueResolved:
        _navigateToIssue(context, payload);
        break;

      case NotificationType.receivingScheduled:
      case NotificationType.receivingArrived:
        _navigateToReceiving(context, payload);
        break;

      case NotificationType.general:
      default:
        // Just go to home
        context.go('/');
        break;
    }
  }

  void _navigateToTask(BuildContext context, NotificationPayload payload) {
    // Navigate to tasks tab
    context.go('/');

    // If we have a specific task ID, we could show a detail sheet
    // final taskId = payload.entityId;
    // if (taskId != null) {
    //   // Show task detail
    // }
  }

  void _navigateToIssue(BuildContext context, NotificationPayload payload) {
    // Navigate to issues tab
    context.go('/issues');

    // If we have a specific issue ID, we could show detail
    // final issueId = payload.entityId;
  }

  void _navigateToReceiving(BuildContext context, NotificationPayload payload) {
    // Navigate to receiving tab
    context.go('/receiving');

    // If we have a specific receiving ID, we could show detail
    // final receivingId = payload.entityId;
  }
}

/// Widget that initializes notification handling
class NotificationHandlerWidget extends ConsumerStatefulWidget {
  final Widget child;
  final GlobalKey<NavigatorState> navigatorKey;

  const NotificationHandlerWidget({
    super.key,
    required this.child,
    required this.navigatorKey,
  });

  @override
  ConsumerState<NotificationHandlerWidget> createState() =>
      _NotificationHandlerWidgetState();
}

class _NotificationHandlerWidgetState
    extends ConsumerState<NotificationHandlerWidget> {
  late NotificationHandler _handler;

  @override
  void initState() {
    super.initState();
    _handler = NotificationHandler(ref, widget.navigatorKey);

    // Initialize notifications after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeNotifications();
    });
  }

  Future<void> _initializeNotifications() async {
    // Initialize the notification service
    await ref.read(notificationServiceProvider.notifier).initialize();

    // Set up the handler
    _handler.initialize();

    // Subscribe to relevant topics based on user
    _subscribeToTopics();
  }

  Future<void> _subscribeToTopics() async {
    final notificationService = ref.read(notificationServiceProvider.notifier);

    // TODO: Get user info and subscribe to relevant topics
    // final user = ref.read(authStateProvider).user;
    // if (user != null) {
    //   await notificationService.subscribeToStore(user.storeId);
    //   await notificationService.subscribeToRole(user.role);
    // }
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

/// Extension for easy notification subscription management
extension NotificationSubscriptionExtension on NotificationService {
  /// Subscribe user to all relevant topics
  Future<void> subscribeUserTopics({
    required String userId,
    required String role,
    String? storeId,
    String? regionId,
  }) async {
    // Subscribe to user-specific topic
    await subscribeToTopic('user_$userId');

    // Subscribe to role topic
    await subscribeToTopic('role_$role');

    // Subscribe to store topic if applicable
    if (storeId != null) {
      await subscribeToTopic('store_$storeId');
    }

    // Subscribe to region topic if applicable
    if (regionId != null) {
      await subscribeToTopic('region_$regionId');
    }

    // Subscribe to general announcements
    await subscribeToTopic('announcements');
  }

  /// Unsubscribe user from all topics (on logout)
  Future<void> unsubscribeUserTopics({
    required String userId,
    required String role,
    String? storeId,
    String? regionId,
  }) async {
    await unsubscribeFromTopic('user_$userId');
    await unsubscribeFromTopic('role_$role');

    if (storeId != null) {
      await unsubscribeFromTopic('store_$storeId');
    }

    if (regionId != null) {
      await unsubscribeFromTopic('region_$regionId');
    }

    await unsubscribeFromTopic('announcements');
  }
}
