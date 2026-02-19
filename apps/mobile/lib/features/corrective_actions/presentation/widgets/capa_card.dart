import 'package:flutter/material.dart';
import 'package:plexo_ops/features/corrective_actions/data/models/corrective_action_model.dart';

/// Card widget that summarises a single corrective action in a list.
///
/// Displays: title or description (first line), status badge, priority badge,
/// due date, source type icon, store name.  Tappable to navigate to detail.
class CapaCard extends StatelessWidget {
  final CorrectiveActionModel action;
  final VoidCallback onTap;

  const CapaCard({
    super.key,
    required this.action,
    required this.onTap,
  });

  // ---------------------------------------------------------------------------
  // Source type icon
  // ---------------------------------------------------------------------------

  IconData get _sourceTypeIcon {
    switch (action.sourceType) {
      case 'AUDIT_FINDING':
        return Icons.fact_check;
      case 'CHECKLIST_FAILURE':
        return Icons.playlist_remove;
      case 'ISSUE':
        return Icons.report_problem;
      case 'MANUAL':
        return Icons.edit_note;
      default:
        return Icons.assignment;
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isOverdue = action.isOverdue;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isOverdue
            ? BorderSide(color: colorScheme.error, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: isOverdue
                ? LinearGradient(
                    colors: [
                      colorScheme.error.withValues(alpha: 0.06),
                      colorScheme.error.withValues(alpha: 0.02),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ---- Title row ----
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Source type color bar
                  Container(
                    width: 4,
                    height: 44,
                    decoration: BoxDecoration(
                      color: action.statusColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Title + source type icon
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          action.displayTitle,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: colorScheme.onSurface,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              _sourceTypeIcon,
                              size: 14,
                              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              action.sourceTypeLabel,
                              style: TextStyle(
                                fontSize: 12,
                                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 8),

                  // Status badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: action.statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      action.statusLabel,
                      style: TextStyle(
                        fontSize: 11,
                        color: action.statusColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // ---- Store name ----
              if (action.storeName != null) ...[
                Row(
                  children: [
                    Icon(
                      Icons.store,
                      size: 14,
                      color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      action.storeName!,
                      style: TextStyle(
                        fontSize: 13,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
              ],

              // ---- Due date ----
              Row(
                children: [
                  Icon(
                    isOverdue ? Icons.warning : Icons.calendar_today,
                    size: 14,
                    color: isOverdue
                        ? colorScheme.error
                        : colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Vence: ${_formatDate(action.dueDate)}',
                    style: TextStyle(
                      fontSize: 13,
                      color: isOverdue
                          ? colorScheme.error
                          : colorScheme.onSurfaceVariant,
                      fontWeight:
                          isOverdue ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                  if (isOverdue) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: colorScheme.error,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'VENCIDA',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),

              const SizedBox(height: 12),

              // ---- Bottom row: priority badge + chevron ----
              Row(
                children: [
                  // Priority badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: action.priorityColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: action.priorityColor),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.flag,
                          size: 12,
                          color: action.priorityColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          action.priorityLabel,
                          style: TextStyle(
                            color: action.priorityColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const Spacer(),

                  // Chevron
                  Icon(
                    Icons.chevron_right,
                    size: 20,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    return '$day/$month/${date.year}';
  }
}
