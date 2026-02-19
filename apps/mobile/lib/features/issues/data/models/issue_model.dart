enum IssueCategory {
  maintenance,
  cleaning,
  security,
  itSystems,
  personnel,
  inventory
}

enum IssueStatus {
  reported,
  assigned,
  inProgress,
  resolved,
  pendingVerification,
  verified,
  rejected
}

enum VerificationStatus { pending, verified, rejected }

enum Priority { low, medium, high }

class IssueModel {
  final String id;
  final String storeId;
  final StoreInfo store;
  final IssueCategory category;
  final Priority priority;
  final String title;
  final String description;
  final IssueStatus status;
  final UserInfo reportedBy;
  final UserInfo? assignedTo;
  final UserInfo? resolvedBy;
  final UserInfo? verifiedBy;
  final List<String> photoUrls;
  final String? resolutionNotes;
  final DateTime? resolvedAt;
  final VerificationStatus? verificationStatus;
  final DateTime? verifiedAt;
  final String? rejectionReason;
  final DateTime? escalatedAt;
  final bool isEscalated;
  final DateTime createdAt;
  final DateTime updatedAt;

  IssueModel({
    required this.id,
    required this.storeId,
    required this.store,
    required this.category,
    required this.priority,
    required this.title,
    required this.description,
    required this.status,
    required this.reportedBy,
    this.assignedTo,
    this.resolvedBy,
    this.verifiedBy,
    required this.photoUrls,
    this.resolutionNotes,
    this.resolvedAt,
    this.verificationStatus,
    this.verifiedAt,
    this.rejectionReason,
    this.escalatedAt,
    required this.isEscalated,
    required this.createdAt,
    required this.updatedAt,
  });

  factory IssueModel.fromJson(Map<String, dynamic> json) {
    return IssueModel(
      id: json['id'],
      storeId: json['storeId'],
      store: StoreInfo.fromJson(json['store']),
      category: _parseCategory(json['category']),
      priority: _parsePriority(json['priority']),
      title: json['title'],
      description: json['description'],
      status: _parseStatus(json['status']),
      reportedBy: UserInfo.fromJson(json['reportedBy']),
      assignedTo: json['assignedTo'] != null
          ? UserInfo.fromJson(json['assignedTo'])
          : null,
      resolvedBy: json['resolvedBy'] != null
          ? UserInfo.fromJson(json['resolvedBy'])
          : null,
      verifiedBy: json['verifiedBy'] != null
          ? UserInfo.fromJson(json['verifiedBy'])
          : null,
      photoUrls: List<String>.from(json['photoUrls'] ?? []),
      resolutionNotes: json['resolutionNotes'],
      resolvedAt: json['resolvedAt'] != null
          ? DateTime.parse(json['resolvedAt'])
          : null,
      verificationStatus: json['verificationStatus'] != null
          ? _parseVerificationStatus(json['verificationStatus'])
          : null,
      verifiedAt: json['verifiedAt'] != null
          ? DateTime.parse(json['verifiedAt'])
          : null,
      rejectionReason: json['rejectionReason'],
      escalatedAt: json['escalatedAt'] != null
          ? DateTime.parse(json['escalatedAt'])
          : null,
      isEscalated: json['isEscalated'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'storeId': storeId,
      'category': categoryToString(category),
      'priority': _priorityToString(priority),
      'title': title,
      'description': description,
      'photoUrls': photoUrls,
    };
  }

  bool get isOpen =>
      status != IssueStatus.resolved && status != IssueStatus.verified;
  bool get canStart => status == IssueStatus.assigned;
  bool get canResolve =>
      status == IssueStatus.inProgress || status == IssueStatus.rejected;
  bool get isPendingVerification => status == IssueStatus.pendingVerification;
  bool get isVerified => status == IssueStatus.verified;
  bool get isRejected => status == IssueStatus.rejected;
  bool get requiresAction => status == IssueStatus.rejected;
  bool get canRecategorize =>
      status == IssueStatus.reported ||
      status == IssueStatus.assigned ||
      status == IssueStatus.inProgress;

  String get categoryLabel {
    switch (category) {
      case IssueCategory.maintenance:
        return 'Mantenimiento';
      case IssueCategory.cleaning:
        return 'Limpieza';
      case IssueCategory.security:
        return 'Seguridad';
      case IssueCategory.itSystems:
        return 'Sistemas/IT';
      case IssueCategory.personnel:
        return 'Personal';
      case IssueCategory.inventory:
        return 'Inventario';
    }
  }

  String get categoryIcon {
    switch (category) {
      case IssueCategory.maintenance:
        return 'build';
      case IssueCategory.cleaning:
        return 'cleaning_services';
      case IssueCategory.security:
        return 'security';
      case IssueCategory.itSystems:
        return 'computer';
      case IssueCategory.personnel:
        return 'people';
      case IssueCategory.inventory:
        return 'inventory';
    }
  }

  String get statusLabel {
    switch (status) {
      case IssueStatus.reported:
        return 'Reportada';
      case IssueStatus.assigned:
        return 'Asignada';
      case IssueStatus.inProgress:
        return 'En Proceso';
      case IssueStatus.resolved:
        return 'Resuelta';
      case IssueStatus.pendingVerification:
        return 'Pendiente Verificación';
      case IssueStatus.verified:
        return 'Verificada';
      case IssueStatus.rejected:
        return 'Rechazada';
    }
  }

  String? get verificationStatusLabel {
    if (verificationStatus == null) return null;
    switch (verificationStatus!) {
      case VerificationStatus.pending:
        return 'Pendiente';
      case VerificationStatus.verified:
        return 'Verificado';
      case VerificationStatus.rejected:
        return 'Rechazado';
    }
  }

  String get priorityLabel {
    switch (priority) {
      case Priority.low:
        return 'Baja';
      case Priority.medium:
        return 'Media';
      case Priority.high:
        return 'Alta';
    }
  }

  static IssueCategory _parseCategory(String value) {
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

  static String categoryToString(IssueCategory category) {
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

  static IssueStatus _parseStatus(String value) {
    switch (value) {
      case 'REPORTED':
        return IssueStatus.reported;
      case 'ASSIGNED':
        return IssueStatus.assigned;
      case 'IN_PROGRESS':
        return IssueStatus.inProgress;
      case 'RESOLVED':
        return IssueStatus.resolved;
      case 'PENDING_VERIFICATION':
        return IssueStatus.pendingVerification;
      case 'VERIFIED':
        return IssueStatus.verified;
      case 'REJECTED':
        return IssueStatus.rejected;
      default:
        return IssueStatus.reported;
    }
  }

  static VerificationStatus _parseVerificationStatus(String value) {
    switch (value) {
      case 'PENDING':
        return VerificationStatus.pending;
      case 'VERIFIED':
        return VerificationStatus.verified;
      case 'REJECTED':
        return VerificationStatus.rejected;
      default:
        return VerificationStatus.pending;
    }
  }

  static Priority _parsePriority(String value) {
    switch (value) {
      case 'LOW':
        return Priority.low;
      case 'MEDIUM':
        return Priority.medium;
      case 'HIGH':
        return Priority.high;
      default:
        return Priority.medium;
    }
  }

  static String _priorityToString(Priority priority) {
    switch (priority) {
      case Priority.low:
        return 'LOW';
      case Priority.medium:
        return 'MEDIUM';
      case Priority.high:
        return 'HIGH';
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

class UserInfo {
  final String id;
  final String name;

  UserInfo({
    required this.id,
    required this.name,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'],
      name: json['name'],
    );
  }
}

class IssueStats {
  final int total;
  final int reported;
  final int assigned;
  final int inProgress;
  final int resolved;
  final int escalated;
  final double avgResolutionTimeHours;

  IssueStats({
    required this.total,
    required this.reported,
    required this.assigned,
    required this.inProgress,
    required this.resolved,
    required this.escalated,
    required this.avgResolutionTimeHours,
  });

  factory IssueStats.fromJson(Map<String, dynamic> json) {
    return IssueStats(
      total: json['total'] ?? 0,
      reported: json['reported'] ?? 0,
      assigned: json['assigned'] ?? 0,
      inProgress: json['inProgress'] ?? 0,
      resolved: json['resolved'] ?? 0,
      escalated: json['escalated'] ?? 0,
      avgResolutionTimeHours: (json['avgResolutionTimeHours'] ?? 0).toDouble(),
    );
  }

  int get openCount => reported + assigned + inProgress;
  double get resolutionRate => total > 0 ? (resolved / total) * 100 : 0;
}

class IssueCategoryStats {
  final IssueCategory category;
  final String categoryLabel;
  final int total;
  final int open;
  final int resolved;
  final int escalated;

  IssueCategoryStats({
    required this.category,
    required this.categoryLabel,
    required this.total,
    required this.open,
    required this.resolved,
    required this.escalated,
  });

  factory IssueCategoryStats.fromJson(Map<String, dynamic> json) {
    return IssueCategoryStats(
      category: IssueModel._parseCategory(json['category']),
      categoryLabel: json['categoryLabel'],
      total: json['total'] ?? 0,
      open: json['open'] ?? 0,
      resolved: json['resolved'] ?? 0,
      escalated: json['escalated'] ?? 0,
    );
  }
}

class CreateIssueRequest {
  final String storeId;
  final IssueCategory category;
  final Priority priority;
  final String title;
  final String description;
  final List<String> photoUrls;

  CreateIssueRequest({
    required this.storeId,
    required this.category,
    required this.priority,
    required this.title,
    required this.description,
    this.photoUrls = const [],
  });

  Map<String, dynamic> toJson() {
    return {
      'storeId': storeId,
      'category': IssueModel.categoryToString(category),
      'priority': IssueModel._priorityToString(priority),
      'title': title,
      'description': description,
      'photoUrls': photoUrls,
    };
  }
}
