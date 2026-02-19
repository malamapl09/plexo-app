import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/database/app_database.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/core/services/connectivity_service.dart';
import 'package:plexo_ops/core/services/sync_service.dart';
import 'package:plexo_ops/features/tasks/data/models/task_model.dart';

class OfflineTaskRepository {
  final AppDatabase _db;
  final Ref _ref;

  OfflineTaskRepository(this._db, this._ref);

  bool get _isOnline => _ref.read(isOnlineProvider);
  SyncService get _syncService => _ref.read(syncServiceProvider.notifier);
  ApiClient get _api => _ref.read(apiClientProvider);

  /// Get all task assignments for a store
  /// Uses local cache, refreshes from API when online
  Future<List<TaskModel>> getTasksForStore(String storeId) async {
    // Always return from local cache first
    final localAssignments = await _db.getAssignmentsForStore(storeId);
    final localTasks = await _db.getAllTasks();

    final taskMap = {for (var t in localTasks) t.id: t};
    final models = <TaskModel>[];

    for (final assignment in localAssignments) {
      final task = taskMap[assignment.taskId];
      if (task != null) {
        models.add(_mapToTaskModel(task, assignment));
      }
    }

    // If online, trigger background refresh
    if (_isOnline) {
      _refreshTasksFromServer(storeId);
    }

    return models;
  }

  /// Refresh tasks from server (background)
  Future<void> _refreshTasksFromServer(String storeId) async {
    try {
      final response = await _api.get('/tasks', queryParameters: {
        'storeId': storeId,
        'limit': 100,
      });
      final data = response.data;
      final items = (data['data'] as List?) ?? (data is List ? data : []);
      if (items.isNotEmpty) {
        await cacheTasksFromServer(List<Map<String, dynamic>>.from(items));
      }
    } catch (e) {
      debugPrint('OfflineTaskRepository: background refresh failed: $e');
    }
  }

  /// Complete a task (offline-capable)
  Future<bool> completeTask({
    required String taskId,
    required String assignmentId,
    required String storeId,
    required String userId,
    required String userName,
    String? notes,
    List<String>? photoUrls,
  }) async {
    final now = DateTime.now();

    // Update local database immediately
    await _db.upsertAssignment(
      TaskAssignmentsCompanion(
        id: Value(assignmentId),
        taskId: Value(taskId),
        storeId: Value(storeId),
        status: const Value('COMPLETED'),
        completedAt: Value(now),
        completedById: Value(userId),
        completedByName: Value(userName),
        notes: Value(notes),
        photoUrls: Value(jsonEncode(photoUrls ?? [])),
        // Don't set syncedAt - marks it as unsynced
      ),
    );

    if (_isOnline) {
      // Try to sync immediately
      try {
        await _api.post('/tasks/$taskId/complete', data: {
          'notes': notes,
          'photoUrls': photoUrls ?? [],
        });

        // Mark as synced
        await _db.upsertAssignment(
          TaskAssignmentsCompanion(
            id: Value(assignmentId),
            syncedAt: Value(DateTime.now()),
          ),
        );

        return true;
      } catch (e) {
        // Failed to sync, queue for later
        await _queueForSync(
          entityType: 'task_assignment',
          entityId: assignmentId,
          operation: 'complete',
          payload: {
            'taskId': taskId,
            'storeId': storeId,
            'notes': notes,
            'photoUrls': photoUrls,
            'completedAt': now.toIso8601String(),
          },
        );
      }
    } else {
      // Offline - queue for later
      await _queueForSync(
        entityType: 'task_assignment',
        entityId: assignmentId,
        operation: 'complete',
        payload: {
          'taskId': taskId,
          'storeId': storeId,
          'notes': notes,
          'photoUrls': photoUrls,
          'completedAt': now.toIso8601String(),
        },
      );
    }

    return true;
  }

  /// Queue an operation for sync
  Future<void> _queueForSync({
    required String entityType,
    required String entityId,
    required String operation,
    required Map<String, dynamic> payload,
  }) async {
    await _syncService.queueOperation(
      entityType: entityType,
      entityId: entityId,
      operation: operation,
      payload: payload,
    );
  }

  /// Cache tasks from server response
  Future<void> cacheTasksFromServer(List<Map<String, dynamic>> tasksJson) async {
    final now = DateTime.now();

    final taskCompanions = <TasksCompanion>[];
    final assignmentCompanions = <TaskAssignmentsCompanion>[];

    for (final json in tasksJson) {
      taskCompanions.add(TasksCompanion(
        id: Value(json['id']),
        title: Value(json['title']),
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
        createdById: Value(json['createdById']),
        createdByName: Value(json['createdBy']?['name'] ?? ''),
        isRecurring: Value(json['isRecurring'] ?? false),
        createdAt: Value(DateTime.parse(json['createdAt'])),
        updatedAt: Value(DateTime.parse(json['updatedAt'])),
        syncedAt: Value(now),
      ));

      // Cache assignments
      final assignments = json['assignments'] as List? ?? [];
      for (final assignment in assignments) {
        assignmentCompanions.add(TaskAssignmentsCompanion(
          id: Value(assignment['id']),
          taskId: Value(json['id']),
          storeId: Value(assignment['storeId']),
          storeName: Value(assignment['store']?['name'] ?? ''),
          storeCode: Value(assignment['store']?['code'] ?? ''),
          status: Value(assignment['status'] ?? 'PENDING'),
          assignedAt: Value(DateTime.parse(assignment['assignedAt'])),
          completedAt: Value(assignment['completedAt'] != null
              ? DateTime.parse(assignment['completedAt'])
              : null),
          completedById: Value(assignment['completedById']),
          completedByName: Value(assignment['completedBy']?['name']),
          notes: Value(assignment['notes']),
          photoUrls: Value(jsonEncode(assignment['photoUrls'] ?? [])),
          syncedAt: Value(now),
        ));
      }
    }

    await _db.upsertTasks(taskCompanions);
    await _db.upsertAssignments(assignmentCompanions);

    // Update sync metadata
    await _db.updateSyncMetadata('tasks', now);
  }

  /// Map database entities to model
  TaskModel _mapToTaskModel(Task task, TaskAssignment assignment) {
    return TaskModel(
      id: task.id,
      title: task.title,
      description: task.description,
      department: task.departmentName != null
          ? DepartmentInfo(id: task.departmentId ?? '', name: task.departmentName!)
          : null,
      priority: _parsePriority(task.priority),
      scheduledTime: task.scheduledTime,
      dueTime: task.dueTime,
      status: _parseStatus(assignment.status),
      store: StoreInfo(
        id: assignment.storeId,
        name: assignment.storeName,
        code: assignment.storeCode,
      ),
      completedAt: assignment.completedAt,
      completedBy: assignment.completedByName != null
          ? UserInfo(id: assignment.completedById ?? '', name: assignment.completedByName!)
          : null,
      notes: assignment.notes,
      photoUrls: _parsePhotoUrls(assignment.photoUrls),
      isSynced: assignment.syncedAt != null,
    );
  }

  Priority _parsePriority(String value) {
    switch (value) {
      case 'HIGH':
        return Priority.high;
      case 'LOW':
        return Priority.low;
      default:
        return Priority.medium;
    }
  }

  TaskStatus _parseStatus(String value) {
    switch (value) {
      case 'IN_PROGRESS':
        return TaskStatus.inProgress;
      case 'COMPLETED':
        return TaskStatus.completed;
      case 'OVERDUE':
        return TaskStatus.overdue;
      default:
        return TaskStatus.pending;
    }
  }

  List<String> _parsePhotoUrls(String json) {
    try {
      return List<String>.from(jsonDecode(json));
    } catch (_) {
      return [];
    }
  }
}

// Provider for offline task repository
final offlineTaskRepositoryProvider = Provider<OfflineTaskRepository>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return OfflineTaskRepository(db, ref);
});
