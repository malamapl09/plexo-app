/// Audit lifecycle statuses matching the backend enum.
enum AuditStatus { scheduled, inProgress, completed }

/// Severity levels for audit findings.
enum FindingSeverity { low, medium, high, critical }

/// Status of an audit finding.
enum FindingStatus { open, inProgress, resolved, closed }

/// Status of a corrective action.
enum CorrectiveActionStatus { pending, inProgress, completed, overdue }

/// Lightweight store reference embedded in audit responses.
class AuditStoreSummary {
  final String id;
  final String name;
  final String code;

  const AuditStoreSummary({
    required this.id,
    required this.name,
    required this.code,
  });

  factory AuditStoreSummary.fromJson(Map<String, dynamic> json) {
    return AuditStoreSummary(
      id: json['id'] as String,
      name: json['name'] as String,
      code: json['code'] as String,
    );
  }
}

/// Lightweight user reference embedded in audit responses.
class AuditUserSummary {
  final String id;
  final String name;
  final String? email;
  final String? role;

  const AuditUserSummary({
    required this.id,
    required this.name,
    this.email,
    this.role,
  });

  factory AuditUserSummary.fromJson(Map<String, dynamic> json) {
    return AuditUserSummary(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String?,
      role: json['role'] as String?,
    );
  }
}

/// An answer submitted for a single audit question.
class AuditAnswer {
  final String id;
  final String questionId;
  final int? score;
  final bool? booleanValue;
  final String? textValue;
  final List<String> photoUrls;
  final String? notes;
  final DateTime createdAt;

  const AuditAnswer({
    required this.id,
    required this.questionId,
    this.score,
    this.booleanValue,
    this.textValue,
    this.photoUrls = const [],
    this.notes,
    required this.createdAt,
  });

  factory AuditAnswer.fromJson(Map<String, dynamic> json) {
    return AuditAnswer(
      id: json['id'] as String,
      questionId: json['questionId'] as String,
      score: (json['score'] as num?)?.toInt(),
      booleanValue: json['booleanValue'] as bool?,
      textValue: json['textValue'] as String?,
      photoUrls: (json['photoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'questionId': questionId,
      if (score != null) 'score': score,
      if (booleanValue != null) 'booleanValue': booleanValue,
      if (textValue != null) 'textValue': textValue,
      'photoUrls': photoUrls,
      if (notes != null) 'notes': notes,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

/// A corrective action linked to an audit finding.
class CorrectiveAction {
  final String id;
  final String findingId;
  final AuditUserSummary assignedTo;
  final String dueDate;
  final CorrectiveActionStatus status;
  final String description;
  final String? completionNotes;
  final List<String> completionPhotoUrls;
  final DateTime? completedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  const CorrectiveAction({
    required this.id,
    required this.findingId,
    required this.assignedTo,
    required this.dueDate,
    required this.status,
    required this.description,
    this.completionNotes,
    this.completionPhotoUrls = const [],
    this.completedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CorrectiveAction.fromJson(Map<String, dynamic> json) {
    return CorrectiveAction(
      id: json['id'] as String,
      findingId: json['findingId'] as String,
      assignedTo:
          AuditUserSummary.fromJson(json['assignedTo'] as Map<String, dynamic>),
      dueDate: json['dueDate'] as String,
      status: _parseCorrectiveActionStatus(json['status'] as String),
      description: json['description'] as String,
      completionNotes: json['completionNotes'] as String?,
      completionPhotoUrls: (json['completionPhotoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  String get statusLabel {
    switch (status) {
      case CorrectiveActionStatus.pending:
        return 'Pendiente';
      case CorrectiveActionStatus.inProgress:
        return 'En Proceso';
      case CorrectiveActionStatus.completed:
        return 'Completada';
      case CorrectiveActionStatus.overdue:
        return 'Vencida';
    }
  }

  static CorrectiveActionStatus _parseCorrectiveActionStatus(String value) {
    switch (value) {
      case 'PENDING':
        return CorrectiveActionStatus.pending;
      case 'IN_PROGRESS':
        return CorrectiveActionStatus.inProgress;
      case 'COMPLETED':
        return CorrectiveActionStatus.completed;
      case 'OVERDUE':
        return CorrectiveActionStatus.overdue;
      default:
        return CorrectiveActionStatus.pending;
    }
  }
}

/// A finding reported during an audit.
class AuditFinding {
  final String id;
  final String storeAuditId;
  final String? sectionId;
  final FindingSeverity severity;
  final String title;
  final String description;
  final List<String> photoUrls;
  final FindingStatus status;
  final CorrectiveAction? correctiveAction;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AuditFinding({
    required this.id,
    required this.storeAuditId,
    this.sectionId,
    required this.severity,
    required this.title,
    required this.description,
    this.photoUrls = const [],
    required this.status,
    this.correctiveAction,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AuditFinding.fromJson(Map<String, dynamic> json) {
    return AuditFinding(
      id: json['id'] as String,
      storeAuditId: json['storeAuditId'] as String,
      sectionId: json['sectionId'] as String?,
      severity: _parseSeverity(json['severity'] as String),
      title: json['title'] as String,
      description: json['description'] as String,
      photoUrls: (json['photoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      status: _parseFindingStatus(json['status'] as String),
      correctiveAction: json['correctiveAction'] != null
          ? CorrectiveAction.fromJson(
              json['correctiveAction'] as Map<String, dynamic>)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  String get severityLabel {
    switch (severity) {
      case FindingSeverity.low:
        return 'Baja';
      case FindingSeverity.medium:
        return 'Media';
      case FindingSeverity.high:
        return 'Alta';
      case FindingSeverity.critical:
        return 'Critica';
    }
  }

  String get statusLabel {
    switch (status) {
      case FindingStatus.open:
        return 'Abierta';
      case FindingStatus.inProgress:
        return 'En Proceso';
      case FindingStatus.resolved:
        return 'Resuelta';
      case FindingStatus.closed:
        return 'Cerrada';
    }
  }

  static FindingSeverity _parseSeverity(String value) {
    switch (value) {
      case 'LOW':
        return FindingSeverity.low;
      case 'MEDIUM':
        return FindingSeverity.medium;
      case 'HIGH':
        return FindingSeverity.high;
      case 'CRITICAL':
        return FindingSeverity.critical;
      default:
        return FindingSeverity.medium;
    }
  }

  static String severityToString(FindingSeverity severity) {
    switch (severity) {
      case FindingSeverity.low:
        return 'LOW';
      case FindingSeverity.medium:
        return 'MEDIUM';
      case FindingSeverity.high:
        return 'HIGH';
      case FindingSeverity.critical:
        return 'CRITICAL';
    }
  }

  static FindingStatus _parseFindingStatus(String value) {
    switch (value) {
      case 'OPEN':
        return FindingStatus.open;
      case 'IN_PROGRESS':
        return FindingStatus.inProgress;
      case 'RESOLVED':
        return FindingStatus.resolved;
      case 'CLOSED':
        return FindingStatus.closed;
      default:
        return FindingStatus.open;
    }
  }
}

/// The main store audit model matching the StoreAuditResponse from the API.
class StoreAudit {
  final String id;
  final String templateId;
  final AuditStoreSummary store;
  final String scheduledDate;
  final AuditStatus status;
  final AuditUserSummary auditor;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final double? overallScore;
  final int? actualScore;
  final int? maxPossibleScore;
  final String? notes;
  final List<AuditAnswer> answers;
  final List<AuditFinding> findings;
  final DateTime createdAt;
  final DateTime updatedAt;

  const StoreAudit({
    required this.id,
    required this.templateId,
    required this.store,
    required this.scheduledDate,
    required this.status,
    required this.auditor,
    this.startedAt,
    this.completedAt,
    this.overallScore,
    this.actualScore,
    this.maxPossibleScore,
    this.notes,
    this.answers = const [],
    this.findings = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory StoreAudit.fromJson(Map<String, dynamic> json) {
    return StoreAudit(
      id: json['id'] as String,
      templateId: json['templateId'] as String,
      store:
          AuditStoreSummary.fromJson(json['store'] as Map<String, dynamic>),
      scheduledDate: json['scheduledDate'] as String,
      status: _parseAuditStatus(json['status'] as String),
      auditor:
          AuditUserSummary.fromJson(json['auditor'] as Map<String, dynamic>),
      startedAt: json['startedAt'] != null
          ? DateTime.parse(json['startedAt'] as String)
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      overallScore: (json['overallScore'] as num?)?.toDouble(),
      actualScore: (json['actualScore'] as num?)?.toInt(),
      maxPossibleScore: (json['maxPossibleScore'] as num?)?.toInt(),
      notes: json['notes'] as String?,
      answers: (json['answers'] as List<dynamic>?)
              ?.map((a) => AuditAnswer.fromJson(a as Map<String, dynamic>))
              .toList() ??
          [],
      findings: (json['findings'] as List<dynamic>?)
              ?.map((f) => AuditFinding.fromJson(f as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  /// Convenience getters for display in the UI.
  String get storeName => store.name;
  String get auditorName => auditor.name;

  bool get isScheduled => status == AuditStatus.scheduled;
  bool get isInProgress => status == AuditStatus.inProgress;
  bool get isCompleted => status == AuditStatus.completed;

  String get statusLabel {
    switch (status) {
      case AuditStatus.scheduled:
        return 'Programada';
      case AuditStatus.inProgress:
        return 'En Progreso';
      case AuditStatus.completed:
        return 'Completada';
    }
  }

  /// Returns the score formatted as a percentage string, e.g. "85.5%".
  String get scoreDisplay {
    if (overallScore == null) return '--';
    return '${overallScore!.toStringAsFixed(1)}%';
  }

  /// Find the answer for a given question ID.
  AuditAnswer? answerForQuestion(String questionId) {
    try {
      return answers.firstWhere((a) => a.questionId == questionId);
    } catch (_) {
      return null;
    }
  }

  static AuditStatus _parseAuditStatus(String value) {
    switch (value) {
      case 'SCHEDULED':
        return AuditStatus.scheduled;
      case 'IN_PROGRESS':
        return AuditStatus.inProgress;
      case 'COMPLETED':
        return AuditStatus.completed;
      default:
        return AuditStatus.scheduled;
    }
  }

  static String auditStatusToString(AuditStatus status) {
    switch (status) {
      case AuditStatus.scheduled:
        return 'SCHEDULED';
      case AuditStatus.inProgress:
        return 'IN_PROGRESS';
      case AuditStatus.completed:
        return 'COMPLETED';
    }
  }
}
