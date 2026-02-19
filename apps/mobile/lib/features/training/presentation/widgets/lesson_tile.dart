import 'package:flutter/material.dart';
import 'package:plexo_ops/features/training/data/models/training_model.dart';

class LessonTile extends StatelessWidget {
  final TrainingLesson lesson;
  final TrainingProgress? progress;
  final VoidCallback onTap;

  const LessonTile({
    super.key,
    required this.lesson,
    this.progress,
    required this.onTap,
  });

  IconData _typeIcon() {
    switch (lesson.type) {
      case 'TEXT':
        return Icons.article_outlined;
      case 'PDF':
        return Icons.picture_as_pdf_outlined;
      case 'VIDEO':
        return Icons.play_circle_outline;
      case 'QUIZ':
        return Icons.quiz_outlined;
      default:
        return Icons.description_outlined;
    }
  }

  Color _typeColor() {
    switch (lesson.type) {
      case 'TEXT':
        return Colors.blue;
      case 'PDF':
        return Colors.red;
      case 'VIDEO':
        return Colors.purple;
      case 'QUIZ':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    final isCompleted = progress?.isCompleted ?? false;

    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: isCompleted
              ? Colors.green.withValues(alpha: isDark ? 0.2 : 0.1)
              : _typeColor().withValues(alpha: isDark ? 0.2 : 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          isCompleted ? Icons.check_circle : _typeIcon(),
          color: isCompleted ? Colors.green : _typeColor(),
          size: 22,
        ),
      ),
      title: Text(
        lesson.title,
        style: theme.textTheme.bodyMedium?.copyWith(
          fontWeight: FontWeight.w600,
          decoration: isCompleted ? TextDecoration.lineThrough : null,
          color: isCompleted
              ? colorScheme.onSurfaceVariant
              : colorScheme.onSurface,
        ),
      ),
      subtitle: Row(
        children: [
          Text(
            lesson.typeLabel,
            style: theme.textTheme.bodySmall?.copyWith(
              color: _typeColor(),
              fontWeight: FontWeight.w500,
            ),
          ),
          if (lesson.estimatedMinutes != null) ...[
            const SizedBox(width: 8),
            Icon(Icons.schedule,
                size: 12, color: colorScheme.onSurfaceVariant),
            const SizedBox(width: 2),
            Text(
              '${lesson.estimatedMinutes} min',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
          if (progress?.score != null) ...[
            const SizedBox(width: 8),
            Text(
              '${progress!.score}%',
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.green,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ],
      ),
      trailing: Icon(
        Icons.chevron_right,
        color: colorScheme.onSurfaceVariant,
      ),
    );
  }
}
