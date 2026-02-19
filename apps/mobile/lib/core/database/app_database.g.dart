// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $TasksTable extends Tasks with TableInfo<$TasksTable, Task> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TasksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _descriptionMeta =
      const VerificationMeta('description');
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
      'description', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _departmentIdMeta =
      const VerificationMeta('departmentId');
  @override
  late final GeneratedColumn<String> departmentId = GeneratedColumn<String>(
      'department_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _departmentNameMeta =
      const VerificationMeta('departmentName');
  @override
  late final GeneratedColumn<String> departmentName = GeneratedColumn<String>(
      'department_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _priorityMeta =
      const VerificationMeta('priority');
  @override
  late final GeneratedColumn<String> priority = GeneratedColumn<String>(
      'priority', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('MEDIUM'));
  static const VerificationMeta _scheduledTimeMeta =
      const VerificationMeta('scheduledTime');
  @override
  late final GeneratedColumn<DateTime> scheduledTime =
      GeneratedColumn<DateTime>('scheduled_time', aliasedName, true,
          type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _dueTimeMeta =
      const VerificationMeta('dueTime');
  @override
  late final GeneratedColumn<DateTime> dueTime = GeneratedColumn<DateTime>(
      'due_time', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _createdByIdMeta =
      const VerificationMeta('createdById');
  @override
  late final GeneratedColumn<String> createdById = GeneratedColumn<String>(
      'created_by_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _createdByNameMeta =
      const VerificationMeta('createdByName');
  @override
  late final GeneratedColumn<String> createdByName = GeneratedColumn<String>(
      'created_by_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _isRecurringMeta =
      const VerificationMeta('isRecurring');
  @override
  late final GeneratedColumn<bool> isRecurring = GeneratedColumn<bool>(
      'is_recurring', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("is_recurring" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        title,
        description,
        departmentId,
        departmentName,
        priority,
        scheduledTime,
        dueTime,
        createdById,
        createdByName,
        isRecurring,
        createdAt,
        updatedAt,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'tasks';
  @override
  VerificationContext validateIntegrity(Insertable<Task> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
          _descriptionMeta,
          description.isAcceptableOrUnknown(
              data['description']!, _descriptionMeta));
    }
    if (data.containsKey('department_id')) {
      context.handle(
          _departmentIdMeta,
          departmentId.isAcceptableOrUnknown(
              data['department_id']!, _departmentIdMeta));
    }
    if (data.containsKey('department_name')) {
      context.handle(
          _departmentNameMeta,
          departmentName.isAcceptableOrUnknown(
              data['department_name']!, _departmentNameMeta));
    }
    if (data.containsKey('priority')) {
      context.handle(_priorityMeta,
          priority.isAcceptableOrUnknown(data['priority']!, _priorityMeta));
    }
    if (data.containsKey('scheduled_time')) {
      context.handle(
          _scheduledTimeMeta,
          scheduledTime.isAcceptableOrUnknown(
              data['scheduled_time']!, _scheduledTimeMeta));
    }
    if (data.containsKey('due_time')) {
      context.handle(_dueTimeMeta,
          dueTime.isAcceptableOrUnknown(data['due_time']!, _dueTimeMeta));
    }
    if (data.containsKey('created_by_id')) {
      context.handle(
          _createdByIdMeta,
          createdById.isAcceptableOrUnknown(
              data['created_by_id']!, _createdByIdMeta));
    } else if (isInserting) {
      context.missing(_createdByIdMeta);
    }
    if (data.containsKey('created_by_name')) {
      context.handle(
          _createdByNameMeta,
          createdByName.isAcceptableOrUnknown(
              data['created_by_name']!, _createdByNameMeta));
    } else if (isInserting) {
      context.missing(_createdByNameMeta);
    }
    if (data.containsKey('is_recurring')) {
      context.handle(
          _isRecurringMeta,
          isRecurring.isAcceptableOrUnknown(
              data['is_recurring']!, _isRecurringMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Task map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Task(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      description: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}description']),
      departmentId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}department_id']),
      departmentName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}department_name']),
      priority: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}priority'])!,
      scheduledTime: attachedDatabase.typeMapping.read(
          DriftSqlType.dateTime, data['${effectivePrefix}scheduled_time']),
      dueTime: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}due_time']),
      createdById: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}created_by_id'])!,
      createdByName: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}created_by_name'])!,
      isRecurring: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_recurring'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at']),
    );
  }

  @override
  $TasksTable createAlias(String alias) {
    return $TasksTable(attachedDatabase, alias);
  }
}

class Task extends DataClass implements Insertable<Task> {
  final String id;
  final String title;
  final String? description;
  final String? departmentId;
  final String? departmentName;
  final String priority;
  final DateTime? scheduledTime;
  final DateTime? dueTime;
  final String createdById;
  final String createdByName;
  final bool isRecurring;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? syncedAt;
  const Task(
      {required this.id,
      required this.title,
      this.description,
      this.departmentId,
      this.departmentName,
      required this.priority,
      this.scheduledTime,
      this.dueTime,
      required this.createdById,
      required this.createdByName,
      required this.isRecurring,
      required this.createdAt,
      required this.updatedAt,
      this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['title'] = Variable<String>(title);
    if (!nullToAbsent || description != null) {
      map['description'] = Variable<String>(description);
    }
    if (!nullToAbsent || departmentId != null) {
      map['department_id'] = Variable<String>(departmentId);
    }
    if (!nullToAbsent || departmentName != null) {
      map['department_name'] = Variable<String>(departmentName);
    }
    map['priority'] = Variable<String>(priority);
    if (!nullToAbsent || scheduledTime != null) {
      map['scheduled_time'] = Variable<DateTime>(scheduledTime);
    }
    if (!nullToAbsent || dueTime != null) {
      map['due_time'] = Variable<DateTime>(dueTime);
    }
    map['created_by_id'] = Variable<String>(createdById);
    map['created_by_name'] = Variable<String>(createdByName);
    map['is_recurring'] = Variable<bool>(isRecurring);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    if (!nullToAbsent || syncedAt != null) {
      map['synced_at'] = Variable<DateTime>(syncedAt);
    }
    return map;
  }

  TasksCompanion toCompanion(bool nullToAbsent) {
    return TasksCompanion(
      id: Value(id),
      title: Value(title),
      description: description == null && nullToAbsent
          ? const Value.absent()
          : Value(description),
      departmentId: departmentId == null && nullToAbsent
          ? const Value.absent()
          : Value(departmentId),
      departmentName: departmentName == null && nullToAbsent
          ? const Value.absent()
          : Value(departmentName),
      priority: Value(priority),
      scheduledTime: scheduledTime == null && nullToAbsent
          ? const Value.absent()
          : Value(scheduledTime),
      dueTime: dueTime == null && nullToAbsent
          ? const Value.absent()
          : Value(dueTime),
      createdById: Value(createdById),
      createdByName: Value(createdByName),
      isRecurring: Value(isRecurring),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
      syncedAt: syncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(syncedAt),
    );
  }

  factory Task.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Task(
      id: serializer.fromJson<String>(json['id']),
      title: serializer.fromJson<String>(json['title']),
      description: serializer.fromJson<String?>(json['description']),
      departmentId: serializer.fromJson<String?>(json['departmentId']),
      departmentName: serializer.fromJson<String?>(json['departmentName']),
      priority: serializer.fromJson<String>(json['priority']),
      scheduledTime: serializer.fromJson<DateTime?>(json['scheduledTime']),
      dueTime: serializer.fromJson<DateTime?>(json['dueTime']),
      createdById: serializer.fromJson<String>(json['createdById']),
      createdByName: serializer.fromJson<String>(json['createdByName']),
      isRecurring: serializer.fromJson<bool>(json['isRecurring']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      syncedAt: serializer.fromJson<DateTime?>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'title': serializer.toJson<String>(title),
      'description': serializer.toJson<String?>(description),
      'departmentId': serializer.toJson<String?>(departmentId),
      'departmentName': serializer.toJson<String?>(departmentName),
      'priority': serializer.toJson<String>(priority),
      'scheduledTime': serializer.toJson<DateTime?>(scheduledTime),
      'dueTime': serializer.toJson<DateTime?>(dueTime),
      'createdById': serializer.toJson<String>(createdById),
      'createdByName': serializer.toJson<String>(createdByName),
      'isRecurring': serializer.toJson<bool>(isRecurring),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'syncedAt': serializer.toJson<DateTime?>(syncedAt),
    };
  }

  Task copyWith(
          {String? id,
          String? title,
          Value<String?> description = const Value.absent(),
          Value<String?> departmentId = const Value.absent(),
          Value<String?> departmentName = const Value.absent(),
          String? priority,
          Value<DateTime?> scheduledTime = const Value.absent(),
          Value<DateTime?> dueTime = const Value.absent(),
          String? createdById,
          String? createdByName,
          bool? isRecurring,
          DateTime? createdAt,
          DateTime? updatedAt,
          Value<DateTime?> syncedAt = const Value.absent()}) =>
      Task(
        id: id ?? this.id,
        title: title ?? this.title,
        description: description.present ? description.value : this.description,
        departmentId:
            departmentId.present ? departmentId.value : this.departmentId,
        departmentName:
            departmentName.present ? departmentName.value : this.departmentName,
        priority: priority ?? this.priority,
        scheduledTime:
            scheduledTime.present ? scheduledTime.value : this.scheduledTime,
        dueTime: dueTime.present ? dueTime.value : this.dueTime,
        createdById: createdById ?? this.createdById,
        createdByName: createdByName ?? this.createdByName,
        isRecurring: isRecurring ?? this.isRecurring,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        syncedAt: syncedAt.present ? syncedAt.value : this.syncedAt,
      );
  @override
  String toString() {
    return (StringBuffer('Task(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('departmentId: $departmentId, ')
          ..write('departmentName: $departmentName, ')
          ..write('priority: $priority, ')
          ..write('scheduledTime: $scheduledTime, ')
          ..write('dueTime: $dueTime, ')
          ..write('createdById: $createdById, ')
          ..write('createdByName: $createdByName, ')
          ..write('isRecurring: $isRecurring, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      title,
      description,
      departmentId,
      departmentName,
      priority,
      scheduledTime,
      dueTime,
      createdById,
      createdByName,
      isRecurring,
      createdAt,
      updatedAt,
      syncedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Task &&
          other.id == this.id &&
          other.title == this.title &&
          other.description == this.description &&
          other.departmentId == this.departmentId &&
          other.departmentName == this.departmentName &&
          other.priority == this.priority &&
          other.scheduledTime == this.scheduledTime &&
          other.dueTime == this.dueTime &&
          other.createdById == this.createdById &&
          other.createdByName == this.createdByName &&
          other.isRecurring == this.isRecurring &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.syncedAt == this.syncedAt);
}

class TasksCompanion extends UpdateCompanion<Task> {
  final Value<String> id;
  final Value<String> title;
  final Value<String?> description;
  final Value<String?> departmentId;
  final Value<String?> departmentName;
  final Value<String> priority;
  final Value<DateTime?> scheduledTime;
  final Value<DateTime?> dueTime;
  final Value<String> createdById;
  final Value<String> createdByName;
  final Value<bool> isRecurring;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<DateTime?> syncedAt;
  final Value<int> rowid;
  const TasksCompanion({
    this.id = const Value.absent(),
    this.title = const Value.absent(),
    this.description = const Value.absent(),
    this.departmentId = const Value.absent(),
    this.departmentName = const Value.absent(),
    this.priority = const Value.absent(),
    this.scheduledTime = const Value.absent(),
    this.dueTime = const Value.absent(),
    this.createdById = const Value.absent(),
    this.createdByName = const Value.absent(),
    this.isRecurring = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  TasksCompanion.insert({
    required String id,
    required String title,
    this.description = const Value.absent(),
    this.departmentId = const Value.absent(),
    this.departmentName = const Value.absent(),
    this.priority = const Value.absent(),
    this.scheduledTime = const Value.absent(),
    this.dueTime = const Value.absent(),
    required String createdById,
    required String createdByName,
    this.isRecurring = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        title = Value(title),
        createdById = Value(createdById),
        createdByName = Value(createdByName),
        createdAt = Value(createdAt),
        updatedAt = Value(updatedAt);
  static Insertable<Task> custom({
    Expression<String>? id,
    Expression<String>? title,
    Expression<String>? description,
    Expression<String>? departmentId,
    Expression<String>? departmentName,
    Expression<String>? priority,
    Expression<DateTime>? scheduledTime,
    Expression<DateTime>? dueTime,
    Expression<String>? createdById,
    Expression<String>? createdByName,
    Expression<bool>? isRecurring,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<DateTime>? syncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (departmentId != null) 'department_id': departmentId,
      if (departmentName != null) 'department_name': departmentName,
      if (priority != null) 'priority': priority,
      if (scheduledTime != null) 'scheduled_time': scheduledTime,
      if (dueTime != null) 'due_time': dueTime,
      if (createdById != null) 'created_by_id': createdById,
      if (createdByName != null) 'created_by_name': createdByName,
      if (isRecurring != null) 'is_recurring': isRecurring,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (syncedAt != null) 'synced_at': syncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  TasksCompanion copyWith(
      {Value<String>? id,
      Value<String>? title,
      Value<String?>? description,
      Value<String?>? departmentId,
      Value<String?>? departmentName,
      Value<String>? priority,
      Value<DateTime?>? scheduledTime,
      Value<DateTime?>? dueTime,
      Value<String>? createdById,
      Value<String>? createdByName,
      Value<bool>? isRecurring,
      Value<DateTime>? createdAt,
      Value<DateTime>? updatedAt,
      Value<DateTime?>? syncedAt,
      Value<int>? rowid}) {
    return TasksCompanion(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      departmentId: departmentId ?? this.departmentId,
      departmentName: departmentName ?? this.departmentName,
      priority: priority ?? this.priority,
      scheduledTime: scheduledTime ?? this.scheduledTime,
      dueTime: dueTime ?? this.dueTime,
      createdById: createdById ?? this.createdById,
      createdByName: createdByName ?? this.createdByName,
      isRecurring: isRecurring ?? this.isRecurring,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      syncedAt: syncedAt ?? this.syncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (departmentId.present) {
      map['department_id'] = Variable<String>(departmentId.value);
    }
    if (departmentName.present) {
      map['department_name'] = Variable<String>(departmentName.value);
    }
    if (priority.present) {
      map['priority'] = Variable<String>(priority.value);
    }
    if (scheduledTime.present) {
      map['scheduled_time'] = Variable<DateTime>(scheduledTime.value);
    }
    if (dueTime.present) {
      map['due_time'] = Variable<DateTime>(dueTime.value);
    }
    if (createdById.present) {
      map['created_by_id'] = Variable<String>(createdById.value);
    }
    if (createdByName.present) {
      map['created_by_name'] = Variable<String>(createdByName.value);
    }
    if (isRecurring.present) {
      map['is_recurring'] = Variable<bool>(isRecurring.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TasksCompanion(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('departmentId: $departmentId, ')
          ..write('departmentName: $departmentName, ')
          ..write('priority: $priority, ')
          ..write('scheduledTime: $scheduledTime, ')
          ..write('dueTime: $dueTime, ')
          ..write('createdById: $createdById, ')
          ..write('createdByName: $createdByName, ')
          ..write('isRecurring: $isRecurring, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('syncedAt: $syncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $TaskAssignmentsTable extends TaskAssignments
    with TableInfo<$TaskAssignmentsTable, TaskAssignment> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $TaskAssignmentsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _taskIdMeta = const VerificationMeta('taskId');
  @override
  late final GeneratedColumn<String> taskId = GeneratedColumn<String>(
      'task_id', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('REFERENCES tasks (id)'));
  static const VerificationMeta _storeIdMeta =
      const VerificationMeta('storeId');
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
      'store_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _storeNameMeta =
      const VerificationMeta('storeName');
  @override
  late final GeneratedColumn<String> storeName = GeneratedColumn<String>(
      'store_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _storeCodeMeta =
      const VerificationMeta('storeCode');
  @override
  late final GeneratedColumn<String> storeCode = GeneratedColumn<String>(
      'store_code', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('PENDING'));
  static const VerificationMeta _assignedAtMeta =
      const VerificationMeta('assignedAt');
  @override
  late final GeneratedColumn<DateTime> assignedAt = GeneratedColumn<DateTime>(
      'assigned_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _completedAtMeta =
      const VerificationMeta('completedAt');
  @override
  late final GeneratedColumn<DateTime> completedAt = GeneratedColumn<DateTime>(
      'completed_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _completedByIdMeta =
      const VerificationMeta('completedById');
  @override
  late final GeneratedColumn<String> completedById = GeneratedColumn<String>(
      'completed_by_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _completedByNameMeta =
      const VerificationMeta('completedByName');
  @override
  late final GeneratedColumn<String> completedByName = GeneratedColumn<String>(
      'completed_by_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _photoUrlsMeta =
      const VerificationMeta('photoUrls');
  @override
  late final GeneratedColumn<String> photoUrls = GeneratedColumn<String>(
      'photo_urls', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('[]'));
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        taskId,
        storeId,
        storeName,
        storeCode,
        status,
        assignedAt,
        completedAt,
        completedById,
        completedByName,
        notes,
        photoUrls,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'task_assignments';
  @override
  VerificationContext validateIntegrity(Insertable<TaskAssignment> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('task_id')) {
      context.handle(_taskIdMeta,
          taskId.isAcceptableOrUnknown(data['task_id']!, _taskIdMeta));
    } else if (isInserting) {
      context.missing(_taskIdMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(_storeIdMeta,
          storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta));
    } else if (isInserting) {
      context.missing(_storeIdMeta);
    }
    if (data.containsKey('store_name')) {
      context.handle(_storeNameMeta,
          storeName.isAcceptableOrUnknown(data['store_name']!, _storeNameMeta));
    } else if (isInserting) {
      context.missing(_storeNameMeta);
    }
    if (data.containsKey('store_code')) {
      context.handle(_storeCodeMeta,
          storeCode.isAcceptableOrUnknown(data['store_code']!, _storeCodeMeta));
    } else if (isInserting) {
      context.missing(_storeCodeMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('assigned_at')) {
      context.handle(
          _assignedAtMeta,
          assignedAt.isAcceptableOrUnknown(
              data['assigned_at']!, _assignedAtMeta));
    } else if (isInserting) {
      context.missing(_assignedAtMeta);
    }
    if (data.containsKey('completed_at')) {
      context.handle(
          _completedAtMeta,
          completedAt.isAcceptableOrUnknown(
              data['completed_at']!, _completedAtMeta));
    }
    if (data.containsKey('completed_by_id')) {
      context.handle(
          _completedByIdMeta,
          completedById.isAcceptableOrUnknown(
              data['completed_by_id']!, _completedByIdMeta));
    }
    if (data.containsKey('completed_by_name')) {
      context.handle(
          _completedByNameMeta,
          completedByName.isAcceptableOrUnknown(
              data['completed_by_name']!, _completedByNameMeta));
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    }
    if (data.containsKey('photo_urls')) {
      context.handle(_photoUrlsMeta,
          photoUrls.isAcceptableOrUnknown(data['photo_urls']!, _photoUrlsMeta));
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  TaskAssignment map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return TaskAssignment(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      taskId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}task_id'])!,
      storeId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}store_id'])!,
      storeName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}store_name'])!,
      storeCode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}store_code'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      assignedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}assigned_at'])!,
      completedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}completed_at']),
      completedById: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}completed_by_id']),
      completedByName: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}completed_by_name']),
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes']),
      photoUrls: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}photo_urls'])!,
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at']),
    );
  }

  @override
  $TaskAssignmentsTable createAlias(String alias) {
    return $TaskAssignmentsTable(attachedDatabase, alias);
  }
}

class TaskAssignment extends DataClass implements Insertable<TaskAssignment> {
  final String id;
  final String taskId;
  final String storeId;
  final String storeName;
  final String storeCode;
  final String status;
  final DateTime assignedAt;
  final DateTime? completedAt;
  final String? completedById;
  final String? completedByName;
  final String? notes;
  final String photoUrls;
  final DateTime? syncedAt;
  const TaskAssignment(
      {required this.id,
      required this.taskId,
      required this.storeId,
      required this.storeName,
      required this.storeCode,
      required this.status,
      required this.assignedAt,
      this.completedAt,
      this.completedById,
      this.completedByName,
      this.notes,
      required this.photoUrls,
      this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['task_id'] = Variable<String>(taskId);
    map['store_id'] = Variable<String>(storeId);
    map['store_name'] = Variable<String>(storeName);
    map['store_code'] = Variable<String>(storeCode);
    map['status'] = Variable<String>(status);
    map['assigned_at'] = Variable<DateTime>(assignedAt);
    if (!nullToAbsent || completedAt != null) {
      map['completed_at'] = Variable<DateTime>(completedAt);
    }
    if (!nullToAbsent || completedById != null) {
      map['completed_by_id'] = Variable<String>(completedById);
    }
    if (!nullToAbsent || completedByName != null) {
      map['completed_by_name'] = Variable<String>(completedByName);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['photo_urls'] = Variable<String>(photoUrls);
    if (!nullToAbsent || syncedAt != null) {
      map['synced_at'] = Variable<DateTime>(syncedAt);
    }
    return map;
  }

  TaskAssignmentsCompanion toCompanion(bool nullToAbsent) {
    return TaskAssignmentsCompanion(
      id: Value(id),
      taskId: Value(taskId),
      storeId: Value(storeId),
      storeName: Value(storeName),
      storeCode: Value(storeCode),
      status: Value(status),
      assignedAt: Value(assignedAt),
      completedAt: completedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(completedAt),
      completedById: completedById == null && nullToAbsent
          ? const Value.absent()
          : Value(completedById),
      completedByName: completedByName == null && nullToAbsent
          ? const Value.absent()
          : Value(completedByName),
      notes:
          notes == null && nullToAbsent ? const Value.absent() : Value(notes),
      photoUrls: Value(photoUrls),
      syncedAt: syncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(syncedAt),
    );
  }

  factory TaskAssignment.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return TaskAssignment(
      id: serializer.fromJson<String>(json['id']),
      taskId: serializer.fromJson<String>(json['taskId']),
      storeId: serializer.fromJson<String>(json['storeId']),
      storeName: serializer.fromJson<String>(json['storeName']),
      storeCode: serializer.fromJson<String>(json['storeCode']),
      status: serializer.fromJson<String>(json['status']),
      assignedAt: serializer.fromJson<DateTime>(json['assignedAt']),
      completedAt: serializer.fromJson<DateTime?>(json['completedAt']),
      completedById: serializer.fromJson<String?>(json['completedById']),
      completedByName: serializer.fromJson<String?>(json['completedByName']),
      notes: serializer.fromJson<String?>(json['notes']),
      photoUrls: serializer.fromJson<String>(json['photoUrls']),
      syncedAt: serializer.fromJson<DateTime?>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'taskId': serializer.toJson<String>(taskId),
      'storeId': serializer.toJson<String>(storeId),
      'storeName': serializer.toJson<String>(storeName),
      'storeCode': serializer.toJson<String>(storeCode),
      'status': serializer.toJson<String>(status),
      'assignedAt': serializer.toJson<DateTime>(assignedAt),
      'completedAt': serializer.toJson<DateTime?>(completedAt),
      'completedById': serializer.toJson<String?>(completedById),
      'completedByName': serializer.toJson<String?>(completedByName),
      'notes': serializer.toJson<String?>(notes),
      'photoUrls': serializer.toJson<String>(photoUrls),
      'syncedAt': serializer.toJson<DateTime?>(syncedAt),
    };
  }

  TaskAssignment copyWith(
          {String? id,
          String? taskId,
          String? storeId,
          String? storeName,
          String? storeCode,
          String? status,
          DateTime? assignedAt,
          Value<DateTime?> completedAt = const Value.absent(),
          Value<String?> completedById = const Value.absent(),
          Value<String?> completedByName = const Value.absent(),
          Value<String?> notes = const Value.absent(),
          String? photoUrls,
          Value<DateTime?> syncedAt = const Value.absent()}) =>
      TaskAssignment(
        id: id ?? this.id,
        taskId: taskId ?? this.taskId,
        storeId: storeId ?? this.storeId,
        storeName: storeName ?? this.storeName,
        storeCode: storeCode ?? this.storeCode,
        status: status ?? this.status,
        assignedAt: assignedAt ?? this.assignedAt,
        completedAt: completedAt.present ? completedAt.value : this.completedAt,
        completedById:
            completedById.present ? completedById.value : this.completedById,
        completedByName: completedByName.present
            ? completedByName.value
            : this.completedByName,
        notes: notes.present ? notes.value : this.notes,
        photoUrls: photoUrls ?? this.photoUrls,
        syncedAt: syncedAt.present ? syncedAt.value : this.syncedAt,
      );
  @override
  String toString() {
    return (StringBuffer('TaskAssignment(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('storeId: $storeId, ')
          ..write('storeName: $storeName, ')
          ..write('storeCode: $storeCode, ')
          ..write('status: $status, ')
          ..write('assignedAt: $assignedAt, ')
          ..write('completedAt: $completedAt, ')
          ..write('completedById: $completedById, ')
          ..write('completedByName: $completedByName, ')
          ..write('notes: $notes, ')
          ..write('photoUrls: $photoUrls, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      taskId,
      storeId,
      storeName,
      storeCode,
      status,
      assignedAt,
      completedAt,
      completedById,
      completedByName,
      notes,
      photoUrls,
      syncedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is TaskAssignment &&
          other.id == this.id &&
          other.taskId == this.taskId &&
          other.storeId == this.storeId &&
          other.storeName == this.storeName &&
          other.storeCode == this.storeCode &&
          other.status == this.status &&
          other.assignedAt == this.assignedAt &&
          other.completedAt == this.completedAt &&
          other.completedById == this.completedById &&
          other.completedByName == this.completedByName &&
          other.notes == this.notes &&
          other.photoUrls == this.photoUrls &&
          other.syncedAt == this.syncedAt);
}

class TaskAssignmentsCompanion extends UpdateCompanion<TaskAssignment> {
  final Value<String> id;
  final Value<String> taskId;
  final Value<String> storeId;
  final Value<String> storeName;
  final Value<String> storeCode;
  final Value<String> status;
  final Value<DateTime> assignedAt;
  final Value<DateTime?> completedAt;
  final Value<String?> completedById;
  final Value<String?> completedByName;
  final Value<String?> notes;
  final Value<String> photoUrls;
  final Value<DateTime?> syncedAt;
  final Value<int> rowid;
  const TaskAssignmentsCompanion({
    this.id = const Value.absent(),
    this.taskId = const Value.absent(),
    this.storeId = const Value.absent(),
    this.storeName = const Value.absent(),
    this.storeCode = const Value.absent(),
    this.status = const Value.absent(),
    this.assignedAt = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.completedById = const Value.absent(),
    this.completedByName = const Value.absent(),
    this.notes = const Value.absent(),
    this.photoUrls = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  TaskAssignmentsCompanion.insert({
    required String id,
    required String taskId,
    required String storeId,
    required String storeName,
    required String storeCode,
    this.status = const Value.absent(),
    required DateTime assignedAt,
    this.completedAt = const Value.absent(),
    this.completedById = const Value.absent(),
    this.completedByName = const Value.absent(),
    this.notes = const Value.absent(),
    this.photoUrls = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        taskId = Value(taskId),
        storeId = Value(storeId),
        storeName = Value(storeName),
        storeCode = Value(storeCode),
        assignedAt = Value(assignedAt);
  static Insertable<TaskAssignment> custom({
    Expression<String>? id,
    Expression<String>? taskId,
    Expression<String>? storeId,
    Expression<String>? storeName,
    Expression<String>? storeCode,
    Expression<String>? status,
    Expression<DateTime>? assignedAt,
    Expression<DateTime>? completedAt,
    Expression<String>? completedById,
    Expression<String>? completedByName,
    Expression<String>? notes,
    Expression<String>? photoUrls,
    Expression<DateTime>? syncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (taskId != null) 'task_id': taskId,
      if (storeId != null) 'store_id': storeId,
      if (storeName != null) 'store_name': storeName,
      if (storeCode != null) 'store_code': storeCode,
      if (status != null) 'status': status,
      if (assignedAt != null) 'assigned_at': assignedAt,
      if (completedAt != null) 'completed_at': completedAt,
      if (completedById != null) 'completed_by_id': completedById,
      if (completedByName != null) 'completed_by_name': completedByName,
      if (notes != null) 'notes': notes,
      if (photoUrls != null) 'photo_urls': photoUrls,
      if (syncedAt != null) 'synced_at': syncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  TaskAssignmentsCompanion copyWith(
      {Value<String>? id,
      Value<String>? taskId,
      Value<String>? storeId,
      Value<String>? storeName,
      Value<String>? storeCode,
      Value<String>? status,
      Value<DateTime>? assignedAt,
      Value<DateTime?>? completedAt,
      Value<String?>? completedById,
      Value<String?>? completedByName,
      Value<String?>? notes,
      Value<String>? photoUrls,
      Value<DateTime?>? syncedAt,
      Value<int>? rowid}) {
    return TaskAssignmentsCompanion(
      id: id ?? this.id,
      taskId: taskId ?? this.taskId,
      storeId: storeId ?? this.storeId,
      storeName: storeName ?? this.storeName,
      storeCode: storeCode ?? this.storeCode,
      status: status ?? this.status,
      assignedAt: assignedAt ?? this.assignedAt,
      completedAt: completedAt ?? this.completedAt,
      completedById: completedById ?? this.completedById,
      completedByName: completedByName ?? this.completedByName,
      notes: notes ?? this.notes,
      photoUrls: photoUrls ?? this.photoUrls,
      syncedAt: syncedAt ?? this.syncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (taskId.present) {
      map['task_id'] = Variable<String>(taskId.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (storeName.present) {
      map['store_name'] = Variable<String>(storeName.value);
    }
    if (storeCode.present) {
      map['store_code'] = Variable<String>(storeCode.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (assignedAt.present) {
      map['assigned_at'] = Variable<DateTime>(assignedAt.value);
    }
    if (completedAt.present) {
      map['completed_at'] = Variable<DateTime>(completedAt.value);
    }
    if (completedById.present) {
      map['completed_by_id'] = Variable<String>(completedById.value);
    }
    if (completedByName.present) {
      map['completed_by_name'] = Variable<String>(completedByName.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (photoUrls.present) {
      map['photo_urls'] = Variable<String>(photoUrls.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('TaskAssignmentsCompanion(')
          ..write('id: $id, ')
          ..write('taskId: $taskId, ')
          ..write('storeId: $storeId, ')
          ..write('storeName: $storeName, ')
          ..write('storeCode: $storeCode, ')
          ..write('status: $status, ')
          ..write('assignedAt: $assignedAt, ')
          ..write('completedAt: $completedAt, ')
          ..write('completedById: $completedById, ')
          ..write('completedByName: $completedByName, ')
          ..write('notes: $notes, ')
          ..write('photoUrls: $photoUrls, ')
          ..write('syncedAt: $syncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ReceivingsTable extends Receivings
    with TableInfo<$ReceivingsTable, Receiving> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ReceivingsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _storeIdMeta =
      const VerificationMeta('storeId');
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
      'store_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _storeNameMeta =
      const VerificationMeta('storeName');
  @override
  late final GeneratedColumn<String> storeName = GeneratedColumn<String>(
      'store_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _storeCodeMeta =
      const VerificationMeta('storeCode');
  @override
  late final GeneratedColumn<String> storeCode = GeneratedColumn<String>(
      'store_code', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _supplierTypeMeta =
      const VerificationMeta('supplierType');
  @override
  late final GeneratedColumn<String> supplierType = GeneratedColumn<String>(
      'supplier_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _supplierNameMeta =
      const VerificationMeta('supplierName');
  @override
  late final GeneratedColumn<String> supplierName = GeneratedColumn<String>(
      'supplier_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _poNumberMeta =
      const VerificationMeta('poNumber');
  @override
  late final GeneratedColumn<String> poNumber = GeneratedColumn<String>(
      'po_number', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _scheduledTimeMeta =
      const VerificationMeta('scheduledTime');
  @override
  late final GeneratedColumn<DateTime> scheduledTime =
      GeneratedColumn<DateTime>('scheduled_time', aliasedName, true,
          type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _arrivalTimeMeta =
      const VerificationMeta('arrivalTime');
  @override
  late final GeneratedColumn<DateTime> arrivalTime = GeneratedColumn<DateTime>(
      'arrival_time', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('PENDING'));
  static const VerificationMeta _verifiedByIdMeta =
      const VerificationMeta('verifiedById');
  @override
  late final GeneratedColumn<String> verifiedById = GeneratedColumn<String>(
      'verified_by_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _verifiedByNameMeta =
      const VerificationMeta('verifiedByName');
  @override
  late final GeneratedColumn<String> verifiedByName = GeneratedColumn<String>(
      'verified_by_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _photoUrlsMeta =
      const VerificationMeta('photoUrls');
  @override
  late final GeneratedColumn<String> photoUrls = GeneratedColumn<String>(
      'photo_urls', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('[]'));
  static const VerificationMeta _signatureUrlMeta =
      const VerificationMeta('signatureUrl');
  @override
  late final GeneratedColumn<String> signatureUrl = GeneratedColumn<String>(
      'signature_url', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _driverNameMeta =
      const VerificationMeta('driverName');
  @override
  late final GeneratedColumn<String> driverName = GeneratedColumn<String>(
      'driver_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _truckPlateMeta =
      const VerificationMeta('truckPlate');
  @override
  late final GeneratedColumn<String> truckPlate = GeneratedColumn<String>(
      'truck_plate', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _itemCountMeta =
      const VerificationMeta('itemCount');
  @override
  late final GeneratedColumn<int> itemCount = GeneratedColumn<int>(
      'item_count', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _discrepancyCountMeta =
      const VerificationMeta('discrepancyCount');
  @override
  late final GeneratedColumn<int> discrepancyCount = GeneratedColumn<int>(
      'discrepancy_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        storeId,
        storeName,
        storeCode,
        supplierType,
        supplierName,
        poNumber,
        scheduledTime,
        arrivalTime,
        status,
        verifiedById,
        verifiedByName,
        notes,
        photoUrls,
        signatureUrl,
        driverName,
        truckPlate,
        itemCount,
        discrepancyCount,
        createdAt,
        updatedAt,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'receivings';
  @override
  VerificationContext validateIntegrity(Insertable<Receiving> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(_storeIdMeta,
          storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta));
    } else if (isInserting) {
      context.missing(_storeIdMeta);
    }
    if (data.containsKey('store_name')) {
      context.handle(_storeNameMeta,
          storeName.isAcceptableOrUnknown(data['store_name']!, _storeNameMeta));
    } else if (isInserting) {
      context.missing(_storeNameMeta);
    }
    if (data.containsKey('store_code')) {
      context.handle(_storeCodeMeta,
          storeCode.isAcceptableOrUnknown(data['store_code']!, _storeCodeMeta));
    } else if (isInserting) {
      context.missing(_storeCodeMeta);
    }
    if (data.containsKey('supplier_type')) {
      context.handle(
          _supplierTypeMeta,
          supplierType.isAcceptableOrUnknown(
              data['supplier_type']!, _supplierTypeMeta));
    } else if (isInserting) {
      context.missing(_supplierTypeMeta);
    }
    if (data.containsKey('supplier_name')) {
      context.handle(
          _supplierNameMeta,
          supplierName.isAcceptableOrUnknown(
              data['supplier_name']!, _supplierNameMeta));
    } else if (isInserting) {
      context.missing(_supplierNameMeta);
    }
    if (data.containsKey('po_number')) {
      context.handle(_poNumberMeta,
          poNumber.isAcceptableOrUnknown(data['po_number']!, _poNumberMeta));
    }
    if (data.containsKey('scheduled_time')) {
      context.handle(
          _scheduledTimeMeta,
          scheduledTime.isAcceptableOrUnknown(
              data['scheduled_time']!, _scheduledTimeMeta));
    }
    if (data.containsKey('arrival_time')) {
      context.handle(
          _arrivalTimeMeta,
          arrivalTime.isAcceptableOrUnknown(
              data['arrival_time']!, _arrivalTimeMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('verified_by_id')) {
      context.handle(
          _verifiedByIdMeta,
          verifiedById.isAcceptableOrUnknown(
              data['verified_by_id']!, _verifiedByIdMeta));
    }
    if (data.containsKey('verified_by_name')) {
      context.handle(
          _verifiedByNameMeta,
          verifiedByName.isAcceptableOrUnknown(
              data['verified_by_name']!, _verifiedByNameMeta));
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    }
    if (data.containsKey('photo_urls')) {
      context.handle(_photoUrlsMeta,
          photoUrls.isAcceptableOrUnknown(data['photo_urls']!, _photoUrlsMeta));
    }
    if (data.containsKey('signature_url')) {
      context.handle(
          _signatureUrlMeta,
          signatureUrl.isAcceptableOrUnknown(
              data['signature_url']!, _signatureUrlMeta));
    }
    if (data.containsKey('driver_name')) {
      context.handle(
          _driverNameMeta,
          driverName.isAcceptableOrUnknown(
              data['driver_name']!, _driverNameMeta));
    }
    if (data.containsKey('truck_plate')) {
      context.handle(
          _truckPlateMeta,
          truckPlate.isAcceptableOrUnknown(
              data['truck_plate']!, _truckPlateMeta));
    }
    if (data.containsKey('item_count')) {
      context.handle(_itemCountMeta,
          itemCount.isAcceptableOrUnknown(data['item_count']!, _itemCountMeta));
    }
    if (data.containsKey('discrepancy_count')) {
      context.handle(
          _discrepancyCountMeta,
          discrepancyCount.isAcceptableOrUnknown(
              data['discrepancy_count']!, _discrepancyCountMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Receiving map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Receiving(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      storeId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}store_id'])!,
      storeName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}store_name'])!,
      storeCode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}store_code'])!,
      supplierType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}supplier_type'])!,
      supplierName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}supplier_name'])!,
      poNumber: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}po_number']),
      scheduledTime: attachedDatabase.typeMapping.read(
          DriftSqlType.dateTime, data['${effectivePrefix}scheduled_time']),
      arrivalTime: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}arrival_time']),
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      verifiedById: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}verified_by_id']),
      verifiedByName: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}verified_by_name']),
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes']),
      photoUrls: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}photo_urls'])!,
      signatureUrl: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}signature_url']),
      driverName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}driver_name']),
      truckPlate: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}truck_plate']),
      itemCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}item_count']),
      discrepancyCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}discrepancy_count'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at']),
    );
  }

  @override
  $ReceivingsTable createAlias(String alias) {
    return $ReceivingsTable(attachedDatabase, alias);
  }
}

class Receiving extends DataClass implements Insertable<Receiving> {
  final String id;
  final String storeId;
  final String storeName;
  final String storeCode;
  final String supplierType;
  final String supplierName;
  final String? poNumber;
  final DateTime? scheduledTime;
  final DateTime? arrivalTime;
  final String status;
  final String? verifiedById;
  final String? verifiedByName;
  final String? notes;
  final String photoUrls;
  final String? signatureUrl;
  final String? driverName;
  final String? truckPlate;
  final int? itemCount;
  final int discrepancyCount;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? syncedAt;
  const Receiving(
      {required this.id,
      required this.storeId,
      required this.storeName,
      required this.storeCode,
      required this.supplierType,
      required this.supplierName,
      this.poNumber,
      this.scheduledTime,
      this.arrivalTime,
      required this.status,
      this.verifiedById,
      this.verifiedByName,
      this.notes,
      required this.photoUrls,
      this.signatureUrl,
      this.driverName,
      this.truckPlate,
      this.itemCount,
      required this.discrepancyCount,
      required this.createdAt,
      required this.updatedAt,
      this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['store_id'] = Variable<String>(storeId);
    map['store_name'] = Variable<String>(storeName);
    map['store_code'] = Variable<String>(storeCode);
    map['supplier_type'] = Variable<String>(supplierType);
    map['supplier_name'] = Variable<String>(supplierName);
    if (!nullToAbsent || poNumber != null) {
      map['po_number'] = Variable<String>(poNumber);
    }
    if (!nullToAbsent || scheduledTime != null) {
      map['scheduled_time'] = Variable<DateTime>(scheduledTime);
    }
    if (!nullToAbsent || arrivalTime != null) {
      map['arrival_time'] = Variable<DateTime>(arrivalTime);
    }
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || verifiedById != null) {
      map['verified_by_id'] = Variable<String>(verifiedById);
    }
    if (!nullToAbsent || verifiedByName != null) {
      map['verified_by_name'] = Variable<String>(verifiedByName);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['photo_urls'] = Variable<String>(photoUrls);
    if (!nullToAbsent || signatureUrl != null) {
      map['signature_url'] = Variable<String>(signatureUrl);
    }
    if (!nullToAbsent || driverName != null) {
      map['driver_name'] = Variable<String>(driverName);
    }
    if (!nullToAbsent || truckPlate != null) {
      map['truck_plate'] = Variable<String>(truckPlate);
    }
    if (!nullToAbsent || itemCount != null) {
      map['item_count'] = Variable<int>(itemCount);
    }
    map['discrepancy_count'] = Variable<int>(discrepancyCount);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    if (!nullToAbsent || syncedAt != null) {
      map['synced_at'] = Variable<DateTime>(syncedAt);
    }
    return map;
  }

  ReceivingsCompanion toCompanion(bool nullToAbsent) {
    return ReceivingsCompanion(
      id: Value(id),
      storeId: Value(storeId),
      storeName: Value(storeName),
      storeCode: Value(storeCode),
      supplierType: Value(supplierType),
      supplierName: Value(supplierName),
      poNumber: poNumber == null && nullToAbsent
          ? const Value.absent()
          : Value(poNumber),
      scheduledTime: scheduledTime == null && nullToAbsent
          ? const Value.absent()
          : Value(scheduledTime),
      arrivalTime: arrivalTime == null && nullToAbsent
          ? const Value.absent()
          : Value(arrivalTime),
      status: Value(status),
      verifiedById: verifiedById == null && nullToAbsent
          ? const Value.absent()
          : Value(verifiedById),
      verifiedByName: verifiedByName == null && nullToAbsent
          ? const Value.absent()
          : Value(verifiedByName),
      notes:
          notes == null && nullToAbsent ? const Value.absent() : Value(notes),
      photoUrls: Value(photoUrls),
      signatureUrl: signatureUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(signatureUrl),
      driverName: driverName == null && nullToAbsent
          ? const Value.absent()
          : Value(driverName),
      truckPlate: truckPlate == null && nullToAbsent
          ? const Value.absent()
          : Value(truckPlate),
      itemCount: itemCount == null && nullToAbsent
          ? const Value.absent()
          : Value(itemCount),
      discrepancyCount: Value(discrepancyCount),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
      syncedAt: syncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(syncedAt),
    );
  }

  factory Receiving.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Receiving(
      id: serializer.fromJson<String>(json['id']),
      storeId: serializer.fromJson<String>(json['storeId']),
      storeName: serializer.fromJson<String>(json['storeName']),
      storeCode: serializer.fromJson<String>(json['storeCode']),
      supplierType: serializer.fromJson<String>(json['supplierType']),
      supplierName: serializer.fromJson<String>(json['supplierName']),
      poNumber: serializer.fromJson<String?>(json['poNumber']),
      scheduledTime: serializer.fromJson<DateTime?>(json['scheduledTime']),
      arrivalTime: serializer.fromJson<DateTime?>(json['arrivalTime']),
      status: serializer.fromJson<String>(json['status']),
      verifiedById: serializer.fromJson<String?>(json['verifiedById']),
      verifiedByName: serializer.fromJson<String?>(json['verifiedByName']),
      notes: serializer.fromJson<String?>(json['notes']),
      photoUrls: serializer.fromJson<String>(json['photoUrls']),
      signatureUrl: serializer.fromJson<String?>(json['signatureUrl']),
      driverName: serializer.fromJson<String?>(json['driverName']),
      truckPlate: serializer.fromJson<String?>(json['truckPlate']),
      itemCount: serializer.fromJson<int?>(json['itemCount']),
      discrepancyCount: serializer.fromJson<int>(json['discrepancyCount']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      syncedAt: serializer.fromJson<DateTime?>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'storeId': serializer.toJson<String>(storeId),
      'storeName': serializer.toJson<String>(storeName),
      'storeCode': serializer.toJson<String>(storeCode),
      'supplierType': serializer.toJson<String>(supplierType),
      'supplierName': serializer.toJson<String>(supplierName),
      'poNumber': serializer.toJson<String?>(poNumber),
      'scheduledTime': serializer.toJson<DateTime?>(scheduledTime),
      'arrivalTime': serializer.toJson<DateTime?>(arrivalTime),
      'status': serializer.toJson<String>(status),
      'verifiedById': serializer.toJson<String?>(verifiedById),
      'verifiedByName': serializer.toJson<String?>(verifiedByName),
      'notes': serializer.toJson<String?>(notes),
      'photoUrls': serializer.toJson<String>(photoUrls),
      'signatureUrl': serializer.toJson<String?>(signatureUrl),
      'driverName': serializer.toJson<String?>(driverName),
      'truckPlate': serializer.toJson<String?>(truckPlate),
      'itemCount': serializer.toJson<int?>(itemCount),
      'discrepancyCount': serializer.toJson<int>(discrepancyCount),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'syncedAt': serializer.toJson<DateTime?>(syncedAt),
    };
  }

  Receiving copyWith(
          {String? id,
          String? storeId,
          String? storeName,
          String? storeCode,
          String? supplierType,
          String? supplierName,
          Value<String?> poNumber = const Value.absent(),
          Value<DateTime?> scheduledTime = const Value.absent(),
          Value<DateTime?> arrivalTime = const Value.absent(),
          String? status,
          Value<String?> verifiedById = const Value.absent(),
          Value<String?> verifiedByName = const Value.absent(),
          Value<String?> notes = const Value.absent(),
          String? photoUrls,
          Value<String?> signatureUrl = const Value.absent(),
          Value<String?> driverName = const Value.absent(),
          Value<String?> truckPlate = const Value.absent(),
          Value<int?> itemCount = const Value.absent(),
          int? discrepancyCount,
          DateTime? createdAt,
          DateTime? updatedAt,
          Value<DateTime?> syncedAt = const Value.absent()}) =>
      Receiving(
        id: id ?? this.id,
        storeId: storeId ?? this.storeId,
        storeName: storeName ?? this.storeName,
        storeCode: storeCode ?? this.storeCode,
        supplierType: supplierType ?? this.supplierType,
        supplierName: supplierName ?? this.supplierName,
        poNumber: poNumber.present ? poNumber.value : this.poNumber,
        scheduledTime:
            scheduledTime.present ? scheduledTime.value : this.scheduledTime,
        arrivalTime: arrivalTime.present ? arrivalTime.value : this.arrivalTime,
        status: status ?? this.status,
        verifiedById:
            verifiedById.present ? verifiedById.value : this.verifiedById,
        verifiedByName:
            verifiedByName.present ? verifiedByName.value : this.verifiedByName,
        notes: notes.present ? notes.value : this.notes,
        photoUrls: photoUrls ?? this.photoUrls,
        signatureUrl:
            signatureUrl.present ? signatureUrl.value : this.signatureUrl,
        driverName: driverName.present ? driverName.value : this.driverName,
        truckPlate: truckPlate.present ? truckPlate.value : this.truckPlate,
        itemCount: itemCount.present ? itemCount.value : this.itemCount,
        discrepancyCount: discrepancyCount ?? this.discrepancyCount,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        syncedAt: syncedAt.present ? syncedAt.value : this.syncedAt,
      );
  @override
  String toString() {
    return (StringBuffer('Receiving(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('storeName: $storeName, ')
          ..write('storeCode: $storeCode, ')
          ..write('supplierType: $supplierType, ')
          ..write('supplierName: $supplierName, ')
          ..write('poNumber: $poNumber, ')
          ..write('scheduledTime: $scheduledTime, ')
          ..write('arrivalTime: $arrivalTime, ')
          ..write('status: $status, ')
          ..write('verifiedById: $verifiedById, ')
          ..write('verifiedByName: $verifiedByName, ')
          ..write('notes: $notes, ')
          ..write('photoUrls: $photoUrls, ')
          ..write('signatureUrl: $signatureUrl, ')
          ..write('driverName: $driverName, ')
          ..write('truckPlate: $truckPlate, ')
          ..write('itemCount: $itemCount, ')
          ..write('discrepancyCount: $discrepancyCount, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
        id,
        storeId,
        storeName,
        storeCode,
        supplierType,
        supplierName,
        poNumber,
        scheduledTime,
        arrivalTime,
        status,
        verifiedById,
        verifiedByName,
        notes,
        photoUrls,
        signatureUrl,
        driverName,
        truckPlate,
        itemCount,
        discrepancyCount,
        createdAt,
        updatedAt,
        syncedAt
      ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Receiving &&
          other.id == this.id &&
          other.storeId == this.storeId &&
          other.storeName == this.storeName &&
          other.storeCode == this.storeCode &&
          other.supplierType == this.supplierType &&
          other.supplierName == this.supplierName &&
          other.poNumber == this.poNumber &&
          other.scheduledTime == this.scheduledTime &&
          other.arrivalTime == this.arrivalTime &&
          other.status == this.status &&
          other.verifiedById == this.verifiedById &&
          other.verifiedByName == this.verifiedByName &&
          other.notes == this.notes &&
          other.photoUrls == this.photoUrls &&
          other.signatureUrl == this.signatureUrl &&
          other.driverName == this.driverName &&
          other.truckPlate == this.truckPlate &&
          other.itemCount == this.itemCount &&
          other.discrepancyCount == this.discrepancyCount &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.syncedAt == this.syncedAt);
}

class ReceivingsCompanion extends UpdateCompanion<Receiving> {
  final Value<String> id;
  final Value<String> storeId;
  final Value<String> storeName;
  final Value<String> storeCode;
  final Value<String> supplierType;
  final Value<String> supplierName;
  final Value<String?> poNumber;
  final Value<DateTime?> scheduledTime;
  final Value<DateTime?> arrivalTime;
  final Value<String> status;
  final Value<String?> verifiedById;
  final Value<String?> verifiedByName;
  final Value<String?> notes;
  final Value<String> photoUrls;
  final Value<String?> signatureUrl;
  final Value<String?> driverName;
  final Value<String?> truckPlate;
  final Value<int?> itemCount;
  final Value<int> discrepancyCount;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<DateTime?> syncedAt;
  final Value<int> rowid;
  const ReceivingsCompanion({
    this.id = const Value.absent(),
    this.storeId = const Value.absent(),
    this.storeName = const Value.absent(),
    this.storeCode = const Value.absent(),
    this.supplierType = const Value.absent(),
    this.supplierName = const Value.absent(),
    this.poNumber = const Value.absent(),
    this.scheduledTime = const Value.absent(),
    this.arrivalTime = const Value.absent(),
    this.status = const Value.absent(),
    this.verifiedById = const Value.absent(),
    this.verifiedByName = const Value.absent(),
    this.notes = const Value.absent(),
    this.photoUrls = const Value.absent(),
    this.signatureUrl = const Value.absent(),
    this.driverName = const Value.absent(),
    this.truckPlate = const Value.absent(),
    this.itemCount = const Value.absent(),
    this.discrepancyCount = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ReceivingsCompanion.insert({
    required String id,
    required String storeId,
    required String storeName,
    required String storeCode,
    required String supplierType,
    required String supplierName,
    this.poNumber = const Value.absent(),
    this.scheduledTime = const Value.absent(),
    this.arrivalTime = const Value.absent(),
    this.status = const Value.absent(),
    this.verifiedById = const Value.absent(),
    this.verifiedByName = const Value.absent(),
    this.notes = const Value.absent(),
    this.photoUrls = const Value.absent(),
    this.signatureUrl = const Value.absent(),
    this.driverName = const Value.absent(),
    this.truckPlate = const Value.absent(),
    this.itemCount = const Value.absent(),
    this.discrepancyCount = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        storeId = Value(storeId),
        storeName = Value(storeName),
        storeCode = Value(storeCode),
        supplierType = Value(supplierType),
        supplierName = Value(supplierName),
        createdAt = Value(createdAt),
        updatedAt = Value(updatedAt);
  static Insertable<Receiving> custom({
    Expression<String>? id,
    Expression<String>? storeId,
    Expression<String>? storeName,
    Expression<String>? storeCode,
    Expression<String>? supplierType,
    Expression<String>? supplierName,
    Expression<String>? poNumber,
    Expression<DateTime>? scheduledTime,
    Expression<DateTime>? arrivalTime,
    Expression<String>? status,
    Expression<String>? verifiedById,
    Expression<String>? verifiedByName,
    Expression<String>? notes,
    Expression<String>? photoUrls,
    Expression<String>? signatureUrl,
    Expression<String>? driverName,
    Expression<String>? truckPlate,
    Expression<int>? itemCount,
    Expression<int>? discrepancyCount,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<DateTime>? syncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (storeId != null) 'store_id': storeId,
      if (storeName != null) 'store_name': storeName,
      if (storeCode != null) 'store_code': storeCode,
      if (supplierType != null) 'supplier_type': supplierType,
      if (supplierName != null) 'supplier_name': supplierName,
      if (poNumber != null) 'po_number': poNumber,
      if (scheduledTime != null) 'scheduled_time': scheduledTime,
      if (arrivalTime != null) 'arrival_time': arrivalTime,
      if (status != null) 'status': status,
      if (verifiedById != null) 'verified_by_id': verifiedById,
      if (verifiedByName != null) 'verified_by_name': verifiedByName,
      if (notes != null) 'notes': notes,
      if (photoUrls != null) 'photo_urls': photoUrls,
      if (signatureUrl != null) 'signature_url': signatureUrl,
      if (driverName != null) 'driver_name': driverName,
      if (truckPlate != null) 'truck_plate': truckPlate,
      if (itemCount != null) 'item_count': itemCount,
      if (discrepancyCount != null) 'discrepancy_count': discrepancyCount,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (syncedAt != null) 'synced_at': syncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ReceivingsCompanion copyWith(
      {Value<String>? id,
      Value<String>? storeId,
      Value<String>? storeName,
      Value<String>? storeCode,
      Value<String>? supplierType,
      Value<String>? supplierName,
      Value<String?>? poNumber,
      Value<DateTime?>? scheduledTime,
      Value<DateTime?>? arrivalTime,
      Value<String>? status,
      Value<String?>? verifiedById,
      Value<String?>? verifiedByName,
      Value<String?>? notes,
      Value<String>? photoUrls,
      Value<String?>? signatureUrl,
      Value<String?>? driverName,
      Value<String?>? truckPlate,
      Value<int?>? itemCount,
      Value<int>? discrepancyCount,
      Value<DateTime>? createdAt,
      Value<DateTime>? updatedAt,
      Value<DateTime?>? syncedAt,
      Value<int>? rowid}) {
    return ReceivingsCompanion(
      id: id ?? this.id,
      storeId: storeId ?? this.storeId,
      storeName: storeName ?? this.storeName,
      storeCode: storeCode ?? this.storeCode,
      supplierType: supplierType ?? this.supplierType,
      supplierName: supplierName ?? this.supplierName,
      poNumber: poNumber ?? this.poNumber,
      scheduledTime: scheduledTime ?? this.scheduledTime,
      arrivalTime: arrivalTime ?? this.arrivalTime,
      status: status ?? this.status,
      verifiedById: verifiedById ?? this.verifiedById,
      verifiedByName: verifiedByName ?? this.verifiedByName,
      notes: notes ?? this.notes,
      photoUrls: photoUrls ?? this.photoUrls,
      signatureUrl: signatureUrl ?? this.signatureUrl,
      driverName: driverName ?? this.driverName,
      truckPlate: truckPlate ?? this.truckPlate,
      itemCount: itemCount ?? this.itemCount,
      discrepancyCount: discrepancyCount ?? this.discrepancyCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      syncedAt: syncedAt ?? this.syncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (storeName.present) {
      map['store_name'] = Variable<String>(storeName.value);
    }
    if (storeCode.present) {
      map['store_code'] = Variable<String>(storeCode.value);
    }
    if (supplierType.present) {
      map['supplier_type'] = Variable<String>(supplierType.value);
    }
    if (supplierName.present) {
      map['supplier_name'] = Variable<String>(supplierName.value);
    }
    if (poNumber.present) {
      map['po_number'] = Variable<String>(poNumber.value);
    }
    if (scheduledTime.present) {
      map['scheduled_time'] = Variable<DateTime>(scheduledTime.value);
    }
    if (arrivalTime.present) {
      map['arrival_time'] = Variable<DateTime>(arrivalTime.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (verifiedById.present) {
      map['verified_by_id'] = Variable<String>(verifiedById.value);
    }
    if (verifiedByName.present) {
      map['verified_by_name'] = Variable<String>(verifiedByName.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (photoUrls.present) {
      map['photo_urls'] = Variable<String>(photoUrls.value);
    }
    if (signatureUrl.present) {
      map['signature_url'] = Variable<String>(signatureUrl.value);
    }
    if (driverName.present) {
      map['driver_name'] = Variable<String>(driverName.value);
    }
    if (truckPlate.present) {
      map['truck_plate'] = Variable<String>(truckPlate.value);
    }
    if (itemCount.present) {
      map['item_count'] = Variable<int>(itemCount.value);
    }
    if (discrepancyCount.present) {
      map['discrepancy_count'] = Variable<int>(discrepancyCount.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ReceivingsCompanion(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('storeName: $storeName, ')
          ..write('storeCode: $storeCode, ')
          ..write('supplierType: $supplierType, ')
          ..write('supplierName: $supplierName, ')
          ..write('poNumber: $poNumber, ')
          ..write('scheduledTime: $scheduledTime, ')
          ..write('arrivalTime: $arrivalTime, ')
          ..write('status: $status, ')
          ..write('verifiedById: $verifiedById, ')
          ..write('verifiedByName: $verifiedByName, ')
          ..write('notes: $notes, ')
          ..write('photoUrls: $photoUrls, ')
          ..write('signatureUrl: $signatureUrl, ')
          ..write('driverName: $driverName, ')
          ..write('truckPlate: $truckPlate, ')
          ..write('itemCount: $itemCount, ')
          ..write('discrepancyCount: $discrepancyCount, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('syncedAt: $syncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $DiscrepanciesTable extends Discrepancies
    with TableInfo<$DiscrepanciesTable, Discrepancy> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DiscrepanciesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _receivingIdMeta =
      const VerificationMeta('receivingId');
  @override
  late final GeneratedColumn<String> receivingId = GeneratedColumn<String>(
      'receiving_id', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: true,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('REFERENCES receivings (id)'));
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
      'type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _productInfoMeta =
      const VerificationMeta('productInfo');
  @override
  late final GeneratedColumn<String> productInfo = GeneratedColumn<String>(
      'product_info', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _quantityMeta =
      const VerificationMeta('quantity');
  @override
  late final GeneratedColumn<int> quantity = GeneratedColumn<int>(
      'quantity', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
      'notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _photoUrlsMeta =
      const VerificationMeta('photoUrls');
  @override
  late final GeneratedColumn<String> photoUrls = GeneratedColumn<String>(
      'photo_urls', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('[]'));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        receivingId,
        type,
        productInfo,
        quantity,
        notes,
        photoUrls,
        createdAt,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'discrepancies';
  @override
  VerificationContext validateIntegrity(Insertable<Discrepancy> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('receiving_id')) {
      context.handle(
          _receivingIdMeta,
          receivingId.isAcceptableOrUnknown(
              data['receiving_id']!, _receivingIdMeta));
    } else if (isInserting) {
      context.missing(_receivingIdMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
          _typeMeta, type.isAcceptableOrUnknown(data['type']!, _typeMeta));
    } else if (isInserting) {
      context.missing(_typeMeta);
    }
    if (data.containsKey('product_info')) {
      context.handle(
          _productInfoMeta,
          productInfo.isAcceptableOrUnknown(
              data['product_info']!, _productInfoMeta));
    } else if (isInserting) {
      context.missing(_productInfoMeta);
    }
    if (data.containsKey('quantity')) {
      context.handle(_quantityMeta,
          quantity.isAcceptableOrUnknown(data['quantity']!, _quantityMeta));
    }
    if (data.containsKey('notes')) {
      context.handle(
          _notesMeta, notes.isAcceptableOrUnknown(data['notes']!, _notesMeta));
    }
    if (data.containsKey('photo_urls')) {
      context.handle(_photoUrlsMeta,
          photoUrls.isAcceptableOrUnknown(data['photo_urls']!, _photoUrlsMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Discrepancy map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Discrepancy(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      receivingId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}receiving_id'])!,
      type: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}type'])!,
      productInfo: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}product_info'])!,
      quantity: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}quantity']),
      notes: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}notes']),
      photoUrls: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}photo_urls'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at']),
    );
  }

  @override
  $DiscrepanciesTable createAlias(String alias) {
    return $DiscrepanciesTable(attachedDatabase, alias);
  }
}

class Discrepancy extends DataClass implements Insertable<Discrepancy> {
  final String id;
  final String receivingId;
  final String type;
  final String productInfo;
  final int? quantity;
  final String? notes;
  final String photoUrls;
  final DateTime createdAt;
  final DateTime? syncedAt;
  const Discrepancy(
      {required this.id,
      required this.receivingId,
      required this.type,
      required this.productInfo,
      this.quantity,
      this.notes,
      required this.photoUrls,
      required this.createdAt,
      this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['receiving_id'] = Variable<String>(receivingId);
    map['type'] = Variable<String>(type);
    map['product_info'] = Variable<String>(productInfo);
    if (!nullToAbsent || quantity != null) {
      map['quantity'] = Variable<int>(quantity);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['photo_urls'] = Variable<String>(photoUrls);
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || syncedAt != null) {
      map['synced_at'] = Variable<DateTime>(syncedAt);
    }
    return map;
  }

  DiscrepanciesCompanion toCompanion(bool nullToAbsent) {
    return DiscrepanciesCompanion(
      id: Value(id),
      receivingId: Value(receivingId),
      type: Value(type),
      productInfo: Value(productInfo),
      quantity: quantity == null && nullToAbsent
          ? const Value.absent()
          : Value(quantity),
      notes:
          notes == null && nullToAbsent ? const Value.absent() : Value(notes),
      photoUrls: Value(photoUrls),
      createdAt: Value(createdAt),
      syncedAt: syncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(syncedAt),
    );
  }

  factory Discrepancy.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Discrepancy(
      id: serializer.fromJson<String>(json['id']),
      receivingId: serializer.fromJson<String>(json['receivingId']),
      type: serializer.fromJson<String>(json['type']),
      productInfo: serializer.fromJson<String>(json['productInfo']),
      quantity: serializer.fromJson<int?>(json['quantity']),
      notes: serializer.fromJson<String?>(json['notes']),
      photoUrls: serializer.fromJson<String>(json['photoUrls']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      syncedAt: serializer.fromJson<DateTime?>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'receivingId': serializer.toJson<String>(receivingId),
      'type': serializer.toJson<String>(type),
      'productInfo': serializer.toJson<String>(productInfo),
      'quantity': serializer.toJson<int?>(quantity),
      'notes': serializer.toJson<String?>(notes),
      'photoUrls': serializer.toJson<String>(photoUrls),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'syncedAt': serializer.toJson<DateTime?>(syncedAt),
    };
  }

  Discrepancy copyWith(
          {String? id,
          String? receivingId,
          String? type,
          String? productInfo,
          Value<int?> quantity = const Value.absent(),
          Value<String?> notes = const Value.absent(),
          String? photoUrls,
          DateTime? createdAt,
          Value<DateTime?> syncedAt = const Value.absent()}) =>
      Discrepancy(
        id: id ?? this.id,
        receivingId: receivingId ?? this.receivingId,
        type: type ?? this.type,
        productInfo: productInfo ?? this.productInfo,
        quantity: quantity.present ? quantity.value : this.quantity,
        notes: notes.present ? notes.value : this.notes,
        photoUrls: photoUrls ?? this.photoUrls,
        createdAt: createdAt ?? this.createdAt,
        syncedAt: syncedAt.present ? syncedAt.value : this.syncedAt,
      );
  @override
  String toString() {
    return (StringBuffer('Discrepancy(')
          ..write('id: $id, ')
          ..write('receivingId: $receivingId, ')
          ..write('type: $type, ')
          ..write('productInfo: $productInfo, ')
          ..write('quantity: $quantity, ')
          ..write('notes: $notes, ')
          ..write('photoUrls: $photoUrls, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, receivingId, type, productInfo, quantity,
      notes, photoUrls, createdAt, syncedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Discrepancy &&
          other.id == this.id &&
          other.receivingId == this.receivingId &&
          other.type == this.type &&
          other.productInfo == this.productInfo &&
          other.quantity == this.quantity &&
          other.notes == this.notes &&
          other.photoUrls == this.photoUrls &&
          other.createdAt == this.createdAt &&
          other.syncedAt == this.syncedAt);
}

class DiscrepanciesCompanion extends UpdateCompanion<Discrepancy> {
  final Value<String> id;
  final Value<String> receivingId;
  final Value<String> type;
  final Value<String> productInfo;
  final Value<int?> quantity;
  final Value<String?> notes;
  final Value<String> photoUrls;
  final Value<DateTime> createdAt;
  final Value<DateTime?> syncedAt;
  final Value<int> rowid;
  const DiscrepanciesCompanion({
    this.id = const Value.absent(),
    this.receivingId = const Value.absent(),
    this.type = const Value.absent(),
    this.productInfo = const Value.absent(),
    this.quantity = const Value.absent(),
    this.notes = const Value.absent(),
    this.photoUrls = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  DiscrepanciesCompanion.insert({
    required String id,
    required String receivingId,
    required String type,
    required String productInfo,
    this.quantity = const Value.absent(),
    this.notes = const Value.absent(),
    this.photoUrls = const Value.absent(),
    required DateTime createdAt,
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        receivingId = Value(receivingId),
        type = Value(type),
        productInfo = Value(productInfo),
        createdAt = Value(createdAt);
  static Insertable<Discrepancy> custom({
    Expression<String>? id,
    Expression<String>? receivingId,
    Expression<String>? type,
    Expression<String>? productInfo,
    Expression<int>? quantity,
    Expression<String>? notes,
    Expression<String>? photoUrls,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? syncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (receivingId != null) 'receiving_id': receivingId,
      if (type != null) 'type': type,
      if (productInfo != null) 'product_info': productInfo,
      if (quantity != null) 'quantity': quantity,
      if (notes != null) 'notes': notes,
      if (photoUrls != null) 'photo_urls': photoUrls,
      if (createdAt != null) 'created_at': createdAt,
      if (syncedAt != null) 'synced_at': syncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  DiscrepanciesCompanion copyWith(
      {Value<String>? id,
      Value<String>? receivingId,
      Value<String>? type,
      Value<String>? productInfo,
      Value<int?>? quantity,
      Value<String?>? notes,
      Value<String>? photoUrls,
      Value<DateTime>? createdAt,
      Value<DateTime?>? syncedAt,
      Value<int>? rowid}) {
    return DiscrepanciesCompanion(
      id: id ?? this.id,
      receivingId: receivingId ?? this.receivingId,
      type: type ?? this.type,
      productInfo: productInfo ?? this.productInfo,
      quantity: quantity ?? this.quantity,
      notes: notes ?? this.notes,
      photoUrls: photoUrls ?? this.photoUrls,
      createdAt: createdAt ?? this.createdAt,
      syncedAt: syncedAt ?? this.syncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (receivingId.present) {
      map['receiving_id'] = Variable<String>(receivingId.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (productInfo.present) {
      map['product_info'] = Variable<String>(productInfo.value);
    }
    if (quantity.present) {
      map['quantity'] = Variable<int>(quantity.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (photoUrls.present) {
      map['photo_urls'] = Variable<String>(photoUrls.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DiscrepanciesCompanion(')
          ..write('id: $id, ')
          ..write('receivingId: $receivingId, ')
          ..write('type: $type, ')
          ..write('productInfo: $productInfo, ')
          ..write('quantity: $quantity, ')
          ..write('notes: $notes, ')
          ..write('photoUrls: $photoUrls, ')
          ..write('createdAt: $createdAt, ')
          ..write('syncedAt: $syncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $IssuesTable extends Issues with TableInfo<$IssuesTable, Issue> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $IssuesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _storeIdMeta =
      const VerificationMeta('storeId');
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
      'store_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _storeNameMeta =
      const VerificationMeta('storeName');
  @override
  late final GeneratedColumn<String> storeName = GeneratedColumn<String>(
      'store_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _storeCodeMeta =
      const VerificationMeta('storeCode');
  @override
  late final GeneratedColumn<String> storeCode = GeneratedColumn<String>(
      'store_code', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _categoryMeta =
      const VerificationMeta('category');
  @override
  late final GeneratedColumn<String> category = GeneratedColumn<String>(
      'category', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _priorityMeta =
      const VerificationMeta('priority');
  @override
  late final GeneratedColumn<String> priority = GeneratedColumn<String>(
      'priority', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('MEDIUM'));
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _descriptionMeta =
      const VerificationMeta('description');
  @override
  late final GeneratedColumn<String> description = GeneratedColumn<String>(
      'description', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('REPORTED'));
  static const VerificationMeta _reportedByIdMeta =
      const VerificationMeta('reportedById');
  @override
  late final GeneratedColumn<String> reportedById = GeneratedColumn<String>(
      'reported_by_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _reportedByNameMeta =
      const VerificationMeta('reportedByName');
  @override
  late final GeneratedColumn<String> reportedByName = GeneratedColumn<String>(
      'reported_by_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _assignedToIdMeta =
      const VerificationMeta('assignedToId');
  @override
  late final GeneratedColumn<String> assignedToId = GeneratedColumn<String>(
      'assigned_to_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _assignedToNameMeta =
      const VerificationMeta('assignedToName');
  @override
  late final GeneratedColumn<String> assignedToName = GeneratedColumn<String>(
      'assigned_to_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _photoUrlsMeta =
      const VerificationMeta('photoUrls');
  @override
  late final GeneratedColumn<String> photoUrls = GeneratedColumn<String>(
      'photo_urls', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('[]'));
  static const VerificationMeta _resolutionNotesMeta =
      const VerificationMeta('resolutionNotes');
  @override
  late final GeneratedColumn<String> resolutionNotes = GeneratedColumn<String>(
      'resolution_notes', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _resolvedAtMeta =
      const VerificationMeta('resolvedAt');
  @override
  late final GeneratedColumn<DateTime> resolvedAt = GeneratedColumn<DateTime>(
      'resolved_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _escalatedAtMeta =
      const VerificationMeta('escalatedAt');
  @override
  late final GeneratedColumn<DateTime> escalatedAt = GeneratedColumn<DateTime>(
      'escalated_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _isEscalatedMeta =
      const VerificationMeta('isEscalated');
  @override
  late final GeneratedColumn<bool> isEscalated = GeneratedColumn<bool>(
      'is_escalated', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("is_escalated" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _syncedAtMeta =
      const VerificationMeta('syncedAt');
  @override
  late final GeneratedColumn<DateTime> syncedAt = GeneratedColumn<DateTime>(
      'synced_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        storeId,
        storeName,
        storeCode,
        category,
        priority,
        title,
        description,
        status,
        reportedById,
        reportedByName,
        assignedToId,
        assignedToName,
        photoUrls,
        resolutionNotes,
        resolvedAt,
        escalatedAt,
        isEscalated,
        createdAt,
        updatedAt,
        syncedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'issues';
  @override
  VerificationContext validateIntegrity(Insertable<Issue> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(_storeIdMeta,
          storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta));
    } else if (isInserting) {
      context.missing(_storeIdMeta);
    }
    if (data.containsKey('store_name')) {
      context.handle(_storeNameMeta,
          storeName.isAcceptableOrUnknown(data['store_name']!, _storeNameMeta));
    } else if (isInserting) {
      context.missing(_storeNameMeta);
    }
    if (data.containsKey('store_code')) {
      context.handle(_storeCodeMeta,
          storeCode.isAcceptableOrUnknown(data['store_code']!, _storeCodeMeta));
    } else if (isInserting) {
      context.missing(_storeCodeMeta);
    }
    if (data.containsKey('category')) {
      context.handle(_categoryMeta,
          category.isAcceptableOrUnknown(data['category']!, _categoryMeta));
    } else if (isInserting) {
      context.missing(_categoryMeta);
    }
    if (data.containsKey('priority')) {
      context.handle(_priorityMeta,
          priority.isAcceptableOrUnknown(data['priority']!, _priorityMeta));
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('description')) {
      context.handle(
          _descriptionMeta,
          description.isAcceptableOrUnknown(
              data['description']!, _descriptionMeta));
    } else if (isInserting) {
      context.missing(_descriptionMeta);
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('reported_by_id')) {
      context.handle(
          _reportedByIdMeta,
          reportedById.isAcceptableOrUnknown(
              data['reported_by_id']!, _reportedByIdMeta));
    } else if (isInserting) {
      context.missing(_reportedByIdMeta);
    }
    if (data.containsKey('reported_by_name')) {
      context.handle(
          _reportedByNameMeta,
          reportedByName.isAcceptableOrUnknown(
              data['reported_by_name']!, _reportedByNameMeta));
    } else if (isInserting) {
      context.missing(_reportedByNameMeta);
    }
    if (data.containsKey('assigned_to_id')) {
      context.handle(
          _assignedToIdMeta,
          assignedToId.isAcceptableOrUnknown(
              data['assigned_to_id']!, _assignedToIdMeta));
    }
    if (data.containsKey('assigned_to_name')) {
      context.handle(
          _assignedToNameMeta,
          assignedToName.isAcceptableOrUnknown(
              data['assigned_to_name']!, _assignedToNameMeta));
    }
    if (data.containsKey('photo_urls')) {
      context.handle(_photoUrlsMeta,
          photoUrls.isAcceptableOrUnknown(data['photo_urls']!, _photoUrlsMeta));
    }
    if (data.containsKey('resolution_notes')) {
      context.handle(
          _resolutionNotesMeta,
          resolutionNotes.isAcceptableOrUnknown(
              data['resolution_notes']!, _resolutionNotesMeta));
    }
    if (data.containsKey('resolved_at')) {
      context.handle(
          _resolvedAtMeta,
          resolvedAt.isAcceptableOrUnknown(
              data['resolved_at']!, _resolvedAtMeta));
    }
    if (data.containsKey('escalated_at')) {
      context.handle(
          _escalatedAtMeta,
          escalatedAt.isAcceptableOrUnknown(
              data['escalated_at']!, _escalatedAtMeta));
    }
    if (data.containsKey('is_escalated')) {
      context.handle(
          _isEscalatedMeta,
          isEscalated.isAcceptableOrUnknown(
              data['is_escalated']!, _isEscalatedMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    if (data.containsKey('synced_at')) {
      context.handle(_syncedAtMeta,
          syncedAt.isAcceptableOrUnknown(data['synced_at']!, _syncedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Issue map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Issue(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      storeId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}store_id'])!,
      storeName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}store_name'])!,
      storeCode: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}store_code'])!,
      category: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}category'])!,
      priority: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}priority'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      description: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}description'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      reportedById: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}reported_by_id'])!,
      reportedByName: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}reported_by_name'])!,
      assignedToId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}assigned_to_id']),
      assignedToName: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}assigned_to_name']),
      photoUrls: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}photo_urls'])!,
      resolutionNotes: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}resolution_notes']),
      resolvedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}resolved_at']),
      escalatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}escalated_at']),
      isEscalated: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_escalated'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      syncedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}synced_at']),
    );
  }

  @override
  $IssuesTable createAlias(String alias) {
    return $IssuesTable(attachedDatabase, alias);
  }
}

class Issue extends DataClass implements Insertable<Issue> {
  final String id;
  final String storeId;
  final String storeName;
  final String storeCode;
  final String category;
  final String priority;
  final String title;
  final String description;
  final String status;
  final String reportedById;
  final String reportedByName;
  final String? assignedToId;
  final String? assignedToName;
  final String photoUrls;
  final String? resolutionNotes;
  final DateTime? resolvedAt;
  final DateTime? escalatedAt;
  final bool isEscalated;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? syncedAt;
  const Issue(
      {required this.id,
      required this.storeId,
      required this.storeName,
      required this.storeCode,
      required this.category,
      required this.priority,
      required this.title,
      required this.description,
      required this.status,
      required this.reportedById,
      required this.reportedByName,
      this.assignedToId,
      this.assignedToName,
      required this.photoUrls,
      this.resolutionNotes,
      this.resolvedAt,
      this.escalatedAt,
      required this.isEscalated,
      required this.createdAt,
      required this.updatedAt,
      this.syncedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['store_id'] = Variable<String>(storeId);
    map['store_name'] = Variable<String>(storeName);
    map['store_code'] = Variable<String>(storeCode);
    map['category'] = Variable<String>(category);
    map['priority'] = Variable<String>(priority);
    map['title'] = Variable<String>(title);
    map['description'] = Variable<String>(description);
    map['status'] = Variable<String>(status);
    map['reported_by_id'] = Variable<String>(reportedById);
    map['reported_by_name'] = Variable<String>(reportedByName);
    if (!nullToAbsent || assignedToId != null) {
      map['assigned_to_id'] = Variable<String>(assignedToId);
    }
    if (!nullToAbsent || assignedToName != null) {
      map['assigned_to_name'] = Variable<String>(assignedToName);
    }
    map['photo_urls'] = Variable<String>(photoUrls);
    if (!nullToAbsent || resolutionNotes != null) {
      map['resolution_notes'] = Variable<String>(resolutionNotes);
    }
    if (!nullToAbsent || resolvedAt != null) {
      map['resolved_at'] = Variable<DateTime>(resolvedAt);
    }
    if (!nullToAbsent || escalatedAt != null) {
      map['escalated_at'] = Variable<DateTime>(escalatedAt);
    }
    map['is_escalated'] = Variable<bool>(isEscalated);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    if (!nullToAbsent || syncedAt != null) {
      map['synced_at'] = Variable<DateTime>(syncedAt);
    }
    return map;
  }

  IssuesCompanion toCompanion(bool nullToAbsent) {
    return IssuesCompanion(
      id: Value(id),
      storeId: Value(storeId),
      storeName: Value(storeName),
      storeCode: Value(storeCode),
      category: Value(category),
      priority: Value(priority),
      title: Value(title),
      description: Value(description),
      status: Value(status),
      reportedById: Value(reportedById),
      reportedByName: Value(reportedByName),
      assignedToId: assignedToId == null && nullToAbsent
          ? const Value.absent()
          : Value(assignedToId),
      assignedToName: assignedToName == null && nullToAbsent
          ? const Value.absent()
          : Value(assignedToName),
      photoUrls: Value(photoUrls),
      resolutionNotes: resolutionNotes == null && nullToAbsent
          ? const Value.absent()
          : Value(resolutionNotes),
      resolvedAt: resolvedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(resolvedAt),
      escalatedAt: escalatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(escalatedAt),
      isEscalated: Value(isEscalated),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
      syncedAt: syncedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(syncedAt),
    );
  }

  factory Issue.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Issue(
      id: serializer.fromJson<String>(json['id']),
      storeId: serializer.fromJson<String>(json['storeId']),
      storeName: serializer.fromJson<String>(json['storeName']),
      storeCode: serializer.fromJson<String>(json['storeCode']),
      category: serializer.fromJson<String>(json['category']),
      priority: serializer.fromJson<String>(json['priority']),
      title: serializer.fromJson<String>(json['title']),
      description: serializer.fromJson<String>(json['description']),
      status: serializer.fromJson<String>(json['status']),
      reportedById: serializer.fromJson<String>(json['reportedById']),
      reportedByName: serializer.fromJson<String>(json['reportedByName']),
      assignedToId: serializer.fromJson<String?>(json['assignedToId']),
      assignedToName: serializer.fromJson<String?>(json['assignedToName']),
      photoUrls: serializer.fromJson<String>(json['photoUrls']),
      resolutionNotes: serializer.fromJson<String?>(json['resolutionNotes']),
      resolvedAt: serializer.fromJson<DateTime?>(json['resolvedAt']),
      escalatedAt: serializer.fromJson<DateTime?>(json['escalatedAt']),
      isEscalated: serializer.fromJson<bool>(json['isEscalated']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      syncedAt: serializer.fromJson<DateTime?>(json['syncedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'storeId': serializer.toJson<String>(storeId),
      'storeName': serializer.toJson<String>(storeName),
      'storeCode': serializer.toJson<String>(storeCode),
      'category': serializer.toJson<String>(category),
      'priority': serializer.toJson<String>(priority),
      'title': serializer.toJson<String>(title),
      'description': serializer.toJson<String>(description),
      'status': serializer.toJson<String>(status),
      'reportedById': serializer.toJson<String>(reportedById),
      'reportedByName': serializer.toJson<String>(reportedByName),
      'assignedToId': serializer.toJson<String?>(assignedToId),
      'assignedToName': serializer.toJson<String?>(assignedToName),
      'photoUrls': serializer.toJson<String>(photoUrls),
      'resolutionNotes': serializer.toJson<String?>(resolutionNotes),
      'resolvedAt': serializer.toJson<DateTime?>(resolvedAt),
      'escalatedAt': serializer.toJson<DateTime?>(escalatedAt),
      'isEscalated': serializer.toJson<bool>(isEscalated),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'syncedAt': serializer.toJson<DateTime?>(syncedAt),
    };
  }

  Issue copyWith(
          {String? id,
          String? storeId,
          String? storeName,
          String? storeCode,
          String? category,
          String? priority,
          String? title,
          String? description,
          String? status,
          String? reportedById,
          String? reportedByName,
          Value<String?> assignedToId = const Value.absent(),
          Value<String?> assignedToName = const Value.absent(),
          String? photoUrls,
          Value<String?> resolutionNotes = const Value.absent(),
          Value<DateTime?> resolvedAt = const Value.absent(),
          Value<DateTime?> escalatedAt = const Value.absent(),
          bool? isEscalated,
          DateTime? createdAt,
          DateTime? updatedAt,
          Value<DateTime?> syncedAt = const Value.absent()}) =>
      Issue(
        id: id ?? this.id,
        storeId: storeId ?? this.storeId,
        storeName: storeName ?? this.storeName,
        storeCode: storeCode ?? this.storeCode,
        category: category ?? this.category,
        priority: priority ?? this.priority,
        title: title ?? this.title,
        description: description ?? this.description,
        status: status ?? this.status,
        reportedById: reportedById ?? this.reportedById,
        reportedByName: reportedByName ?? this.reportedByName,
        assignedToId:
            assignedToId.present ? assignedToId.value : this.assignedToId,
        assignedToName:
            assignedToName.present ? assignedToName.value : this.assignedToName,
        photoUrls: photoUrls ?? this.photoUrls,
        resolutionNotes: resolutionNotes.present
            ? resolutionNotes.value
            : this.resolutionNotes,
        resolvedAt: resolvedAt.present ? resolvedAt.value : this.resolvedAt,
        escalatedAt: escalatedAt.present ? escalatedAt.value : this.escalatedAt,
        isEscalated: isEscalated ?? this.isEscalated,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
        syncedAt: syncedAt.present ? syncedAt.value : this.syncedAt,
      );
  @override
  String toString() {
    return (StringBuffer('Issue(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('storeName: $storeName, ')
          ..write('storeCode: $storeCode, ')
          ..write('category: $category, ')
          ..write('priority: $priority, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('status: $status, ')
          ..write('reportedById: $reportedById, ')
          ..write('reportedByName: $reportedByName, ')
          ..write('assignedToId: $assignedToId, ')
          ..write('assignedToName: $assignedToName, ')
          ..write('photoUrls: $photoUrls, ')
          ..write('resolutionNotes: $resolutionNotes, ')
          ..write('resolvedAt: $resolvedAt, ')
          ..write('escalatedAt: $escalatedAt, ')
          ..write('isEscalated: $isEscalated, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('syncedAt: $syncedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
        id,
        storeId,
        storeName,
        storeCode,
        category,
        priority,
        title,
        description,
        status,
        reportedById,
        reportedByName,
        assignedToId,
        assignedToName,
        photoUrls,
        resolutionNotes,
        resolvedAt,
        escalatedAt,
        isEscalated,
        createdAt,
        updatedAt,
        syncedAt
      ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Issue &&
          other.id == this.id &&
          other.storeId == this.storeId &&
          other.storeName == this.storeName &&
          other.storeCode == this.storeCode &&
          other.category == this.category &&
          other.priority == this.priority &&
          other.title == this.title &&
          other.description == this.description &&
          other.status == this.status &&
          other.reportedById == this.reportedById &&
          other.reportedByName == this.reportedByName &&
          other.assignedToId == this.assignedToId &&
          other.assignedToName == this.assignedToName &&
          other.photoUrls == this.photoUrls &&
          other.resolutionNotes == this.resolutionNotes &&
          other.resolvedAt == this.resolvedAt &&
          other.escalatedAt == this.escalatedAt &&
          other.isEscalated == this.isEscalated &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt &&
          other.syncedAt == this.syncedAt);
}

class IssuesCompanion extends UpdateCompanion<Issue> {
  final Value<String> id;
  final Value<String> storeId;
  final Value<String> storeName;
  final Value<String> storeCode;
  final Value<String> category;
  final Value<String> priority;
  final Value<String> title;
  final Value<String> description;
  final Value<String> status;
  final Value<String> reportedById;
  final Value<String> reportedByName;
  final Value<String?> assignedToId;
  final Value<String?> assignedToName;
  final Value<String> photoUrls;
  final Value<String?> resolutionNotes;
  final Value<DateTime?> resolvedAt;
  final Value<DateTime?> escalatedAt;
  final Value<bool> isEscalated;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<DateTime?> syncedAt;
  final Value<int> rowid;
  const IssuesCompanion({
    this.id = const Value.absent(),
    this.storeId = const Value.absent(),
    this.storeName = const Value.absent(),
    this.storeCode = const Value.absent(),
    this.category = const Value.absent(),
    this.priority = const Value.absent(),
    this.title = const Value.absent(),
    this.description = const Value.absent(),
    this.status = const Value.absent(),
    this.reportedById = const Value.absent(),
    this.reportedByName = const Value.absent(),
    this.assignedToId = const Value.absent(),
    this.assignedToName = const Value.absent(),
    this.photoUrls = const Value.absent(),
    this.resolutionNotes = const Value.absent(),
    this.resolvedAt = const Value.absent(),
    this.escalatedAt = const Value.absent(),
    this.isEscalated = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  IssuesCompanion.insert({
    required String id,
    required String storeId,
    required String storeName,
    required String storeCode,
    required String category,
    this.priority = const Value.absent(),
    required String title,
    required String description,
    this.status = const Value.absent(),
    required String reportedById,
    required String reportedByName,
    this.assignedToId = const Value.absent(),
    this.assignedToName = const Value.absent(),
    this.photoUrls = const Value.absent(),
    this.resolutionNotes = const Value.absent(),
    this.resolvedAt = const Value.absent(),
    this.escalatedAt = const Value.absent(),
    this.isEscalated = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.syncedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        storeId = Value(storeId),
        storeName = Value(storeName),
        storeCode = Value(storeCode),
        category = Value(category),
        title = Value(title),
        description = Value(description),
        reportedById = Value(reportedById),
        reportedByName = Value(reportedByName),
        createdAt = Value(createdAt),
        updatedAt = Value(updatedAt);
  static Insertable<Issue> custom({
    Expression<String>? id,
    Expression<String>? storeId,
    Expression<String>? storeName,
    Expression<String>? storeCode,
    Expression<String>? category,
    Expression<String>? priority,
    Expression<String>? title,
    Expression<String>? description,
    Expression<String>? status,
    Expression<String>? reportedById,
    Expression<String>? reportedByName,
    Expression<String>? assignedToId,
    Expression<String>? assignedToName,
    Expression<String>? photoUrls,
    Expression<String>? resolutionNotes,
    Expression<DateTime>? resolvedAt,
    Expression<DateTime>? escalatedAt,
    Expression<bool>? isEscalated,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<DateTime>? syncedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (storeId != null) 'store_id': storeId,
      if (storeName != null) 'store_name': storeName,
      if (storeCode != null) 'store_code': storeCode,
      if (category != null) 'category': category,
      if (priority != null) 'priority': priority,
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (status != null) 'status': status,
      if (reportedById != null) 'reported_by_id': reportedById,
      if (reportedByName != null) 'reported_by_name': reportedByName,
      if (assignedToId != null) 'assigned_to_id': assignedToId,
      if (assignedToName != null) 'assigned_to_name': assignedToName,
      if (photoUrls != null) 'photo_urls': photoUrls,
      if (resolutionNotes != null) 'resolution_notes': resolutionNotes,
      if (resolvedAt != null) 'resolved_at': resolvedAt,
      if (escalatedAt != null) 'escalated_at': escalatedAt,
      if (isEscalated != null) 'is_escalated': isEscalated,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (syncedAt != null) 'synced_at': syncedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  IssuesCompanion copyWith(
      {Value<String>? id,
      Value<String>? storeId,
      Value<String>? storeName,
      Value<String>? storeCode,
      Value<String>? category,
      Value<String>? priority,
      Value<String>? title,
      Value<String>? description,
      Value<String>? status,
      Value<String>? reportedById,
      Value<String>? reportedByName,
      Value<String?>? assignedToId,
      Value<String?>? assignedToName,
      Value<String>? photoUrls,
      Value<String?>? resolutionNotes,
      Value<DateTime?>? resolvedAt,
      Value<DateTime?>? escalatedAt,
      Value<bool>? isEscalated,
      Value<DateTime>? createdAt,
      Value<DateTime>? updatedAt,
      Value<DateTime?>? syncedAt,
      Value<int>? rowid}) {
    return IssuesCompanion(
      id: id ?? this.id,
      storeId: storeId ?? this.storeId,
      storeName: storeName ?? this.storeName,
      storeCode: storeCode ?? this.storeCode,
      category: category ?? this.category,
      priority: priority ?? this.priority,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      reportedById: reportedById ?? this.reportedById,
      reportedByName: reportedByName ?? this.reportedByName,
      assignedToId: assignedToId ?? this.assignedToId,
      assignedToName: assignedToName ?? this.assignedToName,
      photoUrls: photoUrls ?? this.photoUrls,
      resolutionNotes: resolutionNotes ?? this.resolutionNotes,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      escalatedAt: escalatedAt ?? this.escalatedAt,
      isEscalated: isEscalated ?? this.isEscalated,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      syncedAt: syncedAt ?? this.syncedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (storeName.present) {
      map['store_name'] = Variable<String>(storeName.value);
    }
    if (storeCode.present) {
      map['store_code'] = Variable<String>(storeCode.value);
    }
    if (category.present) {
      map['category'] = Variable<String>(category.value);
    }
    if (priority.present) {
      map['priority'] = Variable<String>(priority.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (description.present) {
      map['description'] = Variable<String>(description.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (reportedById.present) {
      map['reported_by_id'] = Variable<String>(reportedById.value);
    }
    if (reportedByName.present) {
      map['reported_by_name'] = Variable<String>(reportedByName.value);
    }
    if (assignedToId.present) {
      map['assigned_to_id'] = Variable<String>(assignedToId.value);
    }
    if (assignedToName.present) {
      map['assigned_to_name'] = Variable<String>(assignedToName.value);
    }
    if (photoUrls.present) {
      map['photo_urls'] = Variable<String>(photoUrls.value);
    }
    if (resolutionNotes.present) {
      map['resolution_notes'] = Variable<String>(resolutionNotes.value);
    }
    if (resolvedAt.present) {
      map['resolved_at'] = Variable<DateTime>(resolvedAt.value);
    }
    if (escalatedAt.present) {
      map['escalated_at'] = Variable<DateTime>(escalatedAt.value);
    }
    if (isEscalated.present) {
      map['is_escalated'] = Variable<bool>(isEscalated.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (syncedAt.present) {
      map['synced_at'] = Variable<DateTime>(syncedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('IssuesCompanion(')
          ..write('id: $id, ')
          ..write('storeId: $storeId, ')
          ..write('storeName: $storeName, ')
          ..write('storeCode: $storeCode, ')
          ..write('category: $category, ')
          ..write('priority: $priority, ')
          ..write('title: $title, ')
          ..write('description: $description, ')
          ..write('status: $status, ')
          ..write('reportedById: $reportedById, ')
          ..write('reportedByName: $reportedByName, ')
          ..write('assignedToId: $assignedToId, ')
          ..write('assignedToName: $assignedToName, ')
          ..write('photoUrls: $photoUrls, ')
          ..write('resolutionNotes: $resolutionNotes, ')
          ..write('resolvedAt: $resolvedAt, ')
          ..write('escalatedAt: $escalatedAt, ')
          ..write('isEscalated: $isEscalated, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('syncedAt: $syncedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncQueueTable extends SyncQueue
    with TableInfo<$SyncQueueTable, SyncQueueEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncQueueTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
      'id', aliasedName, false,
      hasAutoIncrement: true,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('PRIMARY KEY AUTOINCREMENT'));
  static const VerificationMeta _entityTypeMeta =
      const VerificationMeta('entityType');
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
      'entity_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _entityIdMeta =
      const VerificationMeta('entityId');
  @override
  late final GeneratedColumn<String> entityId = GeneratedColumn<String>(
      'entity_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _operationMeta =
      const VerificationMeta('operation');
  @override
  late final GeneratedColumn<String> operation = GeneratedColumn<String>(
      'operation', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
      'payload', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _retryCountMeta =
      const VerificationMeta('retryCount');
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
      'retry_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _errorMessageMeta =
      const VerificationMeta('errorMessage');
  @override
  late final GeneratedColumn<String> errorMessage = GeneratedColumn<String>(
      'error_message', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _lastAttemptAtMeta =
      const VerificationMeta('lastAttemptAt');
  @override
  late final GeneratedColumn<DateTime> lastAttemptAt =
      GeneratedColumn<DateTime>('last_attempt_at', aliasedName, true,
          type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _isPendingMeta =
      const VerificationMeta('isPending');
  @override
  late final GeneratedColumn<bool> isPending = GeneratedColumn<bool>(
      'is_pending', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_pending" IN (0, 1))'),
      defaultValue: const Constant(true));
  @override
  List<GeneratedColumn> get $columns => [
        id,
        entityType,
        entityId,
        operation,
        payload,
        retryCount,
        errorMessage,
        createdAt,
        lastAttemptAt,
        isPending
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_queue';
  @override
  VerificationContext validateIntegrity(Insertable<SyncQueueEntry> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('entity_type')) {
      context.handle(
          _entityTypeMeta,
          entityType.isAcceptableOrUnknown(
              data['entity_type']!, _entityTypeMeta));
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('entity_id')) {
      context.handle(_entityIdMeta,
          entityId.isAcceptableOrUnknown(data['entity_id']!, _entityIdMeta));
    } else if (isInserting) {
      context.missing(_entityIdMeta);
    }
    if (data.containsKey('operation')) {
      context.handle(_operationMeta,
          operation.isAcceptableOrUnknown(data['operation']!, _operationMeta));
    } else if (isInserting) {
      context.missing(_operationMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('retry_count')) {
      context.handle(
          _retryCountMeta,
          retryCount.isAcceptableOrUnknown(
              data['retry_count']!, _retryCountMeta));
    }
    if (data.containsKey('error_message')) {
      context.handle(
          _errorMessageMeta,
          errorMessage.isAcceptableOrUnknown(
              data['error_message']!, _errorMessageMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('last_attempt_at')) {
      context.handle(
          _lastAttemptAtMeta,
          lastAttemptAt.isAcceptableOrUnknown(
              data['last_attempt_at']!, _lastAttemptAtMeta));
    }
    if (data.containsKey('is_pending')) {
      context.handle(_isPendingMeta,
          isPending.isAcceptableOrUnknown(data['is_pending']!, _isPendingMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncQueueEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncQueueEntry(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}id'])!,
      entityType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_type'])!,
      entityId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_id'])!,
      operation: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}operation'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload'])!,
      retryCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}retry_count'])!,
      errorMessage: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}error_message']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      lastAttemptAt: attachedDatabase.typeMapping.read(
          DriftSqlType.dateTime, data['${effectivePrefix}last_attempt_at']),
      isPending: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_pending'])!,
    );
  }

  @override
  $SyncQueueTable createAlias(String alias) {
    return $SyncQueueTable(attachedDatabase, alias);
  }
}

class SyncQueueEntry extends DataClass implements Insertable<SyncQueueEntry> {
  final int id;
  final String entityType;
  final String entityId;
  final String operation;
  final String payload;
  final int retryCount;
  final String? errorMessage;
  final DateTime createdAt;
  final DateTime? lastAttemptAt;
  final bool isPending;
  const SyncQueueEntry(
      {required this.id,
      required this.entityType,
      required this.entityId,
      required this.operation,
      required this.payload,
      required this.retryCount,
      this.errorMessage,
      required this.createdAt,
      this.lastAttemptAt,
      required this.isPending});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['entity_type'] = Variable<String>(entityType);
    map['entity_id'] = Variable<String>(entityId);
    map['operation'] = Variable<String>(operation);
    map['payload'] = Variable<String>(payload);
    map['retry_count'] = Variable<int>(retryCount);
    if (!nullToAbsent || errorMessage != null) {
      map['error_message'] = Variable<String>(errorMessage);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || lastAttemptAt != null) {
      map['last_attempt_at'] = Variable<DateTime>(lastAttemptAt);
    }
    map['is_pending'] = Variable<bool>(isPending);
    return map;
  }

  SyncQueueCompanion toCompanion(bool nullToAbsent) {
    return SyncQueueCompanion(
      id: Value(id),
      entityType: Value(entityType),
      entityId: Value(entityId),
      operation: Value(operation),
      payload: Value(payload),
      retryCount: Value(retryCount),
      errorMessage: errorMessage == null && nullToAbsent
          ? const Value.absent()
          : Value(errorMessage),
      createdAt: Value(createdAt),
      lastAttemptAt: lastAttemptAt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastAttemptAt),
      isPending: Value(isPending),
    );
  }

  factory SyncQueueEntry.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncQueueEntry(
      id: serializer.fromJson<int>(json['id']),
      entityType: serializer.fromJson<String>(json['entityType']),
      entityId: serializer.fromJson<String>(json['entityId']),
      operation: serializer.fromJson<String>(json['operation']),
      payload: serializer.fromJson<String>(json['payload']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
      errorMessage: serializer.fromJson<String?>(json['errorMessage']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      lastAttemptAt: serializer.fromJson<DateTime?>(json['lastAttemptAt']),
      isPending: serializer.fromJson<bool>(json['isPending']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'entityType': serializer.toJson<String>(entityType),
      'entityId': serializer.toJson<String>(entityId),
      'operation': serializer.toJson<String>(operation),
      'payload': serializer.toJson<String>(payload),
      'retryCount': serializer.toJson<int>(retryCount),
      'errorMessage': serializer.toJson<String?>(errorMessage),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'lastAttemptAt': serializer.toJson<DateTime?>(lastAttemptAt),
      'isPending': serializer.toJson<bool>(isPending),
    };
  }

  SyncQueueEntry copyWith(
          {int? id,
          String? entityType,
          String? entityId,
          String? operation,
          String? payload,
          int? retryCount,
          Value<String?> errorMessage = const Value.absent(),
          DateTime? createdAt,
          Value<DateTime?> lastAttemptAt = const Value.absent(),
          bool? isPending}) =>
      SyncQueueEntry(
        id: id ?? this.id,
        entityType: entityType ?? this.entityType,
        entityId: entityId ?? this.entityId,
        operation: operation ?? this.operation,
        payload: payload ?? this.payload,
        retryCount: retryCount ?? this.retryCount,
        errorMessage:
            errorMessage.present ? errorMessage.value : this.errorMessage,
        createdAt: createdAt ?? this.createdAt,
        lastAttemptAt:
            lastAttemptAt.present ? lastAttemptAt.value : this.lastAttemptAt,
        isPending: isPending ?? this.isPending,
      );
  @override
  String toString() {
    return (StringBuffer('SyncQueueEntry(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('retryCount: $retryCount, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('createdAt: $createdAt, ')
          ..write('lastAttemptAt: $lastAttemptAt, ')
          ..write('isPending: $isPending')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, entityType, entityId, operation, payload,
      retryCount, errorMessage, createdAt, lastAttemptAt, isPending);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncQueueEntry &&
          other.id == this.id &&
          other.entityType == this.entityType &&
          other.entityId == this.entityId &&
          other.operation == this.operation &&
          other.payload == this.payload &&
          other.retryCount == this.retryCount &&
          other.errorMessage == this.errorMessage &&
          other.createdAt == this.createdAt &&
          other.lastAttemptAt == this.lastAttemptAt &&
          other.isPending == this.isPending);
}

class SyncQueueCompanion extends UpdateCompanion<SyncQueueEntry> {
  final Value<int> id;
  final Value<String> entityType;
  final Value<String> entityId;
  final Value<String> operation;
  final Value<String> payload;
  final Value<int> retryCount;
  final Value<String?> errorMessage;
  final Value<DateTime> createdAt;
  final Value<DateTime?> lastAttemptAt;
  final Value<bool> isPending;
  const SyncQueueCompanion({
    this.id = const Value.absent(),
    this.entityType = const Value.absent(),
    this.entityId = const Value.absent(),
    this.operation = const Value.absent(),
    this.payload = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.errorMessage = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.lastAttemptAt = const Value.absent(),
    this.isPending = const Value.absent(),
  });
  SyncQueueCompanion.insert({
    this.id = const Value.absent(),
    required String entityType,
    required String entityId,
    required String operation,
    required String payload,
    this.retryCount = const Value.absent(),
    this.errorMessage = const Value.absent(),
    required DateTime createdAt,
    this.lastAttemptAt = const Value.absent(),
    this.isPending = const Value.absent(),
  })  : entityType = Value(entityType),
        entityId = Value(entityId),
        operation = Value(operation),
        payload = Value(payload),
        createdAt = Value(createdAt);
  static Insertable<SyncQueueEntry> custom({
    Expression<int>? id,
    Expression<String>? entityType,
    Expression<String>? entityId,
    Expression<String>? operation,
    Expression<String>? payload,
    Expression<int>? retryCount,
    Expression<String>? errorMessage,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? lastAttemptAt,
    Expression<bool>? isPending,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (entityType != null) 'entity_type': entityType,
      if (entityId != null) 'entity_id': entityId,
      if (operation != null) 'operation': operation,
      if (payload != null) 'payload': payload,
      if (retryCount != null) 'retry_count': retryCount,
      if (errorMessage != null) 'error_message': errorMessage,
      if (createdAt != null) 'created_at': createdAt,
      if (lastAttemptAt != null) 'last_attempt_at': lastAttemptAt,
      if (isPending != null) 'is_pending': isPending,
    });
  }

  SyncQueueCompanion copyWith(
      {Value<int>? id,
      Value<String>? entityType,
      Value<String>? entityId,
      Value<String>? operation,
      Value<String>? payload,
      Value<int>? retryCount,
      Value<String?>? errorMessage,
      Value<DateTime>? createdAt,
      Value<DateTime?>? lastAttemptAt,
      Value<bool>? isPending}) {
    return SyncQueueCompanion(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      operation: operation ?? this.operation,
      payload: payload ?? this.payload,
      retryCount: retryCount ?? this.retryCount,
      errorMessage: errorMessage ?? this.errorMessage,
      createdAt: createdAt ?? this.createdAt,
      lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
      isPending: isPending ?? this.isPending,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (entityId.present) {
      map['entity_id'] = Variable<String>(entityId.value);
    }
    if (operation.present) {
      map['operation'] = Variable<String>(operation.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (errorMessage.present) {
      map['error_message'] = Variable<String>(errorMessage.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (lastAttemptAt.present) {
      map['last_attempt_at'] = Variable<DateTime>(lastAttemptAt.value);
    }
    if (isPending.present) {
      map['is_pending'] = Variable<bool>(isPending.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueCompanion(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('operation: $operation, ')
          ..write('payload: $payload, ')
          ..write('retryCount: $retryCount, ')
          ..write('errorMessage: $errorMessage, ')
          ..write('createdAt: $createdAt, ')
          ..write('lastAttemptAt: $lastAttemptAt, ')
          ..write('isPending: $isPending')
          ..write(')'))
        .toString();
  }
}

class $CachedUsersTable extends CachedUsers
    with TableInfo<$CachedUsersTable, CachedUser> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedUsersTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _emailMeta = const VerificationMeta('email');
  @override
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
      'email', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _roleMeta = const VerificationMeta('role');
  @override
  late final GeneratedColumn<String> role = GeneratedColumn<String>(
      'role', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _storeIdMeta =
      const VerificationMeta('storeId');
  @override
  late final GeneratedColumn<String> storeId = GeneratedColumn<String>(
      'store_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _departmentIdMeta =
      const VerificationMeta('departmentId');
  @override
  late final GeneratedColumn<String> departmentId = GeneratedColumn<String>(
      'department_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _isActiveMeta =
      const VerificationMeta('isActive');
  @override
  late final GeneratedColumn<bool> isActive = GeneratedColumn<bool>(
      'is_active', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_active" IN (0, 1))'),
      defaultValue: const Constant(true));
  static const VerificationMeta _cachedAtMeta =
      const VerificationMeta('cachedAt');
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
      'cached_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns =>
      [id, email, name, role, storeId, departmentId, isActive, cachedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_users';
  @override
  VerificationContext validateIntegrity(Insertable<CachedUser> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('email')) {
      context.handle(
          _emailMeta, email.isAcceptableOrUnknown(data['email']!, _emailMeta));
    } else if (isInserting) {
      context.missing(_emailMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('role')) {
      context.handle(
          _roleMeta, role.isAcceptableOrUnknown(data['role']!, _roleMeta));
    } else if (isInserting) {
      context.missing(_roleMeta);
    }
    if (data.containsKey('store_id')) {
      context.handle(_storeIdMeta,
          storeId.isAcceptableOrUnknown(data['store_id']!, _storeIdMeta));
    }
    if (data.containsKey('department_id')) {
      context.handle(
          _departmentIdMeta,
          departmentId.isAcceptableOrUnknown(
              data['department_id']!, _departmentIdMeta));
    }
    if (data.containsKey('is_active')) {
      context.handle(_isActiveMeta,
          isActive.isAcceptableOrUnknown(data['is_active']!, _isActiveMeta));
    }
    if (data.containsKey('cached_at')) {
      context.handle(_cachedAtMeta,
          cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta));
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedUser map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedUser(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      email: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}email'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      role: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}role'])!,
      storeId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}store_id']),
      departmentId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}department_id']),
      isActive: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_active'])!,
      cachedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}cached_at'])!,
    );
  }

  @override
  $CachedUsersTable createAlias(String alias) {
    return $CachedUsersTable(attachedDatabase, alias);
  }
}

class CachedUser extends DataClass implements Insertable<CachedUser> {
  final String id;
  final String email;
  final String name;
  final String role;
  final String? storeId;
  final String? departmentId;
  final bool isActive;
  final DateTime cachedAt;
  const CachedUser(
      {required this.id,
      required this.email,
      required this.name,
      required this.role,
      this.storeId,
      this.departmentId,
      required this.isActive,
      required this.cachedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['email'] = Variable<String>(email);
    map['name'] = Variable<String>(name);
    map['role'] = Variable<String>(role);
    if (!nullToAbsent || storeId != null) {
      map['store_id'] = Variable<String>(storeId);
    }
    if (!nullToAbsent || departmentId != null) {
      map['department_id'] = Variable<String>(departmentId);
    }
    map['is_active'] = Variable<bool>(isActive);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedUsersCompanion toCompanion(bool nullToAbsent) {
    return CachedUsersCompanion(
      id: Value(id),
      email: Value(email),
      name: Value(name),
      role: Value(role),
      storeId: storeId == null && nullToAbsent
          ? const Value.absent()
          : Value(storeId),
      departmentId: departmentId == null && nullToAbsent
          ? const Value.absent()
          : Value(departmentId),
      isActive: Value(isActive),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedUser.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedUser(
      id: serializer.fromJson<String>(json['id']),
      email: serializer.fromJson<String>(json['email']),
      name: serializer.fromJson<String>(json['name']),
      role: serializer.fromJson<String>(json['role']),
      storeId: serializer.fromJson<String?>(json['storeId']),
      departmentId: serializer.fromJson<String?>(json['departmentId']),
      isActive: serializer.fromJson<bool>(json['isActive']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'email': serializer.toJson<String>(email),
      'name': serializer.toJson<String>(name),
      'role': serializer.toJson<String>(role),
      'storeId': serializer.toJson<String?>(storeId),
      'departmentId': serializer.toJson<String?>(departmentId),
      'isActive': serializer.toJson<bool>(isActive),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedUser copyWith(
          {String? id,
          String? email,
          String? name,
          String? role,
          Value<String?> storeId = const Value.absent(),
          Value<String?> departmentId = const Value.absent(),
          bool? isActive,
          DateTime? cachedAt}) =>
      CachedUser(
        id: id ?? this.id,
        email: email ?? this.email,
        name: name ?? this.name,
        role: role ?? this.role,
        storeId: storeId.present ? storeId.value : this.storeId,
        departmentId:
            departmentId.present ? departmentId.value : this.departmentId,
        isActive: isActive ?? this.isActive,
        cachedAt: cachedAt ?? this.cachedAt,
      );
  @override
  String toString() {
    return (StringBuffer('CachedUser(')
          ..write('id: $id, ')
          ..write('email: $email, ')
          ..write('name: $name, ')
          ..write('role: $role, ')
          ..write('storeId: $storeId, ')
          ..write('departmentId: $departmentId, ')
          ..write('isActive: $isActive, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id, email, name, role, storeId, departmentId, isActive, cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedUser &&
          other.id == this.id &&
          other.email == this.email &&
          other.name == this.name &&
          other.role == this.role &&
          other.storeId == this.storeId &&
          other.departmentId == this.departmentId &&
          other.isActive == this.isActive &&
          other.cachedAt == this.cachedAt);
}

class CachedUsersCompanion extends UpdateCompanion<CachedUser> {
  final Value<String> id;
  final Value<String> email;
  final Value<String> name;
  final Value<String> role;
  final Value<String?> storeId;
  final Value<String?> departmentId;
  final Value<bool> isActive;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedUsersCompanion({
    this.id = const Value.absent(),
    this.email = const Value.absent(),
    this.name = const Value.absent(),
    this.role = const Value.absent(),
    this.storeId = const Value.absent(),
    this.departmentId = const Value.absent(),
    this.isActive = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedUsersCompanion.insert({
    required String id,
    required String email,
    required String name,
    required String role,
    this.storeId = const Value.absent(),
    this.departmentId = const Value.absent(),
    this.isActive = const Value.absent(),
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        email = Value(email),
        name = Value(name),
        role = Value(role),
        cachedAt = Value(cachedAt);
  static Insertable<CachedUser> custom({
    Expression<String>? id,
    Expression<String>? email,
    Expression<String>? name,
    Expression<String>? role,
    Expression<String>? storeId,
    Expression<String>? departmentId,
    Expression<bool>? isActive,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (email != null) 'email': email,
      if (name != null) 'name': name,
      if (role != null) 'role': role,
      if (storeId != null) 'store_id': storeId,
      if (departmentId != null) 'department_id': departmentId,
      if (isActive != null) 'is_active': isActive,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedUsersCompanion copyWith(
      {Value<String>? id,
      Value<String>? email,
      Value<String>? name,
      Value<String>? role,
      Value<String?>? storeId,
      Value<String?>? departmentId,
      Value<bool>? isActive,
      Value<DateTime>? cachedAt,
      Value<int>? rowid}) {
    return CachedUsersCompanion(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      role: role ?? this.role,
      storeId: storeId ?? this.storeId,
      departmentId: departmentId ?? this.departmentId,
      isActive: isActive ?? this.isActive,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (role.present) {
      map['role'] = Variable<String>(role.value);
    }
    if (storeId.present) {
      map['store_id'] = Variable<String>(storeId.value);
    }
    if (departmentId.present) {
      map['department_id'] = Variable<String>(departmentId.value);
    }
    if (isActive.present) {
      map['is_active'] = Variable<bool>(isActive.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedUsersCompanion(')
          ..write('id: $id, ')
          ..write('email: $email, ')
          ..write('name: $name, ')
          ..write('role: $role, ')
          ..write('storeId: $storeId, ')
          ..write('departmentId: $departmentId, ')
          ..write('isActive: $isActive, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedStoresTable extends CachedStores
    with TableInfo<$CachedStoresTable, CachedStore> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedStoresTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _codeMeta = const VerificationMeta('code');
  @override
  late final GeneratedColumn<String> code = GeneratedColumn<String>(
      'code', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _addressMeta =
      const VerificationMeta('address');
  @override
  late final GeneratedColumn<String> address = GeneratedColumn<String>(
      'address', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _latitudeMeta =
      const VerificationMeta('latitude');
  @override
  late final GeneratedColumn<double> latitude = GeneratedColumn<double>(
      'latitude', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _longitudeMeta =
      const VerificationMeta('longitude');
  @override
  late final GeneratedColumn<double> longitude = GeneratedColumn<double>(
      'longitude', aliasedName, true,
      type: DriftSqlType.double, requiredDuringInsert: false);
  static const VerificationMeta _regionIdMeta =
      const VerificationMeta('regionId');
  @override
  late final GeneratedColumn<String> regionId = GeneratedColumn<String>(
      'region_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _regionNameMeta =
      const VerificationMeta('regionName');
  @override
  late final GeneratedColumn<String> regionName = GeneratedColumn<String>(
      'region_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _isActiveMeta =
      const VerificationMeta('isActive');
  @override
  late final GeneratedColumn<bool> isActive = GeneratedColumn<bool>(
      'is_active', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_active" IN (0, 1))'),
      defaultValue: const Constant(true));
  static const VerificationMeta _cachedAtMeta =
      const VerificationMeta('cachedAt');
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
      'cached_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        name,
        code,
        address,
        latitude,
        longitude,
        regionId,
        regionName,
        isActive,
        cachedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_stores';
  @override
  VerificationContext validateIntegrity(Insertable<CachedStore> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('code')) {
      context.handle(
          _codeMeta, code.isAcceptableOrUnknown(data['code']!, _codeMeta));
    } else if (isInserting) {
      context.missing(_codeMeta);
    }
    if (data.containsKey('address')) {
      context.handle(_addressMeta,
          address.isAcceptableOrUnknown(data['address']!, _addressMeta));
    } else if (isInserting) {
      context.missing(_addressMeta);
    }
    if (data.containsKey('latitude')) {
      context.handle(_latitudeMeta,
          latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta));
    }
    if (data.containsKey('longitude')) {
      context.handle(_longitudeMeta,
          longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta));
    }
    if (data.containsKey('region_id')) {
      context.handle(_regionIdMeta,
          regionId.isAcceptableOrUnknown(data['region_id']!, _regionIdMeta));
    } else if (isInserting) {
      context.missing(_regionIdMeta);
    }
    if (data.containsKey('region_name')) {
      context.handle(
          _regionNameMeta,
          regionName.isAcceptableOrUnknown(
              data['region_name']!, _regionNameMeta));
    } else if (isInserting) {
      context.missing(_regionNameMeta);
    }
    if (data.containsKey('is_active')) {
      context.handle(_isActiveMeta,
          isActive.isAcceptableOrUnknown(data['is_active']!, _isActiveMeta));
    }
    if (data.containsKey('cached_at')) {
      context.handle(_cachedAtMeta,
          cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta));
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedStore map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedStore(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      code: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}code'])!,
      address: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}address'])!,
      latitude: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}latitude']),
      longitude: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}longitude']),
      regionId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}region_id'])!,
      regionName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}region_name'])!,
      isActive: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_active'])!,
      cachedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}cached_at'])!,
    );
  }

  @override
  $CachedStoresTable createAlias(String alias) {
    return $CachedStoresTable(attachedDatabase, alias);
  }
}

class CachedStore extends DataClass implements Insertable<CachedStore> {
  final String id;
  final String name;
  final String code;
  final String address;
  final double? latitude;
  final double? longitude;
  final String regionId;
  final String regionName;
  final bool isActive;
  final DateTime cachedAt;
  const CachedStore(
      {required this.id,
      required this.name,
      required this.code,
      required this.address,
      this.latitude,
      this.longitude,
      required this.regionId,
      required this.regionName,
      required this.isActive,
      required this.cachedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['name'] = Variable<String>(name);
    map['code'] = Variable<String>(code);
    map['address'] = Variable<String>(address);
    if (!nullToAbsent || latitude != null) {
      map['latitude'] = Variable<double>(latitude);
    }
    if (!nullToAbsent || longitude != null) {
      map['longitude'] = Variable<double>(longitude);
    }
    map['region_id'] = Variable<String>(regionId);
    map['region_name'] = Variable<String>(regionName);
    map['is_active'] = Variable<bool>(isActive);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedStoresCompanion toCompanion(bool nullToAbsent) {
    return CachedStoresCompanion(
      id: Value(id),
      name: Value(name),
      code: Value(code),
      address: Value(address),
      latitude: latitude == null && nullToAbsent
          ? const Value.absent()
          : Value(latitude),
      longitude: longitude == null && nullToAbsent
          ? const Value.absent()
          : Value(longitude),
      regionId: Value(regionId),
      regionName: Value(regionName),
      isActive: Value(isActive),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedStore.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedStore(
      id: serializer.fromJson<String>(json['id']),
      name: serializer.fromJson<String>(json['name']),
      code: serializer.fromJson<String>(json['code']),
      address: serializer.fromJson<String>(json['address']),
      latitude: serializer.fromJson<double?>(json['latitude']),
      longitude: serializer.fromJson<double?>(json['longitude']),
      regionId: serializer.fromJson<String>(json['regionId']),
      regionName: serializer.fromJson<String>(json['regionName']),
      isActive: serializer.fromJson<bool>(json['isActive']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'name': serializer.toJson<String>(name),
      'code': serializer.toJson<String>(code),
      'address': serializer.toJson<String>(address),
      'latitude': serializer.toJson<double?>(latitude),
      'longitude': serializer.toJson<double?>(longitude),
      'regionId': serializer.toJson<String>(regionId),
      'regionName': serializer.toJson<String>(regionName),
      'isActive': serializer.toJson<bool>(isActive),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedStore copyWith(
          {String? id,
          String? name,
          String? code,
          String? address,
          Value<double?> latitude = const Value.absent(),
          Value<double?> longitude = const Value.absent(),
          String? regionId,
          String? regionName,
          bool? isActive,
          DateTime? cachedAt}) =>
      CachedStore(
        id: id ?? this.id,
        name: name ?? this.name,
        code: code ?? this.code,
        address: address ?? this.address,
        latitude: latitude.present ? latitude.value : this.latitude,
        longitude: longitude.present ? longitude.value : this.longitude,
        regionId: regionId ?? this.regionId,
        regionName: regionName ?? this.regionName,
        isActive: isActive ?? this.isActive,
        cachedAt: cachedAt ?? this.cachedAt,
      );
  @override
  String toString() {
    return (StringBuffer('CachedStore(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('code: $code, ')
          ..write('address: $address, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('regionId: $regionId, ')
          ..write('regionName: $regionName, ')
          ..write('isActive: $isActive, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, name, code, address, latitude, longitude,
      regionId, regionName, isActive, cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedStore &&
          other.id == this.id &&
          other.name == this.name &&
          other.code == this.code &&
          other.address == this.address &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.regionId == this.regionId &&
          other.regionName == this.regionName &&
          other.isActive == this.isActive &&
          other.cachedAt == this.cachedAt);
}

class CachedStoresCompanion extends UpdateCompanion<CachedStore> {
  final Value<String> id;
  final Value<String> name;
  final Value<String> code;
  final Value<String> address;
  final Value<double?> latitude;
  final Value<double?> longitude;
  final Value<String> regionId;
  final Value<String> regionName;
  final Value<bool> isActive;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedStoresCompanion({
    this.id = const Value.absent(),
    this.name = const Value.absent(),
    this.code = const Value.absent(),
    this.address = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.regionId = const Value.absent(),
    this.regionName = const Value.absent(),
    this.isActive = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedStoresCompanion.insert({
    required String id,
    required String name,
    required String code,
    required String address,
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    required String regionId,
    required String regionName,
    this.isActive = const Value.absent(),
    required DateTime cachedAt,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        name = Value(name),
        code = Value(code),
        address = Value(address),
        regionId = Value(regionId),
        regionName = Value(regionName),
        cachedAt = Value(cachedAt);
  static Insertable<CachedStore> custom({
    Expression<String>? id,
    Expression<String>? name,
    Expression<String>? code,
    Expression<String>? address,
    Expression<double>? latitude,
    Expression<double>? longitude,
    Expression<String>? regionId,
    Expression<String>? regionName,
    Expression<bool>? isActive,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (name != null) 'name': name,
      if (code != null) 'code': code,
      if (address != null) 'address': address,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (regionId != null) 'region_id': regionId,
      if (regionName != null) 'region_name': regionName,
      if (isActive != null) 'is_active': isActive,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedStoresCompanion copyWith(
      {Value<String>? id,
      Value<String>? name,
      Value<String>? code,
      Value<String>? address,
      Value<double?>? latitude,
      Value<double?>? longitude,
      Value<String>? regionId,
      Value<String>? regionName,
      Value<bool>? isActive,
      Value<DateTime>? cachedAt,
      Value<int>? rowid}) {
    return CachedStoresCompanion(
      id: id ?? this.id,
      name: name ?? this.name,
      code: code ?? this.code,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      regionId: regionId ?? this.regionId,
      regionName: regionName ?? this.regionName,
      isActive: isActive ?? this.isActive,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (code.present) {
      map['code'] = Variable<String>(code.value);
    }
    if (address.present) {
      map['address'] = Variable<String>(address.value);
    }
    if (latitude.present) {
      map['latitude'] = Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = Variable<double>(longitude.value);
    }
    if (regionId.present) {
      map['region_id'] = Variable<String>(regionId.value);
    }
    if (regionName.present) {
      map['region_name'] = Variable<String>(regionName.value);
    }
    if (isActive.present) {
      map['is_active'] = Variable<bool>(isActive.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedStoresCompanion(')
          ..write('id: $id, ')
          ..write('name: $name, ')
          ..write('code: $code, ')
          ..write('address: $address, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('regionId: $regionId, ')
          ..write('regionName: $regionName, ')
          ..write('isActive: $isActive, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncMetadataTable extends SyncMetadata
    with TableInfo<$SyncMetadataTable, SyncMetadataData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncMetadataTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _entityTypeMeta =
      const VerificationMeta('entityType');
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
      'entity_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _lastSyncAtMeta =
      const VerificationMeta('lastSyncAt');
  @override
  late final GeneratedColumn<DateTime> lastSyncAt = GeneratedColumn<DateTime>(
      'last_sync_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _lastSyncCursorMeta =
      const VerificationMeta('lastSyncCursor');
  @override
  late final GeneratedColumn<String> lastSyncCursor = GeneratedColumn<String>(
      'last_sync_cursor', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns =>
      [entityType, lastSyncAt, lastSyncCursor];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_metadata';
  @override
  VerificationContext validateIntegrity(Insertable<SyncMetadataData> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('entity_type')) {
      context.handle(
          _entityTypeMeta,
          entityType.isAcceptableOrUnknown(
              data['entity_type']!, _entityTypeMeta));
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('last_sync_at')) {
      context.handle(
          _lastSyncAtMeta,
          lastSyncAt.isAcceptableOrUnknown(
              data['last_sync_at']!, _lastSyncAtMeta));
    } else if (isInserting) {
      context.missing(_lastSyncAtMeta);
    }
    if (data.containsKey('last_sync_cursor')) {
      context.handle(
          _lastSyncCursorMeta,
          lastSyncCursor.isAcceptableOrUnknown(
              data['last_sync_cursor']!, _lastSyncCursorMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {entityType};
  @override
  SyncMetadataData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncMetadataData(
      entityType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_type'])!,
      lastSyncAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}last_sync_at'])!,
      lastSyncCursor: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}last_sync_cursor']),
    );
  }

  @override
  $SyncMetadataTable createAlias(String alias) {
    return $SyncMetadataTable(attachedDatabase, alias);
  }
}

class SyncMetadataData extends DataClass
    implements Insertable<SyncMetadataData> {
  final String entityType;
  final DateTime lastSyncAt;
  final String? lastSyncCursor;
  const SyncMetadataData(
      {required this.entityType,
      required this.lastSyncAt,
      this.lastSyncCursor});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['entity_type'] = Variable<String>(entityType);
    map['last_sync_at'] = Variable<DateTime>(lastSyncAt);
    if (!nullToAbsent || lastSyncCursor != null) {
      map['last_sync_cursor'] = Variable<String>(lastSyncCursor);
    }
    return map;
  }

  SyncMetadataCompanion toCompanion(bool nullToAbsent) {
    return SyncMetadataCompanion(
      entityType: Value(entityType),
      lastSyncAt: Value(lastSyncAt),
      lastSyncCursor: lastSyncCursor == null && nullToAbsent
          ? const Value.absent()
          : Value(lastSyncCursor),
    );
  }

  factory SyncMetadataData.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncMetadataData(
      entityType: serializer.fromJson<String>(json['entityType']),
      lastSyncAt: serializer.fromJson<DateTime>(json['lastSyncAt']),
      lastSyncCursor: serializer.fromJson<String?>(json['lastSyncCursor']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'entityType': serializer.toJson<String>(entityType),
      'lastSyncAt': serializer.toJson<DateTime>(lastSyncAt),
      'lastSyncCursor': serializer.toJson<String?>(lastSyncCursor),
    };
  }

  SyncMetadataData copyWith(
          {String? entityType,
          DateTime? lastSyncAt,
          Value<String?> lastSyncCursor = const Value.absent()}) =>
      SyncMetadataData(
        entityType: entityType ?? this.entityType,
        lastSyncAt: lastSyncAt ?? this.lastSyncAt,
        lastSyncCursor:
            lastSyncCursor.present ? lastSyncCursor.value : this.lastSyncCursor,
      );
  @override
  String toString() {
    return (StringBuffer('SyncMetadataData(')
          ..write('entityType: $entityType, ')
          ..write('lastSyncAt: $lastSyncAt, ')
          ..write('lastSyncCursor: $lastSyncCursor')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(entityType, lastSyncAt, lastSyncCursor);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncMetadataData &&
          other.entityType == this.entityType &&
          other.lastSyncAt == this.lastSyncAt &&
          other.lastSyncCursor == this.lastSyncCursor);
}

class SyncMetadataCompanion extends UpdateCompanion<SyncMetadataData> {
  final Value<String> entityType;
  final Value<DateTime> lastSyncAt;
  final Value<String?> lastSyncCursor;
  final Value<int> rowid;
  const SyncMetadataCompanion({
    this.entityType = const Value.absent(),
    this.lastSyncAt = const Value.absent(),
    this.lastSyncCursor = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncMetadataCompanion.insert({
    required String entityType,
    required DateTime lastSyncAt,
    this.lastSyncCursor = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : entityType = Value(entityType),
        lastSyncAt = Value(lastSyncAt);
  static Insertable<SyncMetadataData> custom({
    Expression<String>? entityType,
    Expression<DateTime>? lastSyncAt,
    Expression<String>? lastSyncCursor,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (entityType != null) 'entity_type': entityType,
      if (lastSyncAt != null) 'last_sync_at': lastSyncAt,
      if (lastSyncCursor != null) 'last_sync_cursor': lastSyncCursor,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncMetadataCompanion copyWith(
      {Value<String>? entityType,
      Value<DateTime>? lastSyncAt,
      Value<String?>? lastSyncCursor,
      Value<int>? rowid}) {
    return SyncMetadataCompanion(
      entityType: entityType ?? this.entityType,
      lastSyncAt: lastSyncAt ?? this.lastSyncAt,
      lastSyncCursor: lastSyncCursor ?? this.lastSyncCursor,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (lastSyncAt.present) {
      map['last_sync_at'] = Variable<DateTime>(lastSyncAt.value);
    }
    if (lastSyncCursor.present) {
      map['last_sync_cursor'] = Variable<String>(lastSyncCursor.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncMetadataCompanion(')
          ..write('entityType: $entityType, ')
          ..write('lastSyncAt: $lastSyncAt, ')
          ..write('lastSyncCursor: $lastSyncCursor, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  late final $TasksTable tasks = $TasksTable(this);
  late final $TaskAssignmentsTable taskAssignments =
      $TaskAssignmentsTable(this);
  late final $ReceivingsTable receivings = $ReceivingsTable(this);
  late final $DiscrepanciesTable discrepancies = $DiscrepanciesTable(this);
  late final $IssuesTable issues = $IssuesTable(this);
  late final $SyncQueueTable syncQueue = $SyncQueueTable(this);
  late final $CachedUsersTable cachedUsers = $CachedUsersTable(this);
  late final $CachedStoresTable cachedStores = $CachedStoresTable(this);
  late final $SyncMetadataTable syncMetadata = $SyncMetadataTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
        tasks,
        taskAssignments,
        receivings,
        discrepancies,
        issues,
        syncQueue,
        cachedUsers,
        cachedStores,
        syncMetadata
      ];
}
