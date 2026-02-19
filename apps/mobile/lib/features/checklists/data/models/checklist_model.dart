/// Models for the Checklist feature.
/// Maps to the API response DTOs from the checklists module.

class ChecklistTemplate {
  final String id;
  final String title;
  final String? description;
  final String frequency;
  final String scope;
  final bool isActive;
  final List<ChecklistItem> items;
  final CreatedByInfo? createdBy;
  final DateTime createdAt;
  final DateTime updatedAt;
  final TodaySubmission? todaySubmission;

  ChecklistTemplate({
    required this.id,
    required this.title,
    this.description,
    required this.frequency,
    required this.scope,
    required this.isActive,
    required this.items,
    this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    this.todaySubmission,
  });

  factory ChecklistTemplate.fromJson(Map<String, dynamic> json) {
    return ChecklistTemplate(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      frequency: json['frequency'] as String,
      scope: json['scope'] as String? ?? 'ALL',
      isActive: json['isActive'] as bool? ?? true,
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => ChecklistItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdBy: json['createdBy'] != null
          ? CreatedByInfo.fromJson(json['createdBy'] as Map<String, dynamic>)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      todaySubmission: json['todaySubmission'] != null
          ? TodaySubmission.fromJson(
              json['todaySubmission'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'frequency': frequency,
      'scope': scope,
      'isActive': isActive,
      'items': items.map((e) => e.toJson()).toList(),
      'createdBy': createdBy?.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'todaySubmission': todaySubmission?.toJson(),
    };
  }

  /// Human-readable frequency label in Spanish.
  String get frequencyLabel {
    switch (frequency) {
      case 'DAILY':
        return 'Diario';
      case 'WEEKLY':
        return 'Semanal';
      case 'MONTHLY':
        return 'Mensual';
      default:
        return frequency;
    }
  }

  /// Whether a submission exists for today.
  bool get hasSubmissionToday => todaySubmission != null;

  /// Whether today's submission is completed.
  bool get isCompletedToday => todaySubmission?.status == 'COMPLETED';

  /// Progress fraction (0.0 to 1.0) for today's submission.
  double get todayProgress {
    if (todaySubmission == null) return 0.0;
    if (todaySubmission!.totalItems == 0) return 0.0;
    return todaySubmission!.completedItems / todaySubmission!.totalItems;
  }
}

class ChecklistItem {
  final String id;
  final int order;
  final String title;
  final String? description;
  final bool requiresPhoto;
  final bool requiresNote;

  ChecklistItem({
    required this.id,
    required this.order,
    required this.title,
    this.description,
    required this.requiresPhoto,
    required this.requiresNote,
  });

  factory ChecklistItem.fromJson(Map<String, dynamic> json) {
    return ChecklistItem(
      id: json['id'] as String,
      order: json['order'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      requiresPhoto: json['requiresPhoto'] as bool? ?? false,
      requiresNote: json['requiresNote'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order': order,
      'title': title,
      'description': description,
      'requiresPhoto': requiresPhoto,
      'requiresNote': requiresNote,
    };
  }
}

class ChecklistSubmission {
  final String id;
  final String templateId;
  final String? templateTitle;
  final String storeId;
  final String? storeName;
  final DateTime date;
  final String status;
  final CreatedByInfo? submittedBy;
  final DateTime? completedAt;
  final int? score;
  final int completedItems;
  final int totalItems;
  final List<ChecklistResponse> responses;
  final DateTime createdAt;

  ChecklistSubmission({
    required this.id,
    required this.templateId,
    this.templateTitle,
    required this.storeId,
    this.storeName,
    required this.date,
    required this.status,
    this.submittedBy,
    this.completedAt,
    this.score,
    required this.completedItems,
    required this.totalItems,
    this.responses = const [],
    required this.createdAt,
  });

  factory ChecklistSubmission.fromJson(Map<String, dynamic> json) {
    return ChecklistSubmission(
      id: json['id'] as String,
      templateId: json['templateId'] as String,
      templateTitle: json['templateTitle'] as String?,
      storeId: json['storeId'] as String,
      storeName: json['storeName'] as String?,
      date: DateTime.parse(json['date'] as String),
      status: json['status'] as String,
      submittedBy: json['submittedBy'] != null
          ? CreatedByInfo.fromJson(json['submittedBy'] as Map<String, dynamic>)
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      score: (json['score'] as num?)?.toInt(),
      completedItems: json['completedItems'] as int? ?? 0,
      totalItems: json['totalItems'] as int? ?? 0,
      responses: (json['responses'] as List<dynamic>?)
              ?.map(
                  (e) => ChecklistResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'templateId': templateId,
      'templateTitle': templateTitle,
      'storeId': storeId,
      'storeName': storeName,
      'date': date.toIso8601String(),
      'status': status,
      'submittedBy': submittedBy?.toJson(),
      'completedAt': completedAt?.toIso8601String(),
      'score': score,
      'completedItems': completedItems,
      'totalItems': totalItems,
      'responses': responses.map((e) => e.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Progress fraction (0.0 to 1.0).
  double get progress {
    if (totalItems == 0) return 0.0;
    return completedItems / totalItems;
  }

  bool get isCompleted => status == 'COMPLETED';
  bool get isPending => status == 'PENDING';
  bool get isInProgress => status == 'IN_PROGRESS';

  String get statusLabel {
    switch (status) {
      case 'COMPLETED':
        return 'Completado';
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'PENDING':
        return 'Pendiente';
      default:
        return status;
    }
  }
}

class ChecklistResponse {
  final String id;
  final String itemId;
  final String? itemTitle;
  final bool isCompleted;
  final CreatedByInfo? completedBy;
  final DateTime? completedAt;
  final List<String> photoUrls;
  final String? notes;

  ChecklistResponse({
    required this.id,
    required this.itemId,
    this.itemTitle,
    required this.isCompleted,
    this.completedBy,
    this.completedAt,
    this.photoUrls = const [],
    this.notes,
  });

  factory ChecklistResponse.fromJson(Map<String, dynamic> json) {
    return ChecklistResponse(
      id: json['id'] as String,
      itemId: json['itemId'] as String,
      itemTitle: json['itemTitle'] as String?,
      isCompleted: json['isCompleted'] as bool? ?? false,
      completedBy: json['completedBy'] != null
          ? CreatedByInfo.fromJson(json['completedBy'] as Map<String, dynamic>)
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      photoUrls: (json['photoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'itemId': itemId,
      'itemTitle': itemTitle,
      'isCompleted': isCompleted,
      'completedBy': completedBy?.toJson(),
      'completedAt': completedAt?.toIso8601String(),
      'photoUrls': photoUrls,
      'notes': notes,
    };
  }
}

class TodaySubmission {
  final String id;
  final String status;
  final int completedItems;
  final int totalItems;

  TodaySubmission({
    required this.id,
    required this.status,
    required this.completedItems,
    required this.totalItems,
  });

  factory TodaySubmission.fromJson(Map<String, dynamic> json) {
    return TodaySubmission(
      id: json['id'] as String,
      status: json['status'] as String,
      completedItems: json['completedItems'] as int? ?? 0,
      totalItems: json['totalItems'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'completedItems': completedItems,
      'totalItems': totalItems,
    };
  }
}

class CreatedByInfo {
  final String id;
  final String name;

  CreatedByInfo({
    required this.id,
    required this.name,
  });

  factory CreatedByInfo.fromJson(Map<String, dynamic> json) {
    return CreatedByInfo(
      id: json['id'] as String,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}
