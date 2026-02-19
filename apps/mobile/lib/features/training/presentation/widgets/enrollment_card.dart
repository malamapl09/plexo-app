import 'package:flutter/material.dart';
import 'package:plexo_ops/features/training/data/models/training_model.dart';

class EnrollmentCard extends StatelessWidget {
  final TrainingEnrollment enrollment;
  final VoidCallback onTap;

  const EnrollmentCard({
    super.key,
    required this.enrollment,
    required this.onTap,
  });

  Color _statusColor(String status) {
    switch (status) {
      case 'ASSIGNED':
        return Colors.blue;
      case 'IN_PROGRESS':
        return Colors.amber.shade700;
      case 'COMPLETED':
        return Colors.green;
      case 'EXPIRED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _categoryColor(String category) {
    switch (category) {
      case 'OPERATIONS':
        return Colors.blue;
      case 'CASH_MANAGEMENT':
        return Colors.green;
      case 'CUSTOMER_SERVICE':
        return Colors.purple;
      case 'INVENTORY':
        return Colors.orange;
      case 'COMPLIANCE':
        return Colors.red;
      case 'SAFETY':
        return Colors.amber.shade700;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    final course = enrollment.course;
    final rawStatusColor = _statusColor(enrollment.status);
    final statusColor = isDark ? Color.lerp(rawStatusColor, Colors.white, 0.15)! : rawStatusColor;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: enrollment.isAssigned && (course?.isMandatory ?? false)
            ? BorderSide(color: Colors.red.shade300, width: 1.5)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title row
              Row(
                children: [
                  Expanded(
                    child: Text(
                      course?.title ?? 'Curso',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.chevron_right,
                      color: colorScheme.onSurfaceVariant),
                ],
              ),
              const SizedBox(height: 8),

              // Category + mandatory badges
              Row(
                children: [
                  if (course != null)
                    Builder(builder: (_) {
                      final catColor = _categoryColor(course.category);
                      final chipColor = isDark ? Color.lerp(catColor, Colors.white, 0.15)! : catColor;
                      return Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: catColor.withValues(alpha: isDark ? 0.2 : 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          course.categoryLabel,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: chipColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      );
                    }),
                  const SizedBox(width: 6),
                  if (course?.isMandatory ?? false)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Obligatorio',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.red,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  const Spacer(),
                  // Status badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: rawStatusColor.withValues(alpha: isDark ? 0.2 : 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: statusColor),
                    ),
                    child: Text(
                      enrollment.statusLabel,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Progress bar (only for in-progress or completed)
              if (enrollment.isInProgress || enrollment.isCompleted) ...[
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: enrollment.progressFraction,
                          minHeight: 6,
                          backgroundColor:
                              colorScheme.surfaceContainerHighest,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(statusColor),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      enrollment.progressText,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
              ],

              // Duration + score row
              Row(
                children: [
                  if (course?.estimatedDurationMinutes != null) ...[
                    Icon(Icons.schedule,
                        size: 14, color: colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text(
                      '${course!.estimatedDurationMinutes} min',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Icon(Icons.menu_book,
                      size: 14, color: colorScheme.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text(
                    '${course?.totalLessons ?? 0} lecciones',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (enrollment.score != null) ...[
                    const Spacer(),
                    Icon(Icons.grade,
                        size: 14, color: colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text(
                      '${enrollment.score}%',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
