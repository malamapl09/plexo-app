import 'package:flutter/material.dart';
import 'package:plexo_ops/features/issues/data/models/issue_model.dart';

class IssueCard extends StatelessWidget {
  final IssueModel issue;
  final VoidCallback? onTap;

  const IssueCard({
    super.key,
    required this.issue,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category icon
                  Builder(builder: (context) {
                    final isDark = Theme.of(context).brightness == Brightness.dark;
                    final catColor = _getCategoryColor(issue.category);
                    return Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: catColor.withOpacity(isDark ? 0.2 : 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        _getCategoryIcon(issue.category),
                        color: isDark ? Color.lerp(catColor, Colors.white, 0.2)! : catColor,
                        size: 24,
                      ),
                    );
                  }),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                issue.title,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (issue.isEscalated) ...[
                              const SizedBox(width: 8),
                              Builder(builder: (context) {
                                final isDark = Theme.of(context).brightness == Brightness.dark;
                                final escalatedColor = isDark ? Colors.red.shade300 : Colors.red.shade700;
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withValues(alpha: isDark ? 0.25 : 0.15),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.priority_high,
                                        size: 12,
                                        color: escalatedColor,
                                      ),
                                      const SizedBox(width: 2),
                                      Text(
                                        'Escalada',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: escalatedColor,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          issue.description,
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                                  ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Footer with status, priority, and time
              Row(
                children: [
                  _buildStatusChip(context),
                  const SizedBox(width: 8),
                  _buildPriorityChip(context),
                  const Spacer(),
                  Icon(
                    Icons.access_time,
                    size: 14,
                    color: Theme.of(context).textTheme.bodySmall?.color,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatTimeAgo(issue.createdAt),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              // Assigned to
              if (issue.assignedTo != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.person_outline,
                      size: 14,
                      color: Theme.of(context).textTheme.bodySmall?.color,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Asignado a: ${issue.assignedTo!.name}',
                      style: Theme.of(context).textTheme.bodySmall,
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

  Widget _buildStatusChip(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final statusColor = _getStatusColor(issue.status);
    final chipColor = isDark ? Color.lerp(statusColor, Colors.white, 0.2)! : statusColor;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(isDark ? 0.2 : 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        issue.statusLabel,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: chipColor,
        ),
      ),
    );
  }

  Widget _buildPriorityChip(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final priorityColor = _getPriorityColor(issue.priority);
    final chipColor = isDark ? Color.lerp(priorityColor, Colors.white, 0.2)! : priorityColor;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: priorityColor.withOpacity(isDark ? 0.2 : 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: priorityColor.withOpacity(isDark ? 0.4 : 0.3),
        ),
      ),
      child: Text(
        issue.priorityLabel,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: chipColor,
        ),
      ),
    );
  }

  Color _getCategoryColor(IssueCategory category) {
    switch (category) {
      case IssueCategory.maintenance:
        return Colors.orange;
      case IssueCategory.cleaning:
        return Colors.teal;
      case IssueCategory.security:
        return Colors.red;
      case IssueCategory.itSystems:
        return Colors.blue;
      case IssueCategory.personnel:
        return Colors.purple;
      case IssueCategory.inventory:
        return Colors.indigo;
    }
  }

  IconData _getCategoryIcon(IssueCategory category) {
    switch (category) {
      case IssueCategory.maintenance:
        return Icons.build_outlined;
      case IssueCategory.cleaning:
        return Icons.cleaning_services_outlined;
      case IssueCategory.security:
        return Icons.security_outlined;
      case IssueCategory.itSystems:
        return Icons.computer_outlined;
      case IssueCategory.personnel:
        return Icons.people_outline;
      case IssueCategory.inventory:
        return Icons.inventory_2_outlined;
    }
  }

  Color _getStatusColor(IssueStatus status) {
    switch (status) {
      case IssueStatus.reported:
        return Colors.orange;
      case IssueStatus.assigned:
        return Colors.blue;
      case IssueStatus.inProgress:
        return Colors.indigo;
      case IssueStatus.resolved:
        return Colors.green;
      case IssueStatus.pendingVerification:
        return Colors.amber;
      case IssueStatus.verified:
        return Colors.teal;
      case IssueStatus.rejected:
        return Colors.red;
    }
  }

  Color _getPriorityColor(Priority priority) {
    switch (priority) {
      case Priority.low:
        return Colors.grey;
      case Priority.medium:
        return Colors.amber.shade700;
      case Priority.high:
        return Colors.red;
    }
  }

  String _formatTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 60) {
      return 'hace ${difference.inMinutes} min';
    } else if (difference.inHours < 24) {
      return 'hace ${difference.inHours}h';
    } else if (difference.inDays < 7) {
      return 'hace ${difference.inDays}d';
    } else {
      return '${dateTime.day}/${dateTime.month}';
    }
  }
}
