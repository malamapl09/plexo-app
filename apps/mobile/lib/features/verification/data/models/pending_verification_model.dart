enum VerificationEntityType { taskAssignment, issue }

class PendingVerificationItem {
  final VerificationEntityType entityType;
  final String entityId;
  final String title;
  final String? description;
  final String priority;
  final StoreInfo store;
  final SubmitterInfo submittedBy;
  final DateTime? submittedAt;
  final String? notes;
  final List<String> photoUrls;
  final String? category; // For issues only

  PendingVerificationItem({
    required this.entityType,
    required this.entityId,
    required this.title,
    this.description,
    required this.priority,
    required this.store,
    required this.submittedBy,
    this.submittedAt,
    this.notes,
    this.photoUrls = const [],
    this.category,
  });

  factory PendingVerificationItem.fromTaskJson(Map<String, dynamic> json) {
    return PendingVerificationItem(
      entityType: VerificationEntityType.taskAssignment,
      entityId: json['entityId'],
      title: json['title'] ?? '',
      description: json['description'],
      priority: json['priority'] ?? 'MEDIUM',
      store: StoreInfo.fromJson(json['store']),
      submittedBy: SubmitterInfo.fromJson(json['submittedBy']),
      submittedAt: json['submittedAt'] != null
          ? DateTime.parse(json['submittedAt'])
          : null,
      notes: json['notes'],
      photoUrls: List<String>.from(json['photoUrls'] ?? []),
    );
  }

  factory PendingVerificationItem.fromIssueJson(Map<String, dynamic> json) {
    return PendingVerificationItem(
      entityType: VerificationEntityType.issue,
      entityId: json['entityId'],
      title: json['title'] ?? '',
      description: json['description'],
      priority: json['priority'] ?? 'MEDIUM',
      store: StoreInfo.fromJson(json['store']),
      submittedBy: SubmitterInfo.fromJson(json['submittedBy']),
      submittedAt: json['submittedAt'] != null
          ? DateTime.parse(json['submittedAt'])
          : null,
      notes: json['notes'],
      photoUrls: List<String>.from(json['photoUrls'] ?? []),
      category: json['category'],
    );
  }

  String get entityTypeLabel {
    switch (entityType) {
      case VerificationEntityType.taskAssignment:
        return 'Tarea';
      case VerificationEntityType.issue:
        return 'Incidencia';
    }
  }

  String get priorityLabel {
    switch (priority) {
      case 'HIGH':
        return 'Alta';
      case 'MEDIUM':
        return 'Media';
      case 'LOW':
        return 'Baja';
      default:
        return 'Media';
    }
  }

  String? get categoryLabel {
    if (category == null) return null;
    switch (category!) {
      case 'MAINTENANCE':
        return 'Mantenimiento';
      case 'CLEANING':
        return 'Limpieza';
      case 'SECURITY':
        return 'Seguridad';
      case 'IT_SYSTEMS':
        return 'Sistemas/IT';
      case 'PERSONNEL':
        return 'Personal';
      case 'INVENTORY':
        return 'Inventario';
      default:
        return category;
    }
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
      id: json['id'],
      name: json['name'],
      code: json['code'],
    );
  }
}

class SubmitterInfo {
  final String id;
  final String name;
  final String? email;
  final String? role;

  SubmitterInfo({
    required this.id,
    required this.name,
    this.email,
    this.role,
  });

  factory SubmitterInfo.fromJson(Map<String, dynamic> json) {
    return SubmitterInfo(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      role: json['role'],
    );
  }

  String get roleLabel {
    switch (role) {
      case 'DEPT_SUPERVISOR':
        return 'Supervisor de Depto.';
      case 'STORE_MANAGER':
        return 'Gerente de Tienda';
      case 'REGIONAL_SUPERVISOR':
        return 'Supervisor Regional';
      case 'HQ_TEAM':
        return 'Equipo Central';
      case 'OPERATIONS_MANAGER':
        return 'Gerente de Operaciones';
      default:
        return role ?? 'Empleado';
    }
  }
}

class PendingVerificationsResponse {
  final List<PendingVerificationItem> tasks;
  final List<PendingVerificationItem> issues;
  final int totalCount;

  PendingVerificationsResponse({
    required this.tasks,
    required this.issues,
    required this.totalCount,
  });

  factory PendingVerificationsResponse.fromJson(Map<String, dynamic> json) {
    final tasks = (json['tasks'] as List?)
            ?.map((t) => PendingVerificationItem.fromTaskJson(t))
            .toList() ??
        [];
    final issues = (json['issues'] as List?)
            ?.map((i) => PendingVerificationItem.fromIssueJson(i))
            .toList() ??
        [];

    return PendingVerificationsResponse(
      tasks: tasks,
      issues: issues,
      totalCount: json['totalCount'] ?? (tasks.length + issues.length),
    );
  }

  List<PendingVerificationItem> get allItems => [...tasks, ...issues];
}

class VerifyRequest {
  final String? notes;
  final List<String>? photoUrls;

  VerifyRequest({this.notes, this.photoUrls});

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (notes != null) map['notes'] = notes;
    if (photoUrls != null) map['photoUrls'] = photoUrls;
    return map;
  }
}

class RejectRequest {
  final String rejectionReason;

  RejectRequest({required this.rejectionReason});

  Map<String, dynamic> toJson() {
    return {'rejectionReason': rejectionReason};
  }
}
