import 'dart:convert';

import 'package:drift/drift.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/database/app_database.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/core/services/connectivity_service.dart';
import 'package:plexo_ops/core/services/sync_service.dart';
import 'package:plexo_ops/features/issues/data/models/issue_model.dart';
import 'package:uuid/uuid.dart';

class OfflineIssueRepository {
  final AppDatabase _db;
  final Ref _ref;
  final Uuid _uuid = const Uuid();

  OfflineIssueRepository(this._db, this._ref);

  bool get _isOnline => _ref.read(isOnlineProvider);
  SyncService get _syncService => _ref.read(syncServiceProvider.notifier);
  ApiClient get _api => _ref.read(apiClientProvider);

  /// Get all issues for a store
  Future<List<IssueModel>> getIssuesForStore(String storeId) async {
    final localIssues = await _db.getIssuesForStore(storeId);

    if (_isOnline) {
      _refreshIssuesFromServer(storeId);
    }

    return localIssues.map(_mapToIssueModel).toList();
  }

  /// Get all open issues
  Future<List<IssueModel>> getOpenIssues() async {
    final localIssues = await _db.getOpenIssues();
    return localIssues.map(_mapToIssueModel).toList();
  }

  /// Get issues reported by user
  Future<List<IssueModel>> getMyReportedIssues(String userId) async {
    final localIssues = await _db.getMyReportedIssues(userId);
    return localIssues.map(_mapToIssueModel).toList();
  }

  /// Refresh issues from server
  Future<void> _refreshIssuesFromServer(String storeId) async {
    try {
      final response = await _api.get('/issues', queryParameters: {
        'storeId': storeId,
        'limit': 100,
      });
      final data = response.data;
      final items = (data['data'] as List?) ?? (data is List ? data : []);
      if (items.isNotEmpty) {
        await cacheIssuesFromServer(List<Map<String, dynamic>>.from(items));
      }
    } catch (e) {
      debugPrint('OfflineIssueRepository: background refresh failed: $e');
    }
  }

  /// Create a new issue (offline-capable)
  Future<IssueModel?> createIssue({
    required String storeId,
    required String storeName,
    required String storeCode,
    required IssueCategory category,
    required Priority priority,
    required String title,
    required String description,
    required String reportedById,
    required String reportedByName,
    List<String>? photoUrls,
  }) async {
    final now = DateTime.now();
    final id = _uuid.v4();

    // Create locally first
    final companion = IssuesCompanion(
      id: Value(id),
      storeId: Value(storeId),
      storeName: Value(storeName),
      storeCode: Value(storeCode),
      category: Value(_categoryToString(category)),
      priority: Value(_priorityToString(priority)),
      title: Value(title),
      description: Value(description),
      status: const Value('REPORTED'),
      reportedById: Value(reportedById),
      reportedByName: Value(reportedByName),
      photoUrls: Value(jsonEncode(photoUrls ?? [])),
      isEscalated: const Value(false),
      createdAt: Value(now),
      updatedAt: Value(now),
      // No syncedAt - marks as unsynced
    );

    await _db.upsertIssue(companion);

    if (_isOnline) {
      try {
        final response = await _api.post('/issues', data: {
          'storeId': storeId,
          'category': _categoryToString(category),
          'priority': _priorityToString(priority),
          'title': title,
          'description': description,
          'photoUrls': photoUrls ?? [],
        });

        // Update local record with server-assigned ID and mark as synced
        final serverId = response.data?['id'];
        if (serverId != null && serverId != id) {
          await _db.deleteIssue(id);
          await _db.upsertIssue(IssuesCompanion(
            id: Value(serverId),
            storeId: Value(storeId),
            storeName: Value(storeName),
            storeCode: Value(storeCode),
            category: Value(_categoryToString(category)),
            priority: Value(_priorityToString(priority)),
            title: Value(title),
            description: Value(description),
            status: Value(response.data?['status'] ?? 'REPORTED'),
            reportedById: Value(reportedById),
            reportedByName: Value(reportedByName),
            assignedToId: Value(response.data?['assignedToId']),
            assignedToName: Value(response.data?['assignedTo']?['name']),
            photoUrls: Value(jsonEncode(photoUrls ?? [])),
            isEscalated: const Value(false),
            createdAt: Value(now),
            updatedAt: Value(now),
            syncedAt: Value(DateTime.now()),
          ));
        } else {
          await _db.upsertIssue(IssuesCompanion(
            id: Value(id),
            syncedAt: Value(DateTime.now()),
          ));
        }
      } catch (e) {
        await _queueForSync(
          entityType: 'issue',
          entityId: id,
          operation: 'create',
          payload: {
            'storeId': storeId,
            'category': _categoryToString(category),
            'priority': _priorityToString(priority),
            'title': title,
            'description': description,
            'photoUrls': photoUrls,
          },
        );
      }
    } else {
      await _queueForSync(
        entityType: 'issue',
        entityId: id,
        operation: 'create',
        payload: {
          'storeId': storeId,
          'category': _categoryToString(category),
          'priority': _priorityToString(priority),
          'title': title,
          'description': description,
          'photoUrls': photoUrls,
        },
      );
    }

    final issue = await _db.getIssueById(id);
    return issue != null ? _mapToIssueModel(issue) : null;
  }

  /// Start working on an issue
  Future<bool> startProgress(String issueId, String userId) async {
    final now = DateTime.now();

    await _db.upsertIssue(IssuesCompanion(
      id: Value(issueId),
      status: const Value('IN_PROGRESS'),
      updatedAt: Value(now),
    ));

    if (_isOnline) {
      try {
        await _api.post('/issues/$issueId/start');
        await _db.upsertIssue(IssuesCompanion(
          id: Value(issueId),
          syncedAt: Value(DateTime.now()),
        ));
      } catch (e) {
        await _queueForSync(
          entityType: 'issue',
          entityId: issueId,
          operation: 'start',
          payload: {'userId': userId},
        );
      }
    } else {
      await _queueForSync(
        entityType: 'issue',
        entityId: issueId,
        operation: 'start',
        payload: {'userId': userId},
      );
    }

    return true;
  }

  /// Resolve an issue
  Future<bool> resolveIssue(
    String issueId,
    String resolutionNotes,
    String userId,
  ) async {
    final now = DateTime.now();

    await _db.upsertIssue(IssuesCompanion(
      id: Value(issueId),
      status: const Value('RESOLVED'),
      resolutionNotes: Value(resolutionNotes),
      resolvedAt: Value(now),
      updatedAt: Value(now),
    ));

    if (_isOnline) {
      try {
        await _api.post('/issues/$issueId/resolve', data: {
          'resolutionNotes': resolutionNotes,
        });
        await _db.upsertIssue(IssuesCompanion(
          id: Value(issueId),
          syncedAt: Value(DateTime.now()),
        ));
      } catch (e) {
        await _queueForSync(
          entityType: 'issue',
          entityId: issueId,
          operation: 'resolve',
          payload: {
            'resolutionNotes': resolutionNotes,
            'userId': userId,
          },
        );
      }
    } else {
      await _queueForSync(
        entityType: 'issue',
        entityId: issueId,
        operation: 'resolve',
        payload: {
          'resolutionNotes': resolutionNotes,
          'userId': userId,
        },
      );
    }

    return true;
  }

  /// Queue for sync
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

  /// Cache issues from server
  Future<void> cacheIssuesFromServer(List<Map<String, dynamic>> issuesJson) async {
    final now = DateTime.now();
    final companions = <IssuesCompanion>[];

    for (final json in issuesJson) {
      companions.add(IssuesCompanion(
        id: Value(json['id']),
        storeId: Value(json['storeId']),
        storeName: Value(json['store']?['name'] ?? ''),
        storeCode: Value(json['store']?['code'] ?? ''),
        category: Value(json['category']),
        priority: Value(json['priority']),
        title: Value(json['title']),
        description: Value(json['description']),
        status: Value(json['status']),
        reportedById: Value(json['reportedById']),
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
        isEscalated: Value(json['isEscalated'] ?? false),
        createdAt: Value(DateTime.parse(json['createdAt'])),
        updatedAt: Value(DateTime.parse(json['updatedAt'])),
        syncedAt: Value(now),
      ));
    }

    await _db.upsertIssues(companions);
    await _db.updateSyncMetadata('issues', now);
  }

  /// Map database entity to model
  IssueModel _mapToIssueModel(Issue issue) {
    return IssueModel(
      id: issue.id,
      storeId: issue.storeId,
      store: StoreInfo(
        id: issue.storeId,
        name: issue.storeName,
        code: issue.storeCode,
      ),
      category: _parseCategory(issue.category),
      priority: _parsePriority(issue.priority),
      title: issue.title,
      description: issue.description,
      status: _parseStatus(issue.status),
      reportedBy: UserInfo(
        id: issue.reportedById,
        name: issue.reportedByName,
      ),
      assignedTo: issue.assignedToId != null
          ? UserInfo(id: issue.assignedToId!, name: issue.assignedToName ?? '')
          : null,
      photoUrls: _parsePhotoUrls(issue.photoUrls),
      resolutionNotes: issue.resolutionNotes,
      resolvedAt: issue.resolvedAt,
      escalatedAt: issue.escalatedAt,
      isEscalated: issue.isEscalated,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    );
  }

  IssueCategory _parseCategory(String value) {
    switch (value) {
      case 'MAINTENANCE':
        return IssueCategory.maintenance;
      case 'CLEANING':
        return IssueCategory.cleaning;
      case 'SECURITY':
        return IssueCategory.security;
      case 'IT_SYSTEMS':
        return IssueCategory.itSystems;
      case 'PERSONNEL':
        return IssueCategory.personnel;
      case 'INVENTORY':
        return IssueCategory.inventory;
      default:
        return IssueCategory.maintenance;
    }
  }

  String _categoryToString(IssueCategory category) {
    switch (category) {
      case IssueCategory.maintenance:
        return 'MAINTENANCE';
      case IssueCategory.cleaning:
        return 'CLEANING';
      case IssueCategory.security:
        return 'SECURITY';
      case IssueCategory.itSystems:
        return 'IT_SYSTEMS';
      case IssueCategory.personnel:
        return 'PERSONNEL';
      case IssueCategory.inventory:
        return 'INVENTORY';
    }
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

  String _priorityToString(Priority priority) {
    switch (priority) {
      case Priority.low:
        return 'LOW';
      case Priority.medium:
        return 'MEDIUM';
      case Priority.high:
        return 'HIGH';
    }
  }

  IssueStatus _parseStatus(String value) {
    switch (value) {
      case 'REPORTED':
        return IssueStatus.reported;
      case 'ASSIGNED':
        return IssueStatus.assigned;
      case 'IN_PROGRESS':
        return IssueStatus.inProgress;
      case 'RESOLVED':
        return IssueStatus.resolved;
      default:
        return IssueStatus.reported;
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

// Provider
final offlineIssueRepositoryProvider = Provider<OfflineIssueRepository>((ref) {
  final db = ref.watch(appDatabaseProvider);
  return OfflineIssueRepository(db, ref);
});
