class QuizOption {
  final String text;
  final bool isCorrect;

  const QuizOption({required this.text, required this.isCorrect});

  factory QuizOption.fromJson(Map<String, dynamic> json) {
    return QuizOption(
      text: json['text'] as String? ?? '',
      isCorrect: json['isCorrect'] as bool? ?? false,
    );
  }
}

class TrainingQuizQuestion {
  final String id;
  final String lessonId;
  final int sortOrder;
  final String questionText;
  final String type; // MULTIPLE_CHOICE, TRUE_FALSE
  final List<QuizOption> options;
  final String? explanation;

  const TrainingQuizQuestion({
    required this.id,
    required this.lessonId,
    required this.sortOrder,
    required this.questionText,
    required this.type,
    this.options = const [],
    this.explanation,
  });

  factory TrainingQuizQuestion.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['options'];
    List<QuizOption> parsedOptions = [];
    if (rawOptions is List) {
      parsedOptions = rawOptions
          .map((o) => QuizOption.fromJson(o as Map<String, dynamic>))
          .toList();
    }

    return TrainingQuizQuestion(
      id: json['id'] as String,
      lessonId: json['lessonId'] as String? ?? '',
      sortOrder: json['sortOrder'] as int? ?? 0,
      questionText: json['questionText'] as String? ?? '',
      type: json['type'] as String? ?? 'MULTIPLE_CHOICE',
      options: parsedOptions,
      explanation: json['explanation'] as String?,
    );
  }

  bool get isTrueFalse => type == 'TRUE_FALSE';
  bool get isMultipleChoice => type == 'MULTIPLE_CHOICE';
}

class TrainingLesson {
  final String id;
  final String courseId;
  final int sortOrder;
  final String title;
  final String type; // TEXT, PDF, VIDEO, QUIZ
  final String? content;
  final String? fileUrl;
  final int? estimatedMinutes;
  final bool isRequired;
  final List<TrainingQuizQuestion> questions;

  const TrainingLesson({
    required this.id,
    required this.courseId,
    required this.sortOrder,
    required this.title,
    required this.type,
    this.content,
    this.fileUrl,
    this.estimatedMinutes,
    this.isRequired = true,
    this.questions = const [],
  });

  factory TrainingLesson.fromJson(Map<String, dynamic> json) {
    return TrainingLesson(
      id: json['id'] as String,
      courseId: json['courseId'] as String? ?? '',
      sortOrder: json['sortOrder'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      type: json['type'] as String? ?? 'TEXT',
      content: json['content'] as String?,
      fileUrl: json['fileUrl'] as String?,
      estimatedMinutes: json['estimatedMinutes'] as int?,
      isRequired: json['isRequired'] as bool? ?? true,
      questions: (json['questions'] as List<dynamic>?)
              ?.map((q) =>
                  TrainingQuizQuestion.fromJson(q as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  bool get isText => type == 'TEXT';
  bool get isPdf => type == 'PDF';
  bool get isVideo => type == 'VIDEO';
  bool get isQuiz => type == 'QUIZ';

  String get typeLabel {
    switch (type) {
      case 'TEXT':
        return 'Texto';
      case 'PDF':
        return 'Documento';
      case 'VIDEO':
        return 'Video';
      case 'QUIZ':
        return 'Evaluacion';
      default:
        return type;
    }
  }
}

class TrainingCourse {
  final String id;
  final String title;
  final String? description;
  final String category;
  final int passingScore;
  final bool isMandatory;
  final int? estimatedDurationMinutes;
  final bool isActive;
  final int? certificationValidDays;
  final List<TrainingLesson> lessons;
  final int? _countLessons;

  const TrainingCourse({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    this.passingScore = 70,
    this.isMandatory = false,
    this.estimatedDurationMinutes,
    this.isActive = true,
    this.certificationValidDays,
    this.lessons = const [],
    int? countLessons,
  }) : _countLessons = countLessons;

  factory TrainingCourse.fromJson(Map<String, dynamic> json) {
    final count = json['_count'] as Map<String, dynamic>?;
    return TrainingCourse(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      category: json['category'] as String? ?? 'OPERATIONS',
      passingScore: json['passingScore'] as int? ?? 70,
      isMandatory: json['isMandatory'] as bool? ?? false,
      estimatedDurationMinutes: json['estimatedDurationMinutes'] as int?,
      isActive: json['isActive'] as bool? ?? true,
      certificationValidDays: json['certificationValidDays'] as int?,
      lessons: (json['lessons'] as List<dynamic>?)
              ?.map((l) =>
                  TrainingLesson.fromJson(l as Map<String, dynamic>))
              .toList() ??
          [],
      countLessons: count?['lessons'] as int?,
    );
  }

  String get categoryLabel {
    switch (category) {
      case 'OPERATIONS':
        return 'Operaciones';
      case 'CASH_MANAGEMENT':
        return 'Manejo de Caja';
      case 'CUSTOMER_SERVICE':
        return 'Servicio al Cliente';
      case 'INVENTORY':
        return 'Inventario';
      case 'COMPLIANCE':
        return 'Cumplimiento';
      case 'SAFETY':
        return 'Seguridad';
      default:
        return category;
    }
  }

  int get totalLessons => lessons.isNotEmpty ? lessons.length : (_countLessons ?? 0);
  int get quizCount => lessons.where((l) => l.isQuiz).length;
}

class TrainingProgress {
  final String id;
  final String enrollmentId;
  final String lessonId;
  final String status; // NOT_STARTED, IN_PROGRESS, COMPLETED
  final int? score;
  final int attempts;
  final DateTime? completedAt;

  const TrainingProgress({
    required this.id,
    required this.enrollmentId,
    required this.lessonId,
    required this.status,
    this.score,
    this.attempts = 0,
    this.completedAt,
  });

  factory TrainingProgress.fromJson(Map<String, dynamic> json) {
    return TrainingProgress(
      id: json['id'] as String,
      enrollmentId: json['enrollmentId'] as String? ?? '',
      lessonId: json['lessonId'] as String? ?? '',
      status: json['status'] as String? ?? 'NOT_STARTED',
      score: (json['score'] as num?)?.toInt(),
      attempts: json['attempts'] as int? ?? 0,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
    );
  }

  bool get isCompleted => status == 'COMPLETED';
  bool get isInProgress => status == 'IN_PROGRESS';
  bool get isNotStarted => status == 'NOT_STARTED';
}

class TrainingEnrollment {
  final String id;
  final String courseId;
  final String userId;
  final String status; // ASSIGNED, IN_PROGRESS, COMPLETED, EXPIRED
  final int? score;
  final DateTime? assignedAt;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final DateTime? certificateExpiresAt;
  final TrainingCourse? course;
  final List<TrainingProgress> progress;
  final int? _apiTotalLessons;

  const TrainingEnrollment({
    required this.id,
    required this.courseId,
    required this.userId,
    required this.status,
    this.score,
    this.assignedAt,
    this.startedAt,
    this.completedAt,
    this.certificateExpiresAt,
    this.course,
    this.progress = const [],
    int? apiTotalLessons,
  }) : _apiTotalLessons = apiTotalLessons;

  factory TrainingEnrollment.fromJson(Map<String, dynamic> json) {
    return TrainingEnrollment(
      id: json['id'] as String,
      courseId: json['courseId'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      status: json['status'] as String? ?? 'ASSIGNED',
      score: (json['score'] as num?)?.toInt(),
      assignedAt: json['assignedAt'] != null
          ? DateTime.parse(json['assignedAt'] as String)
          : (json['createdAt'] != null
              ? DateTime.parse(json['createdAt'] as String)
              : null),
      startedAt: json['startedAt'] != null
          ? DateTime.parse(json['startedAt'] as String)
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'] as String)
          : null,
      certificateExpiresAt: json['certificateExpiresAt'] != null
          ? DateTime.parse(json['certificateExpiresAt'] as String)
          : null,
      course: json['course'] != null
          ? TrainingCourse.fromJson(json['course'] as Map<String, dynamic>)
          : null,
      progress: (json['progress'] as List<dynamic>?)
              ?.map((p) =>
                  TrainingProgress.fromJson(p as Map<String, dynamic>))
              .toList() ??
          [],
      apiTotalLessons: json['totalLessons'] as int?,
    );
  }

  bool get isAssigned => status == 'ASSIGNED';
  bool get isInProgress => status == 'IN_PROGRESS';
  bool get isCompleted => status == 'COMPLETED';
  bool get isExpired => status == 'EXPIRED';

  bool get isCertExpired =>
      certificateExpiresAt != null &&
      DateTime.now().isAfter(certificateExpiresAt!);

  String get statusLabel {
    switch (status) {
      case 'ASSIGNED':
        return 'Asignado';
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'COMPLETED':
        return 'Completado';
      case 'EXPIRED':
        return 'Expirado';
      default:
        return status;
    }
  }

  int get completedLessons =>
      progress.where((p) => p.isCompleted).length;

  int get totalLessons => _apiTotalLessons ?? (course?.totalLessons ?? 0);

  double get progressFraction =>
      totalLessons > 0 ? completedLessons / totalLessons : 0;

  String get progressText => '$completedLessons/$totalLessons lecciones';
}
