class TaskModel {
  final String id;
  final String title;
  final String? description;
  final DepartmentInfo? department;
  final String priority;
  final DateTime? scheduledTime;
  final DateTime? dueTime;
  final UserInfo createdBy;
  final bool isRecurring;
  final DateTime createdAt;
  final TaskAssignment? assignment;

  TaskModel({
    required this.id,
    required this.title,
    this.description,
    this.department,
    required this.priority,
    this.scheduledTime,
    this.dueTime,
    required this.createdBy,
    required this.isRecurring,
    required this.createdAt,
    this.assignment,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    final assignments = json['assignments'] as List<dynamic>?;
    TaskAssignment? assignment;
    if (assignments != null && assignments.isNotEmpty) {
      assignment = TaskAssignment.fromJson(assignments.first);
    }

    return TaskModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      department: json['department'] != null
          ? DepartmentInfo.fromJson(json['department'])
          : null,
      priority: json['priority'] as String,
      scheduledTime: json['scheduledTime'] != null
          ? DateTime.parse(json['scheduledTime'])
          : null,
      dueTime:
          json['dueTime'] != null ? DateTime.parse(json['dueTime']) : null,
      createdBy: UserInfo.fromJson(json['createdBy']),
      isRecurring: json['isRecurring'] as bool,
      createdAt: DateTime.parse(json['createdAt']),
      assignment: assignment,
    );
  }

  bool get isCompleted => assignment?.status == 'COMPLETED';
  bool get isPending => assignment?.status == 'PENDING';
  bool get isOverdue {
    if (isCompleted) return false;
    if (dueTime == null) return false;
    return DateTime.now().isAfter(dueTime!);
  }

  String get statusLabel {
    if (isCompleted) return 'Completada';
    if (isOverdue) return 'Atrasada';
    return 'Pendiente';
  }
}

class TaskAssignment {
  final String id;
  final String storeId;
  final StoreInfo store;
  final String status;
  final DateTime assignedAt;
  final DateTime? completedAt;
  final UserInfo? completedBy;
  final String? notes;
  final List<String> photoUrls;

  TaskAssignment({
    required this.id,
    required this.storeId,
    required this.store,
    required this.status,
    required this.assignedAt,
    this.completedAt,
    this.completedBy,
    this.notes,
    required this.photoUrls,
  });

  factory TaskAssignment.fromJson(Map<String, dynamic> json) {
    return TaskAssignment(
      id: json['id'] as String,
      storeId: json['storeId'] as String,
      store: StoreInfo.fromJson(json['store']),
      status: json['status'] as String,
      assignedAt: DateTime.parse(json['assignedAt']),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'])
          : null,
      completedBy: json['completedBy'] != null
          ? UserInfo.fromJson(json['completedBy'])
          : null,
      notes: json['notes'] as String?,
      photoUrls: (json['photoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }
}

class DepartmentInfo {
  final String id;
  final String name;
  final String code;

  DepartmentInfo({
    required this.id,
    required this.name,
    required this.code,
  });

  factory DepartmentInfo.fromJson(Map<String, dynamic> json) {
    return DepartmentInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      code: json['code'] as String,
    );
  }
}

class StoreInfo {
  final String id;
  final String name;
  final String code;

  StoreInfo({
    required this.id,
    required this.name,
    required this.code,
  });

  factory StoreInfo.fromJson(Map<String, dynamic> json) {
    return StoreInfo(
      id: json['id'] as String,
      name: json['name'] as String,
      code: json['code'] as String,
    );
  }
}

class UserInfo {
  final String id;
  final String name;

  UserInfo({
    required this.id,
    required this.name,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }
}

class TaskProgress {
  final int total;
  final int completed;
  final int pending;
  final int overdue;
  final double completionRate;

  TaskProgress({
    required this.total,
    required this.completed,
    required this.pending,
    required this.overdue,
    required this.completionRate,
  });

  factory TaskProgress.fromJson(Map<String, dynamic> json) {
    return TaskProgress(
      total: json['total'] as int,
      completed: json['completed'] as int,
      pending: json['pending'] as int,
      overdue: json['overdue'] as int,
      completionRate: (json['completionRate'] as num).toDouble(),
    );
  }
}
