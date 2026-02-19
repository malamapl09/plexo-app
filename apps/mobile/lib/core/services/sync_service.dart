import 'dart:async';
import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/database/app_database.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/core/services/connectivity_service.dart';

enum SyncStatus {
  idle,
  syncing,
  error,
  completed,
}

class SyncState {
  final SyncStatus status;
  final int pendingCount;
  final int syncedCount;
  final int failedCount;
  final String? lastError;
  final DateTime? lastSyncAt;
  final bool isSyncing;

  const SyncState({
    this.status = SyncStatus.idle,
    this.pendingCount = 0,
    this.syncedCount = 0,
    this.failedCount = 0,
    this.lastError,
    this.lastSyncAt,
    this.isSyncing = false,
  });

  bool get hasPendingOperations => pendingCount > 0;

  SyncState copyWith({
    SyncStatus? status,
    int? pendingCount,
    int? syncedCount,
    int? failedCount,
    String? lastError,
    DateTime? lastSyncAt,
    bool? isSyncing,
  }) {
    return SyncState(
      status: status ?? this.status,
      pendingCount: pendingCount ?? this.pendingCount,
      syncedCount: syncedCount ?? this.syncedCount,
      failedCount: failedCount ?? this.failedCount,
      lastError: lastError,
      lastSyncAt: lastSyncAt ?? this.lastSyncAt,
      isSyncing: isSyncing ?? this.isSyncing,
    );
  }
}

class SyncService extends StateNotifier<SyncState> {
  final AppDatabase _db;
  final Ref _ref;
  Timer? _syncTimer;
  bool _isProcessing = false;

  static const int maxRetries = 3;
  static const Duration syncInterval = Duration(minutes: 5);
  static const Duration retryDelay = Duration(seconds: 30);

  SyncService(this._db, this._ref) : super(const SyncState()) {
    _init();
  }

  void _init() {
    // Update pending count on init
    _updatePendingCount();

    // Start periodic sync timer
    _syncTimer = Timer.periodic(syncInterval, (_) => _trySync());

    // Listen for connectivity changes
    _ref.listen<ConnectivityState>(connectivityProvider, (previous, next) {
      if (previous?.isOffline == true && next.isOnline) {
        // Just came back online, trigger sync
        _trySync();
      }
    });
  }

  Future<void> _updatePendingCount() async {
    final count = await _db.getPendingSyncCount();
    state = state.copyWith(pendingCount: count);
  }

  /// Queue an operation for sync when offline
  Future<void> queueOperation({
    required String entityType,
    required String entityId,
    required String operation,
    required Map<String, dynamic> payload,
  }) async {
    await _db.addToSyncQueue(
      SyncQueueCompanion(
        entityType: Value(entityType),
        entityId: Value(entityId),
        operation: Value(operation),
        payload: Value(jsonEncode(payload)),
        createdAt: Value(DateTime.now()),
      ),
    );

    await _updatePendingCount();

    // Try to sync immediately if online
    final isOnline = _ref.read(isOnlineProvider);
    if (isOnline) {
      _trySync();
    }
  }

  /// Attempt to sync pending operations
  Future<void> _trySync() async {
    final isOnline = _ref.read(isOnlineProvider);
    if (!isOnline || _isProcessing) return;

    await syncNow();
  }

  /// Force sync now (called manually or when coming online)
  Future<bool> syncNow() async {
    if (_isProcessing) return false;

    _isProcessing = true;
    state = state.copyWith(
      status: SyncStatus.syncing,
      isSyncing: true,
      syncedCount: 0,
      failedCount: 0,
    );

    try {
      final pendingOps = await _db.getPendingSyncOperations();

      if (pendingOps.isEmpty) {
        state = state.copyWith(
          status: SyncStatus.completed,
          isSyncing: false,
          lastSyncAt: DateTime.now(),
        );
        _isProcessing = false;
        return true;
      }

      int synced = 0;
      int failed = 0;

      for (final op in pendingOps) {
        try {
          final success = await _processSyncOperation(op);
          if (success) {
            await _db.markSyncComplete(op.id);
            synced++;
          } else {
            await _db.incrementRetryCount(op.id, 'Sync failed');
            failed++;
          }
        } catch (e) {
          await _db.incrementRetryCount(op.id, e.toString());
          failed++;

          // If max retries exceeded, mark as complete to avoid infinite loops
          if (op.retryCount >= maxRetries) {
            await _db.markSyncComplete(op.id);
          }
        }

        state = state.copyWith(
          syncedCount: synced,
          failedCount: failed,
        );
      }

      await _updatePendingCount();

      state = state.copyWith(
        status: failed > 0 ? SyncStatus.error : SyncStatus.completed,
        isSyncing: false,
        lastSyncAt: DateTime.now(),
        lastError: failed > 0 ? '$failed operaciones fallaron' : null,
      );

      _isProcessing = false;
      return failed == 0;
    } catch (e) {
      state = state.copyWith(
        status: SyncStatus.error,
        isSyncing: false,
        lastError: e.toString(),
      );
      _isProcessing = false;
      return false;
    }
  }

  ApiClient get _api => _ref.read(apiClientProvider);

  /// Process a single sync operation
  Future<bool> _processSyncOperation(SyncQueueEntry op) async {
    final payload = jsonDecode(op.payload) as Map<String, dynamic>;

    switch (op.entityType) {
      case 'task':
        return await _syncTask(op.operation, op.entityId, payload);
      case 'task_assignment':
        return await _syncTaskAssignment(op.operation, op.entityId, payload);
      case 'receiving':
        return await _syncReceiving(op.operation, op.entityId, payload);
      case 'discrepancy':
        return await _syncDiscrepancy(op.operation, op.entityId, payload);
      case 'issue':
        return await _syncIssue(op.operation, op.entityId, payload);
      default:
        return false;
    }
  }

  Future<bool> _syncTask(
      String operation, String entityId, Map<String, dynamic> payload) async {
    switch (operation) {
      case 'update':
        await _api.patch('/tasks/$entityId', data: payload);
        return true;
      default:
        debugPrint('SyncService: Unknown task operation: $operation');
        return true;
    }
  }

  Future<bool> _syncTaskAssignment(
      String operation, String entityId, Map<String, dynamic> payload) async {
    switch (operation) {
      case 'complete':
        final taskId = payload['taskId'];
        await _api.post('/tasks/$taskId/complete', data: {
          'notes': payload['notes'],
          'photoUrls': payload['photoUrls'] ?? [],
        });
        return true;
      default:
        debugPrint('SyncService: Unknown task_assignment operation: $operation');
        return true;
    }
  }

  Future<bool> _syncReceiving(
      String operation, String entityId, Map<String, dynamic> payload) async {
    switch (operation) {
      case 'create':
        await _api.post('/receiving', data: payload);
        return true;
      case 'start':
        await _api.post('/receiving/$entityId/start');
        return true;
      case 'complete':
        await _api.post('/receiving/$entityId/complete', data: payload);
        return true;
      case 'did_not_arrive':
        await _api.post('/receiving/$entityId/did-not-arrive', data: {
          'notes': payload['notes'],
        });
        return true;
      case 'update':
        await _api.patch('/receiving/$entityId', data: payload);
        return true;
      default:
        debugPrint('SyncService: Unknown receiving operation: $operation');
        return true;
    }
  }

  Future<bool> _syncDiscrepancy(
      String operation, String entityId, Map<String, dynamic> payload) async {
    switch (operation) {
      case 'create':
        final receivingId = payload['receivingId'];
        await _api.post('/receiving/$receivingId/discrepancy', data: {
          'type': payload['type'],
          'productInfo': payload['productInfo'],
          'quantity': payload['quantity'],
          'notes': payload['notes'],
          'photoUrls': payload['photoUrls'] ?? [],
        });
        return true;
      default:
        debugPrint('SyncService: Unknown discrepancy operation: $operation');
        return true;
    }
  }

  Future<bool> _syncIssue(
      String operation, String entityId, Map<String, dynamic> payload) async {
    switch (operation) {
      case 'create':
        await _api.post('/issues', data: payload);
        return true;
      case 'start':
        await _api.post('/issues/$entityId/start');
        return true;
      case 'resolve':
        await _api.post('/issues/$entityId/resolve', data: {
          'resolutionNotes': payload['resolutionNotes'],
        });
        return true;
      default:
        debugPrint('SyncService: Unknown issue operation: $operation');
        return true;
    }
  }

  /// Pull latest data from server
  Future<void> pullFromServer() async {
    final isOnline = _ref.read(isOnlineProvider);
    if (!isOnline) return;

    state = state.copyWith(isSyncing: true, status: SyncStatus.syncing);

    try {
      // Pull tasks
      await _pullTasks();
      // Pull receivings
      await _pullReceivings();
      // Pull issues
      await _pullIssues();

      state = state.copyWith(
        isSyncing: false,
        status: SyncStatus.completed,
        lastSyncAt: DateTime.now(),
      );
    } catch (e) {
      debugPrint('SyncService pullFromServer error: $e');
      state = state.copyWith(
        isSyncing: false,
        status: SyncStatus.error,
        lastError: e.toString(),
      );
    }
  }

  Future<void> _pullTasks() async {
    try {
      final response = await _api.get('/tasks', queryParameters: {
        'limit': 100,
      });
      final data = response.data;
      final items = (data['data'] as List?) ?? (data is List ? data : []);
      if (items.isNotEmpty) {
        final now = DateTime.now();
        final taskCompanions = <TasksCompanion>[];
        final assignmentCompanions = <TaskAssignmentsCompanion>[];

        for (final json in items) {
          taskCompanions.add(TasksCompanion(
            id: Value(json['id']),
            title: Value(json['title'] ?? ''),
            description: Value(json['description']),
            departmentId: Value(json['departmentId']),
            departmentName: Value(json['department']?['name']),
            priority: Value(json['priority'] ?? 'MEDIUM'),
            scheduledTime: Value(json['scheduledTime'] != null
                ? DateTime.parse(json['scheduledTime'])
                : null),
            dueTime: Value(json['dueTime'] != null
                ? DateTime.parse(json['dueTime'])
                : null),
            createdById: Value(json['createdById'] ?? ''),
            createdByName: Value(json['createdBy']?['name'] ?? ''),
            isRecurring: Value(json['isRecurring'] ?? false),
            createdAt: Value(DateTime.parse(json['createdAt'])),
            updatedAt: Value(DateTime.parse(json['updatedAt'])),
            syncedAt: Value(now),
          ));

          final assignments = json['assignments'] as List? ?? [];
          for (final a in assignments) {
            assignmentCompanions.add(TaskAssignmentsCompanion(
              id: Value(a['id']),
              taskId: Value(json['id']),
              storeId: Value(a['storeId'] ?? ''),
              storeName: Value(a['store']?['name'] ?? ''),
              storeCode: Value(a['store']?['code'] ?? ''),
              status: Value(a['status'] ?? 'PENDING'),
              assignedAt: Value(DateTime.parse(a['assignedAt'])),
              completedAt: Value(a['completedAt'] != null
                  ? DateTime.parse(a['completedAt'])
                  : null),
              completedById: Value(a['completedById']),
              completedByName: Value(a['completedBy']?['name']),
              notes: Value(a['notes']),
              photoUrls: Value(jsonEncode(a['photoUrls'] ?? [])),
              syncedAt: Value(now),
            ));
          }
        }

        await _db.upsertTasks(taskCompanions);
        if (assignmentCompanions.isNotEmpty) {
          await _db.upsertAssignments(assignmentCompanions);
        }
        await _db.updateSyncMetadata('tasks', now);
      }
    } catch (e) {
      debugPrint('SyncService _pullTasks error: $e');
    }
  }

  Future<void> _pullReceivings() async {
    try {
      final response = await _api.get('/receiving', queryParameters: {
        'limit': 100,
      });
      final data = response.data;
      final items = (data['data'] as List?) ?? (data is List ? data : []);
      if (items.isNotEmpty) {
        final now = DateTime.now();
        final companions = <ReceivingsCompanion>[];

        for (final json in items) {
          companions.add(ReceivingsCompanion(
            id: Value(json['id']),
            storeId: Value(json['storeId'] ?? ''),
            storeName: Value(json['store']?['name'] ?? ''),
            storeCode: Value(json['store']?['code'] ?? ''),
            supplierType: Value(json['supplierType'] ?? ''),
            supplierName: Value(json['supplierName'] ?? ''),
            poNumber: Value(json['poNumber']),
            scheduledTime: Value(json['scheduledTime'] != null
                ? DateTime.parse(json['scheduledTime'])
                : null),
            arrivalTime: Value(json['arrivalTime'] != null
                ? DateTime.parse(json['arrivalTime'])
                : null),
            status: Value(json['status'] ?? 'PENDING'),
            verifiedById: Value(json['verifiedById']),
            notes: Value(json['notes']),
            photoUrls: Value(jsonEncode(json['photoUrls'] ?? [])),
            signatureUrl: Value(json['signatureUrl']),
            driverName: Value(json['driverName']),
            truckPlate: Value(json['truckPlate']),
            itemCount: Value(json['itemCount']),
            discrepancyCount: Value(json['discrepancyCount'] ?? 0),
            createdAt: Value(DateTime.parse(json['createdAt'])),
            updatedAt: Value(DateTime.parse(json['updatedAt'])),
            syncedAt: Value(now),
          ));
        }

        await _db.upsertReceivings(companions);
        await _db.updateSyncMetadata('receivings', now);
      }
    } catch (e) {
      debugPrint('SyncService _pullReceivings error: $e');
    }
  }

  Future<void> _pullIssues() async {
    try {
      final response = await _api.get('/issues', queryParameters: {
        'limit': 100,
      });
      final data = response.data;
      final items = (data['data'] as List?) ?? (data is List ? data : []);
      if (items.isNotEmpty) {
        final now = DateTime.now();
        final companions = <IssuesCompanion>[];

        for (final json in items) {
          companions.add(IssuesCompanion(
            id: Value(json['id']),
            storeId: Value(json['storeId'] ?? ''),
            storeName: Value(json['store']?['name'] ?? ''),
            storeCode: Value(json['store']?['code'] ?? ''),
            category: Value(json['category'] ?? ''),
            priority: Value(json['priority'] ?? 'MEDIUM'),
            title: Value(json['title'] ?? ''),
            description: Value(json['description'] ?? ''),
            status: Value(json['status'] ?? 'REPORTED'),
            reportedById: Value(json['reportedById'] ?? ''),
            reportedByName: Value(json['reportedBy']?['name'] ?? ''),
            assignedToId: Value(json['assignedToId']),
            assignedToName: Value(json['assignedTo']?['name']),
            photoUrls: Value(jsonEncode(json['photoUrls'] ?? [])),
            resolutionNotes: Value(json['resolutionNotes']),
            resolvedAt: Value(json['resolvedAt'] != null
                ? DateTime.parse(json['resolvedAt'])
                : null),
            escalatedAt: Value(json['escalatedAt'] != null
                ? DateTime.parse(json['escalatedAt'])
                : null),
            isEscalated: Value(json['escalatedAt'] != null),
            createdAt: Value(DateTime.parse(json['createdAt'])),
            updatedAt: Value(DateTime.parse(json['updatedAt'])),
            syncedAt: Value(now),
          ));
        }

        await _db.upsertIssues(companions);
        await _db.updateSyncMetadata('issues', now);
      }
    } catch (e) {
      debugPrint('SyncService _pullIssues error: $e');
    }
  }

  /// Full sync: push pending, then pull
  Future<void> fullSync() async {
    await syncNow();
    await pullFromServer();
    await _updatePendingCount();
  }

  /// Clear completed sync operations older than specified duration
  Future<void> cleanupOldOperations({Duration maxAge = const Duration(days: 7)}) async {
    await _db.clearOldSyncOperations(maxAge);
    await _updatePendingCount();
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    super.dispose();
  }
}

// Database provider
final appDatabaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(() => db.close());
  return db;
});

// Sync service provider
final syncServiceProvider =
    StateNotifierProvider<SyncService, SyncState>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return SyncService(db, ref);
});

// Convenience providers
final pendingSyncCountProvider = Provider<int>((ref) {
  return ref.watch(syncServiceProvider).pendingCount;
});

final isSyncingProvider = Provider<bool>((ref) {
  return ref.watch(syncServiceProvider).isSyncing;
});

final hasPendingSyncProvider = Provider<bool>((ref) {
  return ref.watch(syncServiceProvider).hasPendingOperations;
});
