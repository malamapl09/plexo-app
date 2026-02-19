/// Models for the Planograms feature.
/// Maps to the API response DTOs from the planograms module.

class PlanogramTemplate {
  final String id;
  final String name;
  final String? description;
  final List<String> referencePhotoUrls;
  final DateTime? dueDate;
  final bool isActive;
  final DateTime createdAt;

  const PlanogramTemplate({
    required this.id,
    required this.name,
    this.description,
    this.referencePhotoUrls = const [],
    this.dueDate,
    required this.isActive,
    required this.createdAt,
  });

  factory PlanogramTemplate.fromJson(Map<String, dynamic> json) {
    return PlanogramTemplate(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      referencePhotoUrls: (json['referencePhotoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      dueDate: json['dueDate'] != null
          ? DateTime.parse(json['dueDate'] as String)
          : null,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'referencePhotoUrls': referencePhotoUrls,
      'dueDate': dueDate?.toIso8601String(),
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Check if template is overdue
  bool get isOverdue {
    if (dueDate == null) return false;
    return DateTime.now().isAfter(dueDate!);
  }
}

class PlanogramSubmission {
  final String id;
  final String templateId;
  final String storeId;
  final String submittedById;
  final List<String> photoUrls;
  final String? notes;
  final String status;
  final String? reviewedById;
  final String? reviewNotes;
  final DateTime? reviewedAt;
  final DateTime submittedAt;
  final PlanogramTemplate? template;

  const PlanogramSubmission({
    required this.id,
    required this.templateId,
    required this.storeId,
    required this.submittedById,
    this.photoUrls = const [],
    this.notes,
    required this.status,
    this.reviewedById,
    this.reviewNotes,
    this.reviewedAt,
    required this.submittedAt,
    this.template,
  });

  factory PlanogramSubmission.fromJson(Map<String, dynamic> json) {
    return PlanogramSubmission(
      id: json['id'] as String,
      templateId: json['templateId'] as String,
      storeId: json['storeId'] as String,
      submittedById: json['submittedById'] as String,
      photoUrls: (json['photoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      notes: json['notes'] as String?,
      status: json['status'] as String? ?? 'PENDING_REVIEW',
      reviewedById: json['reviewedById'] as String?,
      reviewNotes: json['reviewNotes'] as String?,
      reviewedAt: json['reviewedAt'] != null
          ? DateTime.parse(json['reviewedAt'] as String)
          : null,
      submittedAt: DateTime.parse(json['submittedAt'] as String),
      template: json['template'] != null
          ? PlanogramTemplate.fromJson(
              json['template'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'templateId': templateId,
      'storeId': storeId,
      'submittedById': submittedById,
      'photoUrls': photoUrls,
      'notes': notes,
      'status': status,
      'reviewedById': reviewedById,
      'reviewNotes': reviewNotes,
      'reviewedAt': reviewedAt?.toIso8601String(),
      'submittedAt': submittedAt.toIso8601String(),
      'template': template?.toJson(),
    };
  }

  /// Get status label in Spanish
  String get statusLabel {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Pendiente de Revision';
      case 'APPROVED':
        return 'Aprobado';
      case 'NEEDS_REVISION':
        return 'Requiere Correccion';
      case 'RESUBMITTED':
        return 'Reenviado';
      default:
        return status;
    }
  }

  /// Check if submission is pending review
  bool get isPendingReview => status == 'PENDING_REVIEW';

  /// Check if submission is approved
  bool get isApproved => status == 'APPROVED';

  /// Check if submission needs revision
  bool get needsRevision => status == 'NEEDS_REVISION';

  /// Check if submission was resubmitted
  bool get isResubmitted => status == 'RESUBMITTED';
}
