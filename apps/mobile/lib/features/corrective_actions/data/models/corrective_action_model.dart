/// Model for the Corrective Actions (CAPA) feature.
/// Maps to the API response DTOs from the corrective-actions module.

import 'package:flutter/material.dart' show Color;

class CorrectiveActionModel {
  final String id;
  final String? findingId;
  final String sourceType; // AUDIT_FINDING, CHECKLIST_FAILURE, ISSUE, MANUAL
  final String? sourceId;
  final String? title;
  final String description;
  final String? storeId;
  final String? storeName;
  final String priority; // LOW, MEDIUM, HIGH, CRITICAL
  final String status; // PENDING, IN_PROGRESS, COMPLETED, OVERDUE, VERIFIED, REJECTED
  final String assignedToId;
  final String? assignedToName;
  final DateTime dueDate;
  final String? completionNotes;
  final List<String> completionPhotoUrls;
  final DateTime createdAt;

  CorrectiveActionModel({
    required this.id,
    this.findingId,
    required this.sourceType,
    this.sourceId,
    this.title,
    required this.description,
    this.storeId,
    this.storeName,
    required this.priority,
    required this.status,
    required this.assignedToId,
    this.assignedToName,
    required this.dueDate,
    this.completionNotes,
    this.completionPhotoUrls = const [],
    required this.createdAt,
  });

  factory CorrectiveActionModel.fromJson(Map<String, dynamic> json) {
    return CorrectiveActionModel(
      id: json['id'] as String,
      findingId: json['findingId'] as String?,
      sourceType: json['sourceType'] as String? ?? 'MANUAL',
      sourceId: json['sourceId'] as String?,
      title: json['title'] as String?,
      description: json['description'] as String? ?? '',
      storeId: (json['store'] as Map<String, dynamic>?)?['id'] as String? ?? json['storeId'] as String?,
      storeName: (json['store'] as Map<String, dynamic>?)?['name'] as String? ?? json['storeName'] as String?,
      priority: json['priority'] as String? ?? 'MEDIUM',
      status: json['status'] as String? ?? 'PENDING',
      assignedToId: (json['assignedTo'] as Map<String, dynamic>?)?['id'] as String? ?? json['assignedToId'] as String,
      assignedToName: (json['assignedTo'] as Map<String, dynamic>?)?['name'] as String? ?? json['assignedToName'] as String?,
      dueDate: DateTime.parse(json['dueDate'] as String),
      completionNotes: json['completionNotes'] as String?,
      completionPhotoUrls: (json['completionPhotoUrls'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'findingId': findingId,
      'sourceType': sourceType,
      'sourceId': sourceId,
      'title': title,
      'description': description,
      'storeId': storeId,
      'storeName': storeName,
      'priority': priority,
      'status': status,
      'assignedToId': assignedToId,
      'assignedToName': assignedToName,
      'dueDate': dueDate.toIso8601String(),
      'completionNotes': completionNotes,
      'completionPhotoUrls': completionPhotoUrls,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  // ---------------------------------------------------------------------------
  // Computed helpers
  // ---------------------------------------------------------------------------

  /// Whether the action is past due and not yet completed/verified.
  bool get isOverdue {
    if (status == 'COMPLETED' || status == 'VERIFIED') return false;
    return DateTime.now().isAfter(dueDate);
  }

  /// Effective display status: if the raw status is PENDING or IN_PROGRESS but
  /// the due date has passed, we surface it as OVERDUE for the UI.
  String get effectiveStatus {
    if (isOverdue && status != 'OVERDUE') return 'OVERDUE';
    return status;
  }

  /// Status label in Spanish.
  String get statusLabel {
    switch (effectiveStatus) {
      case 'PENDING':
        return 'Pendiente';
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'COMPLETED':
        return 'Completada';
      case 'OVERDUE':
        return 'Vencida';
      case 'VERIFIED':
        return 'Verificada';
      case 'REJECTED':
        return 'Rechazada';
      default:
        return status;
    }
  }

  /// Priority label in Spanish.
  String get priorityLabel {
    switch (priority) {
      case 'LOW':
        return 'Baja';
      case 'MEDIUM':
        return 'Media';
      case 'HIGH':
        return 'Alta';
      case 'CRITICAL':
        return 'Critica';
      default:
        return priority;
    }
  }

  /// Source type label in Spanish.
  String get sourceTypeLabel {
    switch (sourceType) {
      case 'AUDIT_FINDING':
        return 'Hallazgo de Auditoria';
      case 'CHECKLIST_FAILURE':
        return 'Falla de Checklist';
      case 'ISSUE':
        return 'Incidencia';
      case 'MANUAL':
        return 'Manual';
      default:
        return sourceType;
    }
  }

  /// Status color mapping per specification:
  /// PENDING = amber, IN_PROGRESS = blue, COMPLETED = green,
  /// OVERDUE = red, VERIFIED = teal, REJECTED = grey.
  Color get statusColor {
    switch (effectiveStatus) {
      case 'PENDING':
        return const Color(0xFFF59E0B); // Amber
      case 'IN_PROGRESS':
        return const Color(0xFF3B82F6); // Blue
      case 'COMPLETED':
        return const Color(0xFF22C55E); // Green
      case 'OVERDUE':
        return const Color(0xFFEF4444); // Red
      case 'VERIFIED':
        return const Color(0xFF14B8A6); // Teal
      case 'REJECTED':
        return const Color(0xFF6B7280); // Grey
      default:
        return const Color(0xFF6B7280);
    }
  }

  /// Priority color.
  Color get priorityColor {
    switch (priority) {
      case 'LOW':
        return const Color(0xFF22C55E); // Green
      case 'MEDIUM':
        return const Color(0xFFF59E0B); // Amber
      case 'HIGH':
        return const Color(0xFFF97316); // Orange
      case 'CRITICAL':
        return const Color(0xFFEF4444); // Red
      default:
        return const Color(0xFF6B7280);
    }
  }

  /// Whether this action can be moved to COMPLETED.
  bool get canComplete =>
      status == 'PENDING' || status == 'IN_PROGRESS' || effectiveStatus == 'OVERDUE';

  /// Whether this action is still editable (notes, photos).
  bool get isEditable =>
      status == 'PENDING' || status == 'IN_PROGRESS' || effectiveStatus == 'OVERDUE';

  /// Display title -- falls back to first line of description.
  String get displayTitle {
    if (title != null && title!.isNotEmpty) return title!;
    final firstLine = description.split('\n').first;
    return firstLine.length > 80 ? '${firstLine.substring(0, 80)}...' : firstLine;
  }
}
