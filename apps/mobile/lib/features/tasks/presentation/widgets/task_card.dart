import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/tasks/data/models/task_model.dart';

class TaskCard extends StatelessWidget {
  final TaskModel task;
  final VoidCallback onComplete;
  final VoidCallback onTap;

  const TaskCard({
    super.key,
    required this.task,
    required this.onComplete,
    required this.onTap,
  });

  Color priorityColorFor(BuildContext context) {
    switch (task.priority) {
      case 'HIGH':
        return AppColors.priorityHigh;
      case 'MEDIUM':
        return AppColors.priorityMedium;
      case 'LOW':
        return AppColors.priorityLow;
      default:
        return Theme.of(context).colorScheme.onSurfaceVariant;
    }
  }

  String get priorityLabel {
    switch (task.priority) {
      case 'HIGH':
        return 'Alta';
      case 'MEDIUM':
        return 'Media';
      case 'LOW':
        return 'Baja';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final timeFormat = DateFormat('h:mm a');
    final priorityColor = priorityColorFor(context);

    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Card(
      elevation: task.isCompleted ? 0 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: task.isCompleted
            ? BorderSide(color: AppColors.success.withOpacity(isDark ? 0.4 : 0.3))
            : BorderSide.none,
      ),
      color: task.isCompleted ? AppColors.success.withOpacity(isDark ? 0.1 : 0.05) : null,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  // Priority indicator
                  Container(
                    width: 4,
                    height: 40,
                    decoration: BoxDecoration(
                      color: priorityColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Title and department
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          task.title,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: task.isCompleted
                                ? Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6)
                                : Theme.of(context).textTheme.bodyLarge?.color,
                            decoration: task.isCompleted
                                ? TextDecoration.lineThrough
                                : null,
                          ),
                        ),
                        if (task.department != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            task.department!.name,
                            style: TextStyle(
                              fontSize: 13,
                              color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Complete button or status
                  if (task.isCompleted)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.success.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle,
                              size: 16, color: AppColors.success),
                          const SizedBox(width: 4),
                          Text(
                            'Completada',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.success,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  else if (task.isOverdue)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.warning,
                              size: 16, color: AppColors.error),
                          const SizedBox(width: 4),
                          Text(
                            'Atrasada',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.error,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    IconButton(
                      onPressed: onComplete,
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.success.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check,
                          color: AppColors.success,
                          size: 20,
                        ),
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 12),

              // Description
              if (task.description != null && task.description!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    task.description!,
                    style: TextStyle(
                      fontSize: 14,
                      color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),

              // Footer with time and priority
              Row(
                children: [
                  // Scheduled time
                  if (task.scheduledTime != null) ...[
                    Icon(Icons.schedule,
                        size: 16, color: Theme.of(context).iconTheme.color?.withOpacity(0.5)),
                    const SizedBox(width: 4),
                    Text(
                      timeFormat.format(task.scheduledTime!),
                      style: TextStyle(
                        fontSize: 13,
                        color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(width: 16),
                  ],

                  // Due time
                  if (task.dueTime != null) ...[
                    Icon(
                      Icons.flag,
                      size: 16,
                      color: task.isOverdue
                          ? AppColors.error
                          : Theme.of(context).iconTheme.color?.withOpacity(0.5),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Hasta ${timeFormat.format(task.dueTime!)}',
                      style: TextStyle(
                        fontSize: 13,
                        color: task.isOverdue
                            ? AppColors.error
                            : Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                      ),
                    ),
                  ],

                  const Spacer(),

                  // Priority badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: priorityColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      priorityLabel,
                      style: TextStyle(
                        fontSize: 11,
                        color: priorityColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              // Completed by info
              if (task.isCompleted && task.assignment?.completedBy != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.person, size: 14, color: Theme.of(context).iconTheme.color?.withOpacity(0.5)),
                    const SizedBox(width: 4),
                    Text(
                      'Completada por ${task.assignment!.completedBy!.name}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).textTheme.bodySmall?.color,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
