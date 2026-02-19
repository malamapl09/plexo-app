import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

import 'tables.dart';

part 'app_database.g.dart';

@DriftDatabase(tables: [
  Tasks,
  TaskAssignments,
  Receivings,
  Discrepancies,
  Issues,
  SyncQueue,
  CachedUsers,
  CachedStores,
  SyncMetadata,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
      },
      onUpgrade: (Migrator m, int from, int to) async {
        // Recreate all tables for dev — local DB is a cache
        // v3: added organizationId to Tasks, TaskAssignments, Receivings, Issues
        for (final table in allTables) {
          await m.deleteTable(table.actualTableName);
        }
        await m.createAll();
      },
    );
  }

  // ============================================
  // TASK OPERATIONS
  // ============================================

  Future<List<Task>> getAllTasks() => select(tasks).get();

  Future<Task?> getTaskById(String id) =>
      (select(tasks)..where((t) => t.id.equals(id))).getSingleOrNull();

  Future<void> upsertTask(TasksCompanion task) =>
      into(tasks).insertOnConflictUpdate(task);

  Future<void> upsertTasks(List<TasksCompanion> taskList) async {
    await batch((batch) {
      for (final task in taskList) {
        batch.insert(tasks, task, onConflict: DoUpdate((_) => task));
      }
    });
  }

  Future<int> deleteTask(String id) =>
      (delete(tasks)..where((t) => t.id.equals(id))).go();

  // ============================================
  // TASK ASSIGNMENT OPERATIONS
  // ============================================

  Future<List<TaskAssignment>> getAssignmentsForStore(String storeId) =>
      (select(taskAssignments)..where((a) => a.storeId.equals(storeId))).get();

  Future<List<TaskAssignment>> getAssignmentsForTask(String taskId) =>
      (select(taskAssignments)..where((a) => a.taskId.equals(taskId))).get();

  Future<void> upsertAssignment(TaskAssignmentsCompanion assignment) =>
      into(taskAssignments).insertOnConflictUpdate(assignment);

  Future<void> upsertAssignments(List<TaskAssignmentsCompanion> assignmentList) async {
    await batch((batch) {
      for (final assignment in assignmentList) {
        batch.insert(taskAssignments, assignment,
            onConflict: DoUpdate((_) => assignment));
      }
    });
  }

  // ============================================
  // RECEIVING OPERATIONS
  // ============================================

  Future<List<Receiving>> getAllReceivings() => select(receivings).get();

  Future<List<Receiving>> getReceivingsForStore(String storeId) =>
      (select(receivings)..where((r) => r.storeId.equals(storeId))).get();

  Future<List<Receiving>> getTodayReceivings(String storeId) {
    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day);
    final endOfDay = startOfDay.add(const Duration(days: 1));

    return (select(receivings)
          ..where((r) =>
              r.storeId.equals(storeId) &
              r.createdAt.isBiggerOrEqualValue(startOfDay) &
              r.createdAt.isSmallerThanValue(endOfDay)))
        .get();
  }

  Future<Receiving?> getReceivingById(String id) =>
      (select(receivings)..where((r) => r.id.equals(id))).getSingleOrNull();

  Future<void> upsertReceiving(ReceivingsCompanion receiving) =>
      into(receivings).insertOnConflictUpdate(receiving);

  Future<void> upsertReceivings(List<ReceivingsCompanion> receivingList) async {
    await batch((batch) {
      for (final receiving in receivingList) {
        batch.insert(receivings, receiving,
            onConflict: DoUpdate((_) => receiving));
      }
    });
  }

  // ============================================
  // DISCREPANCY OPERATIONS
  // ============================================

  Future<List<Discrepancy>> getDiscrepanciesForReceiving(String receivingId) =>
      (select(discrepancies)..where((d) => d.receivingId.equals(receivingId)))
          .get();

  Future<void> upsertDiscrepancy(DiscrepanciesCompanion discrepancy) =>
      into(discrepancies).insertOnConflictUpdate(discrepancy);

  // ============================================
  // ISSUE OPERATIONS
  // ============================================

  Future<List<Issue>> getAllIssues() => select(issues).get();

  Future<List<Issue>> getIssuesForStore(String storeId) =>
      (select(issues)..where((i) => i.storeId.equals(storeId))).get();

  Future<List<Issue>> getOpenIssues() => (select(issues)
        ..where((i) => i.status.isNotIn(['RESOLVED'])))
      .get();

  Future<List<Issue>> getMyReportedIssues(String userId) =>
      (select(issues)..where((i) => i.reportedById.equals(userId))).get();

  Future<Issue?> getIssueById(String id) =>
      (select(issues)..where((i) => i.id.equals(id))).getSingleOrNull();

  Future<void> upsertIssue(IssuesCompanion issue) =>
      into(issues).insertOnConflictUpdate(issue);

  Future<int> deleteIssue(String id) =>
      (delete(issues)..where((i) => i.id.equals(id))).go();

  Future<void> upsertIssues(List<IssuesCompanion> issueList) async {
    await batch((batch) {
      for (final issue in issueList) {
        batch.insert(issues, issue, onConflict: DoUpdate((_) => issue));
      }
    });
  }

  // ============================================
  // SYNC QUEUE OPERATIONS
  // ============================================

  Future<List<SyncQueueEntry>> getPendingSyncOperations() =>
      (select(syncQueue)
            ..where((s) => s.isPending.equals(true))
            ..orderBy([(s) => OrderingTerm.asc(s.createdAt)]))
          .get();

  Future<int> getPendingSyncCount() async {
    final count = syncQueue.id.count();
    final query = selectOnly(syncQueue)
      ..addColumns([count])
      ..where(syncQueue.isPending.equals(true));
    final result = await query.getSingle();
    return result.read(count) ?? 0;
  }

  Future<int> addToSyncQueue(SyncQueueCompanion entry) =>
      into(syncQueue).insert(entry);

  Future<void> markSyncComplete(int id) =>
      (update(syncQueue)..where((s) => s.id.equals(id)))
          .write(const SyncQueueCompanion(isPending: Value(false)));

  Future<void> incrementRetryCount(int id, String? errorMessage) async {
    final entry = await (select(syncQueue)..where((s) => s.id.equals(id))).getSingleOrNull();
    if (entry == null) return;

    await (update(syncQueue)..where((s) => s.id.equals(id))).write(
      SyncQueueCompanion(
        retryCount: Value(entry.retryCount + 1),
        errorMessage: Value(errorMessage),
        lastAttemptAt: Value(DateTime.now()),
      ),
    );
  }

  Future<int> clearCompletedSyncOperations() =>
      (delete(syncQueue)..where((s) => s.isPending.equals(false))).go();

  Future<int> clearOldSyncOperations(Duration maxAge) {
    final cutoff = DateTime.now().subtract(maxAge);
    return (delete(syncQueue)
          ..where((s) =>
              s.isPending.equals(false) & s.createdAt.isSmallerThanValue(cutoff)))
        .go();
  }

  // ============================================
  // CACHED USER OPERATIONS
  // ============================================

  Future<List<CachedUser>> getAllCachedUsers() => select(cachedUsers).get();

  Future<CachedUser?> getCachedUserById(String id) =>
      (select(cachedUsers)..where((u) => u.id.equals(id))).getSingleOrNull();

  Future<void> upsertCachedUser(CachedUsersCompanion user) =>
      into(cachedUsers).insertOnConflictUpdate(user);

  // ============================================
  // CACHED STORE OPERATIONS
  // ============================================

  Future<List<CachedStore>> getAllCachedStores() => select(cachedStores).get();

  Future<CachedStore?> getCachedStoreById(String id) =>
      (select(cachedStores)..where((s) => s.id.equals(id))).getSingleOrNull();

  Future<void> upsertCachedStore(CachedStoresCompanion store) =>
      into(cachedStores).insertOnConflictUpdate(store);

  // ============================================
  // SYNC METADATA OPERATIONS
  // ============================================

  Future<SyncMetadataData?> getSyncMetadata(String entityType) =>
      (select(syncMetadata)..where((m) => m.entityType.equals(entityType)))
          .getSingleOrNull();

  Future<void> updateSyncMetadata(
    String entityType,
    DateTime lastSyncAt, {
    String? cursor,
  }) =>
      into(syncMetadata).insertOnConflictUpdate(
        SyncMetadataCompanion(
          entityType: Value(entityType),
          lastSyncAt: Value(lastSyncAt),
          lastSyncCursor: Value(cursor),
        ),
      );

  // ============================================
  // CLEAR ALL DATA
  // ============================================

  Future<void> clearAllData() async {
    await delete(taskAssignments).go();
    await delete(tasks).go();
    await delete(discrepancies).go();
    await delete(receivings).go();
    await delete(issues).go();
    await delete(syncQueue).go();
    await delete(cachedUsers).go();
    await delete(cachedStores).go();
    await delete(syncMetadata).go();
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'plexo_ops.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
