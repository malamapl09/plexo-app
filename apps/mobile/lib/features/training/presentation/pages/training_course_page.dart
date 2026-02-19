import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plexo_ops/features/training/data/models/training_model.dart';
import 'package:plexo_ops/features/training/presentation/providers/training_provider.dart';
import 'package:plexo_ops/features/training/presentation/widgets/lesson_tile.dart';

class TrainingCoursePage extends ConsumerStatefulWidget {
  final String enrollmentId;
  final TrainingEnrollment? enrollment;

  const TrainingCoursePage({
    super.key,
    required this.enrollmentId,
    this.enrollment,
  });

  @override
  ConsumerState<TrainingCoursePage> createState() =>
      _TrainingCoursePageState();
}

class _TrainingCoursePageState extends ConsumerState<TrainingCoursePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(trainingProvider.notifier)
          .loadEnrollmentDetail(widget.enrollmentId);
    });
  }

  TrainingProgress? _getProgress(
      TrainingEnrollment enrollment, String lessonId) {
    final matches = enrollment.progress.where((p) => p.lessonId == lessonId);
    return matches.isNotEmpty ? matches.first : null;
  }

  bool _allLessonsCompleted(TrainingEnrollment enrollment) {
    if (enrollment.course == null) return false;
    final lessons = enrollment.course!.lessons;
    if (lessons.isEmpty) return false;
    return lessons.every((l) {
      final progress = _getProgress(enrollment, l.id);
      return progress?.isCompleted ?? false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(trainingProvider);
    final enrollment = state.currentEnrollment;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(enrollment?.course?.title ?? 'Curso'),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
      ),
      body: state.isLoading && enrollment == null
          ? const Center(child: CircularProgressIndicator())
          : enrollment == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline,
                          size: 48, color: colorScheme.error),
                      const SizedBox(height: 16),
                      Text(state.error ?? 'No se encontro el curso'),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () => ref
                      .read(trainingProvider.notifier)
                      .loadEnrollmentDetail(widget.enrollmentId),
                  child: ListView(
                    children: [
                      _buildCourseHeader(enrollment, theme, colorScheme),
                      _buildProgressSection(enrollment, theme, colorScheme),
                      _buildActionButton(enrollment, theme, colorScheme),
                      _buildLessonsList(enrollment, theme, colorScheme),
                    ],
                  ),
                ),
    );
  }

  Widget _buildCourseHeader(TrainingEnrollment enrollment, ThemeData theme,
      ColorScheme colorScheme) {
    final course = enrollment.course;
    if (course == null) return const SizedBox.shrink();
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      color: colorScheme.surfaceContainerLow,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (course.description != null) ...[
            Text(
              course.description!,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 12),
          ],
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _infoBadge(Icons.category, course.categoryLabel, Colors.blue),
              if (course.isMandatory)
                _infoBadge(Icons.priority_high, 'Obligatorio', Colors.red),
              if (course.estimatedDurationMinutes != null)
                _infoBadge(Icons.schedule,
                    '${course.estimatedDurationMinutes} min', Colors.teal),
              _infoBadge(Icons.menu_book,
                  '${course.totalLessons} lecciones', Colors.indigo),
              _infoBadge(
                  Icons.grade, 'Aprobado: ${course.passingScore}%', Colors.amber.shade700),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoBadge(IconData icon, String label, Color color) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Color.lerp(color, Colors.white, 0.25)! : color;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.2 : 0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: textColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressSection(TrainingEnrollment enrollment,
      ThemeData theme, ColorScheme colorScheme) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Progreso',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                enrollment.progressText,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: enrollment.progressFraction,
              minHeight: 10,
              backgroundColor: colorScheme.surfaceContainerHighest,
              valueColor: AlwaysStoppedAnimation<Color>(
                enrollment.isCompleted ? Colors.green : colorScheme.primary,
              ),
            ),
          ),
          if (enrollment.score != null) ...[
            const SizedBox(height: 8),
            Text(
              'Puntuacion: ${enrollment.score}%',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
                color: enrollment.score! >= (enrollment.course?.passingScore ?? 70)
                    ? Colors.green
                    : Colors.red,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActionButton(TrainingEnrollment enrollment,
      ThemeData theme, ColorScheme colorScheme) {
    final isSubmitting = ref.watch(trainingProvider).isSubmitting;

    if (enrollment.isAssigned) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: isSubmitting
                ? null
                : () async {
                    final success = await ref
                        .read(trainingProvider.notifier)
                        .startCourse(enrollment.id);
                    if (success && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Curso iniciado')),
                      );
                    }
                  },
            icon: isSubmitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.play_arrow),
            label: Text(isSubmitting ? 'Iniciando...' : 'Iniciar Curso'),
            style: ElevatedButton.styleFrom(
              backgroundColor: colorScheme.primary,
              foregroundColor: colorScheme.onPrimary,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
      );
    }

    if (enrollment.isInProgress && _allLessonsCompleted(enrollment)) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: isSubmitting
                ? null
                : () async {
                    final success = await ref
                        .read(trainingProvider.notifier)
                        .completeCourse(enrollment.id);
                    if (success && mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Curso completado!')),
                      );
                      context.pop();
                    }
                  },
            icon: isSubmitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.check_circle),
            label: Text(
                isSubmitting ? 'Completando...' : 'Completar Curso'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildLessonsList(TrainingEnrollment enrollment,
      ThemeData theme, ColorScheme colorScheme) {
    final course = enrollment.course;
    if (course == null) return const SizedBox.shrink();

    final lessons = List<TrainingLesson>.from(course.lessons)
      ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(
            'Lecciones',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const Divider(height: 1),
        ...lessons.map((lesson) {
          final progress = _getProgress(enrollment, lesson.id);
          return Column(
            children: [
              LessonTile(
                lesson: lesson,
                progress: progress,
                onTap: () {
                  if (!enrollment.isInProgress && !enrollment.isCompleted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Inicia el curso primero'),
                      ),
                    );
                    return;
                  }

                  if (lesson.isQuiz) {
                    context.push(
                      '/training/quiz/${enrollment.id}/${lesson.id}',
                      extra: {
                        'enrollment': enrollment,
                        'lesson': lesson,
                      },
                    );
                  } else {
                    context.push(
                      '/training/lesson/${enrollment.id}/${lesson.id}',
                      extra: {
                        'enrollment': enrollment,
                        'lesson': lesson,
                        'progress': progress,
                      },
                    );
                  }
                },
              ),
              const Divider(height: 1),
            ],
          );
        }),
        const SizedBox(height: 32),
      ],
    );
  }
}
