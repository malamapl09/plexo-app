/// Question types matching the backend QuestionType enum.
enum QuestionType { score, yesNo, text }

/// A single question within an audit section.
class AuditQuestion {
  final String id;
  final int order;
  final String text;
  final QuestionType questionType;
  final int maxScore;
  final bool requiresPhoto;

  const AuditQuestion({
    required this.id,
    required this.order,
    required this.text,
    required this.questionType,
    required this.maxScore,
    required this.requiresPhoto,
  });

  factory AuditQuestion.fromJson(Map<String, dynamic> json) {
    return AuditQuestion(
      id: json['id'] as String,
      order: json['order'] as int,
      text: json['text'] as String,
      questionType: _parseQuestionType(json['questionType'] as String),
      maxScore: (json['maxScore'] as num?)?.toInt() ?? 5,
      requiresPhoto: json['requiresPhoto'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order': order,
      'text': text,
      'questionType': questionTypeToString(questionType),
      'maxScore': maxScore,
      'requiresPhoto': requiresPhoto,
    };
  }

  static QuestionType _parseQuestionType(String value) {
    switch (value) {
      case 'SCORE':
        return QuestionType.score;
      case 'YES_NO':
        return QuestionType.yesNo;
      case 'TEXT':
        return QuestionType.text;
      default:
        return QuestionType.score;
    }
  }

  static String questionTypeToString(QuestionType type) {
    switch (type) {
      case QuestionType.score:
        return 'SCORE';
      case QuestionType.yesNo:
        return 'YES_NO';
      case QuestionType.text:
        return 'TEXT';
    }
  }

  String get questionTypeLabel {
    switch (questionType) {
      case QuestionType.score:
        return 'Puntuacion';
      case QuestionType.yesNo:
        return 'Si / No';
      case QuestionType.text:
        return 'Texto';
    }
  }
}

/// A section grouping related questions inside an audit template.
class AuditSection {
  final String id;
  final int order;
  final String title;
  final String? description;
  final double weight;
  final List<AuditQuestion> questions;

  const AuditSection({
    required this.id,
    required this.order,
    required this.title,
    this.description,
    required this.weight,
    required this.questions,
  });

  factory AuditSection.fromJson(Map<String, dynamic> json) {
    return AuditSection(
      id: json['id'] as String,
      order: json['order'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      weight: (json['weight'] as num?)?.toDouble() ?? 1.0,
      questions: (json['questions'] as List<dynamic>?)
              ?.map((q) => AuditQuestion.fromJson(q as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order': order,
      'title': title,
      'description': description,
      'weight': weight,
      'questions': questions.map((q) => q.toJson()).toList(),
    };
  }

  /// Total maximum score for this section (sum of all questions' maxScore).
  int get totalMaxScore => questions.fold(0, (sum, q) => sum + q.maxScore);
}

/// The full audit template containing sections and questions.
class AuditTemplate {
  final String id;
  final String name;
  final String? description;
  final bool isActive;
  final List<AuditSection> sections;
  final DateTime createdAt;
  final DateTime updatedAt;

  const AuditTemplate({
    required this.id,
    required this.name,
    this.description,
    required this.isActive,
    required this.sections,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AuditTemplate.fromJson(Map<String, dynamic> json) {
    return AuditTemplate(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      sections: (json['sections'] as List<dynamic>?)
              ?.map((s) => AuditSection.fromJson(s as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'isActive': isActive,
      'sections': sections.map((s) => s.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Total number of questions across all sections.
  int get totalQuestions =>
      sections.fold(0, (sum, s) => sum + s.questions.length);

  /// Total maximum possible score across all sections.
  int get totalMaxScore => sections.fold(0, (sum, s) => sum + s.totalMaxScore);
}
