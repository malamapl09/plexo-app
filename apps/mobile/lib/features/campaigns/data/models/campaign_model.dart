class Campaign {
  final String id;
  final String title;
  final String? description;
  final String type;
  final String priority;
  final String status;
  final DateTime startDate;
  final DateTime endDate;
  final List<String> referencePhotoUrls;
  final List<String> materialsList;
  final String? instructions;
  final List<String> targetStoreIds;
  final DateTime createdAt;

  const Campaign({
    required this.id,
    required this.title,
    this.description,
    required this.type,
    required this.priority,
    required this.status,
    required this.startDate,
    required this.endDate,
    this.referencePhotoUrls = const [],
    this.materialsList = const [],
    this.instructions,
    this.targetStoreIds = const [],
    required this.createdAt,
  });

  factory Campaign.fromJson(Map<String, dynamic> json) {
    return Campaign(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      type: json['type'] as String? ?? 'OTHER',
      priority: json['priority'] as String? ?? 'MEDIUM',
      status: json['status'] as String? ?? 'ACTIVE',
      startDate: DateTime.parse(json['startDate'] as String),
      endDate: DateTime.parse(json['endDate'] as String),
      referencePhotoUrls: (json['referencePhotoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      materialsList: (json['materialsList'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      instructions: json['instructions'] as String?,
      targetStoreIds: (json['targetStoreIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  bool get isOverdue => DateTime.now().isAfter(endDate);

  String get typeLabel {
    switch (type) {
      case 'PROMOTION':
        return 'Promocion';
      case 'SEASONAL':
        return 'Temporada';
      case 'PRODUCT_LAUNCH':
        return 'Lanzamiento';
      case 'POS_DISPLAY':
        return 'Exhibicion POS';
      case 'PRICE_CHANGE':
        return 'Cambio de Precio';
      default:
        return 'Otro';
    }
  }

  String get priorityLabel {
    switch (priority) {
      case 'URGENT':
        return 'Urgente';
      case 'HIGH':
        return 'Alta';
      case 'MEDIUM':
        return 'Media';
      case 'LOW':
        return 'Baja';
      default:
        return priority;
    }
  }
}

class CampaignSubmission {
  final String id;
  final String campaignId;
  final String storeId;
  final String submittedById;
  final List<String> photoUrls;
  final String? notes;
  final String status;
  final String? reviewedById;
  final String? reviewNotes;
  final DateTime? reviewedAt;
  final DateTime submittedAt;
  final Campaign? campaign;

  const CampaignSubmission({
    required this.id,
    required this.campaignId,
    required this.storeId,
    required this.submittedById,
    this.photoUrls = const [],
    this.notes,
    required this.status,
    this.reviewedById,
    this.reviewNotes,
    this.reviewedAt,
    required this.submittedAt,
    this.campaign,
  });

  factory CampaignSubmission.fromJson(Map<String, dynamic> json) {
    return CampaignSubmission(
      id: json['id'] as String,
      campaignId: json['campaignId'] as String,
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
      campaign: json['campaign'] != null
          ? Campaign.fromJson(json['campaign'] as Map<String, dynamic>)
          : null,
    );
  }

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

  bool get isPendingReview => status == 'PENDING_REVIEW';
  bool get isApproved => status == 'APPROVED';
  bool get needsRevision => status == 'NEEDS_REVISION';
  bool get isResubmitted => status == 'RESUBMITTED';
}
