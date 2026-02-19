import 'package:flutter/material.dart';
import 'package:plexo_ops/features/announcements/data/models/announcement_model.dart';

/// A banner widget for displaying urgent or important announcements
/// at the top of the home screen
class AnnouncementBanner extends StatelessWidget {
  final AnnouncementModel announcement;
  final VoidCallback onTap;
  final VoidCallback? onDismiss;

  const AnnouncementBanner({
    super.key,
    required this.announcement,
    required this.onTap,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    Color textColor;
    IconData icon;

    if (announcement.type == AnnouncementType.emergency) {
      bgColor = Colors.red;
      textColor = Colors.white;
      icon = Icons.warning;
    } else if (announcement.priority == Priority.high) {
      bgColor = Colors.orange;
      textColor = Colors.white;
      icon = Icons.notifications_active;
    } else {
      bgColor = Colors.blue;
      textColor = Colors.white;
      icon = Icons.campaign;
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: bgColor.withValues(alpha: 0.4),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Main content
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      icon,
                      color: textColor,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Text content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          announcement.typeLabel.toUpperCase(),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: textColor.withValues(alpha: 0.8),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          announcement.title,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: textColor,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (announcement.summary != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            announcement.summary!,
                            style: TextStyle(
                              fontSize: 13,
                              color: textColor.withValues(alpha: 0.9),
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Dismiss button (optional)
                  if (onDismiss != null)
                    GestureDetector(
                      onTap: onDismiss,
                      child: Padding(
                        padding: const EdgeInsets.all(4),
                        child: Icon(
                          Icons.close,
                          color: textColor.withValues(alpha: 0.7),
                          size: 20,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Action indicator
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(12),
                  bottomRight: Radius.circular(12),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    announcement.requiresAck && !announcement.isAcknowledged
                        ? 'Toque para leer y confirmar'
                        : 'Toque para ver detalles',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.arrow_forward,
                    size: 16,
                    color: textColor,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// A compact version of the announcement banner for smaller spaces
class CompactAnnouncementBanner extends StatelessWidget {
  final int unreadCount;
  final VoidCallback onTap;

  const CompactAnnouncementBanner({
    super.key,
    required this.unreadCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (unreadCount == 0) {
      return const SizedBox.shrink();
    }

    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final accentColor = isDark ? Colors.blue.shade300 : Colors.blue.shade700;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: colorScheme.primaryContainer.withValues(alpha: isDark ? 0.3 : 0.15),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: colorScheme.primary.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Icon(
              Icons.campaign,
              color: accentColor,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Tienes $unreadCount ${unreadCount == 1 ? 'anuncio nuevo' : 'anuncios nuevos'}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: accentColor,
                ),
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 14,
              color: accentColor,
            ),
          ],
        ),
      ),
    );
  }
}
