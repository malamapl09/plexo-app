import 'package:flutter/material.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/checklists/data/models/checklist_model.dart';

/// A card widget that displays a checklist template summary
/// with frequency badge, today's progress, and status.
class ChecklistCard extends StatelessWidget {
  final ChecklistTemplate template;
  final VoidCallback onTap;

  const ChecklistCard({
    super.key,
    required this.template,
    required this.onTap,
  });

  Color _frequencyColor(ColorScheme colorScheme) {
    switch (template.frequency) {
      case 'DAILY':
        return AppColors.info;
      case 'WEEKLY':
        return AppColors.secondary;
      case 'MONTHLY':
        return AppColors.categoryIT;
      default:
        return colorScheme.onSurfaceVariant;
    }
  }

  IconData get _frequencyIcon {
    switch (template.frequency) {
      case 'DAILY':
        return Icons.today;
      case 'WEEKLY':
        return Icons.date_range;
      case 'MONTHLY':
        return Icons.calendar_month;
      default:
        return Icons.event;
    }
  }

  Color _statusColor(ColorScheme colorScheme) {
    if (template.isCompletedToday) return AppColors.success;
    if (template.hasSubmissionToday) return AppColors.warning;
    return colorScheme.onSurfaceVariant;
  }

  String get _statusLabel {
    if (template.isCompletedToday) return 'Completado';
    if (template.hasSubmissionToday) return 'En Progreso';
    return 'Pendiente';
  }

  IconData get _statusIcon {
    if (template.isCompletedToday) return Icons.check_circle;
    if (template.hasSubmissionToday) return Icons.pending;
    return Icons.radio_button_unchecked;
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final completedItems = template.todaySubmission?.completedItems ?? 0;
    final totalItems = template.items.length;
    final freqColor = _frequencyColor(colorScheme);
    final statColor = _statusColor(colorScheme);

    return Card(
      elevation: template.isCompletedToday ? 0 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: template.isCompletedToday
            ? BorderSide(color: AppColors.success.withOpacity(0.3))
            : BorderSide.none,
      ),
      color: template.isCompletedToday
          ? AppColors.success.withOpacity(0.05)
          : null,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row: title + status badge
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Frequency color bar
                  Container(
                    width: 4,
                    height: 44,
                    decoration: BoxDecoration(
                      color: freqColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Title and description
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          template.title,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: template.isCompletedToday
                                ? Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.color
                                    ?.withOpacity(0.6)
                                : Theme.of(context).textTheme.bodyLarge?.color,
                            decoration: template.isCompletedToday
                                ? TextDecoration.lineThrough
                                : null,
                          ),
                        ),
                        if (template.description != null &&
                            template.description!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            template.description!,
                            style: TextStyle(
                              fontSize: 13,
                              color: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.color
                                  ?.withOpacity(0.7),
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(width: 8),

                  // Status badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: statColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_statusIcon, size: 14, color: statColor),
                        const SizedBox(width: 4),
                        Text(
                          _statusLabel,
                          style: TextStyle(
                            fontSize: 11,
                            color: statColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // Progress bar (only when there is a submission in progress)
              if (template.hasSubmissionToday &&
                  !template.isCompletedToday) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: template.todayProgress,
                    minHeight: 6,
                    backgroundColor: colorScheme.outlineVariant,
                    valueColor:
                        AlwaysStoppedAnimation<Color>(colorScheme.primary),
                  ),
                ),
                const SizedBox(height: 10),
              ],

              // Footer: frequency badge + items count
              Row(
                children: [
                  // Frequency badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: freqColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_frequencyIcon,
                            size: 12, color: freqColor),
                        const SizedBox(width: 4),
                        Text(
                          template.frequencyLabel,
                          style: TextStyle(
                            fontSize: 11,
                            color: freqColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const Spacer(),

                  // Items progress count
                  Icon(
                    Icons.format_list_numbered,
                    size: 16,
                    color: Theme.of(context)
                        .iconTheme
                        .color
                        ?.withOpacity(0.5),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '$completedItems / $totalItems items',
                    style: TextStyle(
                      fontSize: 13,
                      color: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.color
                          ?.withOpacity(0.7),
                    ),
                  ),

                  // Chevron
                  const SizedBox(width: 8),
                  Icon(
                    Icons.chevron_right,
                    size: 20,
                    color: Theme.of(context)
                        .iconTheme
                        .color
                        ?.withOpacity(0.4),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
