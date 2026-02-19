import 'package:flutter/material.dart';
import 'package:plexo_ops/features/announcements/data/models/announcement_model.dart';
import 'package:intl/intl.dart';

class AnnouncementCard extends StatelessWidget {
  final AnnouncementModel announcement;
  final VoidCallback onTap;

  const AnnouncementCard({
    super.key,
    required this.announcement,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: announcement.isViewed ? 1 : 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: announcement.isUrgent && !announcement.isAcknowledged
            ? const BorderSide(color: Colors.red, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row with type badge and unread indicator
              Row(
                children: [
                  _buildTypeBadge(colorScheme),
                  const SizedBox(width: 8),
                  _buildPriorityBadge(colorScheme),
                  const Spacer(),
                  if (!announcement.isViewed)
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: colorScheme.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),

              // Title
              Text(
                announcement.title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight:
                      announcement.isViewed ? FontWeight.w500 : FontWeight.bold,
                  color: Theme.of(context).textTheme.bodyLarge?.color,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              // Summary
              if (announcement.summary != null) ...[
                const SizedBox(height: 8),
                Text(
                  announcement.summary!,
                  style: TextStyle(
                    fontSize: 14,
                    color: Theme.of(context).textTheme.bodyMedium?.color?.withValues(alpha: 0.8),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],

              const SizedBox(height: 12),

              // Footer
              Row(
                children: [
                  // Author and date
                  Expanded(
                    child: Text(
                      '${announcement.createdBy.name} • ${_formatDate(announcement.publishedAt ?? announcement.createdAt)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Theme.of(context).textTheme.bodySmall?.color?.withValues(alpha: 0.7),
                      ),
                    ),
                  ),

                  // Acknowledgment indicator
                  if (announcement.requiresAck) ...[
                    if (announcement.isAcknowledged)
                      const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.check_circle,
                            size: 16,
                            color: Colors.green,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Confirmado',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.green,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      )
                    else
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.pending,
                            size: 16,
                            color: Colors.orange[700],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Pendiente',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.orange[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
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

  Widget _buildTypeBadge(ColorScheme colorScheme) {
    final isDark = colorScheme.brightness == Brightness.dark;
    Color baseColor;
    IconData icon;

    switch (announcement.type) {
      case AnnouncementType.emergency:
        baseColor = Colors.red;
        icon = Icons.warning;
        break;
      case AnnouncementType.systemAlert:
        baseColor = Colors.orange;
        icon = Icons.notifications_active;
        break;
      case AnnouncementType.operationalUpdate:
        baseColor = Colors.blue;
        icon = Icons.update;
        break;
      case AnnouncementType.policyUpdate:
        baseColor = Colors.purple;
        icon = Icons.policy;
        break;
      case AnnouncementType.training:
        baseColor = Colors.green;
        icon = Icons.school;
        break;
      case AnnouncementType.general:
      default:
        baseColor = colorScheme.onSurfaceVariant;
        icon = Icons.info;
    }

    final bgColor = announcement.type == AnnouncementType.general
        ? colorScheme.surfaceContainerHighest
        : baseColor.withValues(alpha: isDark ? 0.25 : 0.15);
    final textColor = announcement.type == AnnouncementType.general
        ? colorScheme.onSurfaceVariant
        : (isDark ? Color.lerp(baseColor, Colors.white, 0.3)! : baseColor.withValues(alpha: 0.85));

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            announcement.typeLabel,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriorityBadge(ColorScheme colorScheme) {
    if (announcement.priority == Priority.low) {
      return const SizedBox.shrink();
    }

    final isDark = colorScheme.brightness == Brightness.dark;
    Color bgColor;
    Color textColor;

    switch (announcement.priority) {
      case Priority.high:
        bgColor = Colors.red.withValues(alpha: isDark ? 0.25 : 0.15);
        textColor = isDark ? Colors.red.shade300 : Colors.red.shade700;
        break;
      case Priority.medium:
        bgColor = Colors.yellow.withValues(alpha: isDark ? 0.25 : 0.15);
        textColor = isDark ? Colors.amber.shade300 : Colors.yellow.shade900;
        break;
      case Priority.low:
      default:
        return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        'Prioridad ${announcement.priorityLabel}',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inMinutes < 60) {
      return 'Hace ${difference.inMinutes} min';
    } else if (difference.inHours < 24) {
      return 'Hace ${difference.inHours} horas';
    } else if (difference.inDays < 7) {
      return 'Hace ${difference.inDays} dias';
    } else {
      return DateFormat('d MMM', 'es').format(date);
    }
  }
}
