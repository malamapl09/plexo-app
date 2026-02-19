import 'package:drift/drift.dart';

// ============================================
// TASKS TABLES
// ============================================

class Tasks extends Table {
  TextColumn get id => text()();
  TextColumn get organizationId => text()();
  TextColumn get title => text()();
  TextColumn get description => text().nullable()();
  TextColumn get departmentId => text().nullable()();
  TextColumn get departmentName => text().nullable()();
  TextColumn get priority => text().withDefault(const Constant('MEDIUM'))();
  DateTimeColumn get scheduledTime => dateTime().nullable()();
  DateTimeColumn get dueTime => dateTime().nullable()();
  TextColumn get createdById => text()();
  TextColumn get createdByName => text()();
  BoolColumn get isRecurring => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get syncedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class TaskAssignments extends Table {
  TextColumn get id => text()();
  TextColumn get organizationId => text()();
  TextColumn get taskId => text().references(Tasks, #id)();
  TextColumn get storeId => text()();
  TextColumn get storeName => text()();
  TextColumn get storeCode => text()();
  TextColumn get status => text().withDefault(const Constant('PENDING'))();
  DateTimeColumn get assignedAt => dateTime()();
  DateTimeColumn get completedAt => dateTime().nullable()();
  TextColumn get completedById => text().nullable()();
  TextColumn get completedByName => text().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get photoUrls => text().withDefault(const Constant('[]'))(); // JSON array
  DateTimeColumn get syncedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

// ============================================
// RECEIVING TABLES
// ============================================

class Receivings extends Table {
  TextColumn get id => text()();
  TextColumn get organizationId => text()();
  TextColumn get storeId => text()();
  TextColumn get storeName => text()();
  TextColumn get storeCode => text()();
  TextColumn get supplierType => text()();
  TextColumn get supplierName => text()();
  TextColumn get poNumber => text().nullable()();
  DateTimeColumn get scheduledTime => dateTime().nullable()();
  DateTimeColumn get arrivalTime => dateTime().nullable()();
  TextColumn get status => text().withDefault(const Constant('PENDING'))();
  TextColumn get verifiedById => text().nullable()();
  TextColumn get verifiedByName => text().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get photoUrls => text().withDefault(const Constant('[]'))(); // JSON array
  TextColumn get signatureUrl => text().nullable()();
  TextColumn get driverName => text().nullable()();
  TextColumn get truckPlate => text().nullable()();
  IntColumn get itemCount => integer().nullable()();
  IntColumn get discrepancyCount => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get syncedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

class Discrepancies extends Table {
  TextColumn get id => text()();
  TextColumn get receivingId => text().references(Receivings, #id)();
  TextColumn get type => text()();
  TextColumn get productInfo => text()();
  IntColumn get quantity => integer().nullable()();
  TextColumn get notes => text().nullable()();
  TextColumn get photoUrls => text().withDefault(const Constant('[]'))(); // JSON array
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get syncedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

// ============================================
// ISSUES TABLES
// ============================================

class Issues extends Table {
  TextColumn get id => text()();
  TextColumn get organizationId => text()();
  TextColumn get storeId => text()();
  TextColumn get storeName => text()();
  TextColumn get storeCode => text()();
  TextColumn get category => text()();
  TextColumn get priority => text().withDefault(const Constant('MEDIUM'))();
  TextColumn get title => text()();
  TextColumn get description => text()();
  TextColumn get status => text().withDefault(const Constant('REPORTED'))();
  TextColumn get reportedById => text()();
  TextColumn get reportedByName => text()();
  TextColumn get assignedToId => text().nullable()();
  TextColumn get assignedToName => text().nullable()();
  TextColumn get photoUrls => text().withDefault(const Constant('[]'))(); // JSON array
  TextColumn get resolutionNotes => text().nullable()();
  DateTimeColumn get resolvedAt => dateTime().nullable()();
  DateTimeColumn get escalatedAt => dateTime().nullable()();
  BoolColumn get isEscalated => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();
  DateTimeColumn get syncedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

// ============================================
// SYNC QUEUE TABLE
// ============================================

@DataClassName('SyncQueueEntry')
class SyncQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get entityType => text()(); // 'task', 'receiving', 'issue'
  TextColumn get entityId => text()();
  TextColumn get operation => text()(); // 'create', 'update', 'delete'
  TextColumn get payload => text()(); // JSON payload
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  TextColumn get errorMessage => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get lastAttemptAt => dateTime().nullable()();
  BoolColumn get isPending => boolean().withDefault(const Constant(true))();
}

// ============================================
// USER & STORE CACHE TABLES
// ============================================

class CachedUsers extends Table {
  TextColumn get id => text()();
  TextColumn get email => text()();
  TextColumn get name => text()();
  TextColumn get role => text()();
  TextColumn get storeId => text().nullable()();
  TextColumn get departmentId => text().nullable()();
  BoolColumn get isActive => boolean().withDefault(const Constant(true))();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

class CachedStores extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get code => text()();
  TextColumn get address => text()();
  RealColumn get latitude => real().nullable()();
  RealColumn get longitude => real().nullable()();
  TextColumn get regionId => text()();
  TextColumn get regionName => text()();
  BoolColumn get isActive => boolean().withDefault(const Constant(true))();
  DateTimeColumn get cachedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

// ============================================
// SYNC METADATA TABLE
// ============================================

class SyncMetadata extends Table {
  TextColumn get entityType => text()();
  DateTimeColumn get lastSyncAt => dateTime()();
  TextColumn get lastSyncCursor => text().nullable()();

  @override
  Set<Column> get primaryKey => {entityType};
}
