enum AnnouncementType {
  systemAlert,
  operationalUpdate,
  policyUpdate,
  training,
  emergency,
  general,
}

enum AnnouncementStatus {
  draft,
  published,
  archived,
}

enum Priority {
  low,
  medium,
  high,
}

class AnnouncementModel {
  final String id;
  final String title;
  final String content;
  final String? summary;
  final AnnouncementType type;
  final Priority priority;
  final AnnouncementStatus status;
  final String scope;
  final List<String> targetStoreIds;
  final List<String> targetRegionIds;
  final List<String> targetRoles;
  final String? imageUrl;
  final List<String> attachmentUrls;
  final bool requiresAck;
  final UserInfo createdBy;
  final DateTime? publishedAt;
  final DateTime? scheduledFor;
  final DateTime? expiresAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isViewed;
  final bool isAcknowledged;

  AnnouncementModel({
    required this.id,
    required this.title,
    required this.content,
    this.summary,
    required this.type,
    required this.priority,
    required this.status,
    required this.scope,
    this.targetStoreIds = const [],
    this.targetRegionIds = const [],
    this.targetRoles = const [],
    this.imageUrl,
    this.attachmentUrls = const [],
    required this.requiresAck,
    required this.createdBy,
    this.publishedAt,
    this.scheduledFor,
    this.expiresAt,
    required this.createdAt,
    required this.updatedAt,
    this.isViewed = false,
    this.isAcknowledged = false,
  });

  factory AnnouncementModel.fromJson(Map<String, dynamic> json) {
    return AnnouncementModel(
      id: json['id'],
      title: json['title'],
      content: json['content'],
      summary: json['summary'],
      type: _parseType(json['type']),
      priority: _parsePriority(json['priority']),
      status: _parseStatus(json['status']),
      scope: json['scope'] ?? 'ALL',
      targetStoreIds: List<String>.from(json['targetStoreIds'] ?? []),
      targetRegionIds: List<String>.from(json['targetRegionIds'] ?? []),
      targetRoles: List<String>.from(json['targetRoles'] ?? []),
      imageUrl: json['imageUrl'],
      attachmentUrls: List<String>.from(json['attachmentUrls'] ?? []),
      requiresAck: json['requiresAck'] ?? false,
      createdBy: UserInfo.fromJson(json['createdBy']),
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'])
          : null,
      scheduledFor: json['scheduledFor'] != null
          ? DateTime.parse(json['scheduledFor'])
          : null,
      expiresAt:
          json['expiresAt'] != null ? DateTime.parse(json['expiresAt']) : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      isViewed: json['isViewed'] ?? false,
      isAcknowledged: json['isAcknowledged'] ?? false,
    );
  }

  bool get isActive => status == AnnouncementStatus.published;
  bool get isExpired =>
      expiresAt != null && expiresAt!.isBefore(DateTime.now());
  bool get isUrgent =>
      priority == Priority.high || type == AnnouncementType.emergency;
  bool get needsAcknowledgment => requiresAck && !isAcknowledged;

  String get typeLabel {
    switch (type) {
      case AnnouncementType.systemAlert:
        return 'Alerta del Sistema';
      case AnnouncementType.operationalUpdate:
        return 'Actualizacion Operativa';
      case AnnouncementType.policyUpdate:
        return 'Actualizacion de Politica';
      case AnnouncementType.training:
        return 'Capacitacion';
      case AnnouncementType.emergency:
        return 'Emergencia';
      case AnnouncementType.general:
        return 'General';
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

  String get statusLabel {
    switch (status) {
      case AnnouncementStatus.draft:
        return 'Borrador';
      case AnnouncementStatus.published:
        return 'Publicado';
      case AnnouncementStatus.archived:
        return 'Archivado';
    }
  }

  static AnnouncementType _parseType(String value) {
    switch (value) {
      case 'SYSTEM_ALERT':
        return AnnouncementType.systemAlert;
      case 'OPERATIONAL_UPDATE':
        return AnnouncementType.operationalUpdate;
      case 'POLICY_UPDATE':
        return AnnouncementType.policyUpdate;
      case 'TRAINING':
        return AnnouncementType.training;
      case 'EMERGENCY':
        return AnnouncementType.emergency;
      case 'GENERAL':
      default:
        return AnnouncementType.general;
    }
  }

  static Priority _parsePriority(String value) {
    switch (value) {
      case 'LOW':
        return Priority.low;
      case 'HIGH':
        return Priority.high;
      case 'MEDIUM':
      default:
        return Priority.medium;
    }
  }

  static AnnouncementStatus _parseStatus(String value) {
    switch (value) {
      case 'DRAFT':
        return AnnouncementStatus.draft;
      case 'ARCHIVED':
        return AnnouncementStatus.archived;
      case 'PUBLISHED':
      default:
        return AnnouncementStatus.published;
    }
  }

  AnnouncementModel copyWith({
    bool? isViewed,
    bool? isAcknowledged,
  }) {
    return AnnouncementModel(
      id: id,
      title: title,
      content: content,
      summary: summary,
      type: type,
      priority: priority,
      status: status,
      scope: scope,
      targetStoreIds: targetStoreIds,
      targetRegionIds: targetRegionIds,
      targetRoles: targetRoles,
      imageUrl: imageUrl,
      attachmentUrls: attachmentUrls,
      requiresAck: requiresAck,
      createdBy: createdBy,
      publishedAt: publishedAt,
      scheduledFor: scheduledFor,
      expiresAt: expiresAt,
      createdAt: createdAt,
      updatedAt: updatedAt,
      isViewed: isViewed ?? this.isViewed,
      isAcknowledged: isAcknowledged ?? this.isAcknowledged,
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

class AnnouncementStats {
  final int total;
  final int unread;
  final int unacknowledged;
  final int urgent;

  AnnouncementStats({
    required this.total,
    required this.unread,
    required this.unacknowledged,
    required this.urgent,
  });

  factory AnnouncementStats.fromJson(Map<String, dynamic> json) {
    return AnnouncementStats(
      total: json['total'] ?? 0,
      unread: json['unread'] ?? 0,
      unacknowledged: json['unacknowledged'] ?? 0,
      urgent: json['urgent'] ?? 0,
    );
  }

  bool get hasUnread => unread > 0;
  bool get hasUrgent => urgent > 0;
}
