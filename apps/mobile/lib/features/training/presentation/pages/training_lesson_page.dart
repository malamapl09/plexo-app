import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/features/training/data/models/training_model.dart';
import 'package:plexo_ops/features/training/presentation/providers/training_provider.dart';

class TrainingLessonPage extends ConsumerWidget {
  final String enrollmentId;
  final String lessonId;
  final TrainingEnrollment? enrollment;
  final TrainingLesson? lesson;
  final TrainingProgress? progress;

  const TrainingLessonPage({
    super.key,
    required this.enrollmentId,
    required this.lessonId,
    this.enrollment,
    this.lesson,
    this.progress,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final state = ref.watch(trainingProvider);
    final isCompleted = progress?.isCompleted ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text(lesson?.title ?? 'Leccion'),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
      ),
      body: lesson == null
          ? const Center(child: Text('Leccion no encontrada'))
          : Column(
              children: [
                Expanded(
                  child: _buildContent(lesson!, theme, colorScheme),
                ),
                if (!isCompleted && enrollment?.isInProgress == true)
                  _buildCompleteButton(
                      context, ref, state, theme, colorScheme),
              ],
            ),
    );
  }

  Widget _buildContent(
      TrainingLesson lesson, ThemeData theme, ColorScheme colorScheme) {
    if (lesson.isText) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildLessonHeader(lesson, theme, colorScheme),
            const SizedBox(height: 16),
            Text(
              lesson.content ?? 'Sin contenido',
              style: theme.textTheme.bodyLarge?.copyWith(
                height: 1.6,
              ),
            ),
          ],
        ),
      );
    }

    if (lesson.isPdf) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.picture_as_pdf,
                  size: 64, color: Colors.red.withValues(alpha: 0.6)),
              const SizedBox(height: 16),
              Text(
                'Documento PDF',
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Lectura del documento PDF adjunto',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              if (lesson.fileUrl != null) ...[
                const SizedBox(height: 16),
                Text(
                  lesson.fileUrl!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.primary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      );
    }

    if (lesson.isVideo) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.play_circle_filled,
                  size: 64,
                  color: Colors.purple.withValues(alpha: 0.6)),
              const SizedBox(height: 16),
              Text(
                'Video',
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Reproduce el video de la leccion',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              if (lesson.fileUrl != null) ...[
                const SizedBox(height: 16),
                Text(
                  lesson.fileUrl!,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.primary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      );
    }

    return const Center(child: Text('Tipo de leccion no soportado'));
  }

  Widget _buildLessonHeader(
      TrainingLesson lesson, ThemeData theme, ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(Icons.article_outlined,
              color: colorScheme.primary, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              lesson.title,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (lesson.estimatedMinutes != null)
            Text(
              '${lesson.estimatedMinutes} min',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCompleteButton(BuildContext context, WidgetRef ref,
      TrainingState state, ThemeData theme, ColorScheme colorScheme) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: state.isSubmitting
                ? null
                : () async {
                    final success = await ref
                        .read(trainingProvider.notifier)
                        .completeLesson(enrollmentId, lessonId);
                    if (success && context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Leccion completada')),
                      );
                      Navigator.pop(context);
                    }
                  },
            icon: state.isSubmitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.check),
            label: Text(state.isSubmitting
                ? 'Completando...'
                : 'Marcar como Completada'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
      ),
    );
  }
}
