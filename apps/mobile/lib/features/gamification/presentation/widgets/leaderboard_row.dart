import 'package:flutter/material.dart';
import 'package:plexo_ops/features/gamification/data/models/gamification_model.dart';

/// Single row widget for leaderboard display.
/// Rank 1-3 get special styling (gold/silver/bronze rank circle).
/// Current user row has a highlighted background.
class LeaderboardRow extends StatelessWidget {
  final LeaderboardEntry entry;
  final String period;
  final bool isCurrentUser;

  const LeaderboardRow({
    super.key,
    required this.entry,
    this.period = 'weekly',
    this.isCurrentUser = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final points = entry.pointsForPeriod(period);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: isCurrentUser ? 3 : 1,
      color: isCurrentUser
          ? colorScheme.primaryContainer.withOpacity(0.3)
          : colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isCurrentUser
            ? BorderSide(color: colorScheme.primary, width: 1.5)
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Rank number with special styling for top 3
            _buildRankIndicator(theme, colorScheme),
            const SizedBox(width: 12),

            // User avatar
            CircleAvatar(
              radius: 20,
              backgroundColor: isCurrentUser
                  ? colorScheme.primaryContainer.withOpacity(0.5)
                  : colorScheme.surfaceContainerHighest,
              child: Text(
                entry.userName.isNotEmpty
                    ? entry.userName[0].toUpperCase()
                    : '?',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isCurrentUser
                      ? colorScheme.primary
                      : colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Name and store
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          entry.userName,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isCurrentUser
                                ? colorScheme.primary
                                : colorScheme.onSurface,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isCurrentUser) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: colorScheme.primaryContainer.withOpacity(0.5),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Tu',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: colorScheme.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (entry.storeName != null) ...[
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(
                          Icons.store,
                          size: 12,
                          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            entry.storeName!,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            // Points badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isCurrentUser
                    ? colorScheme.primaryContainer.withOpacity(0.5)
                    : colorScheme.primaryContainer.withOpacity(0.3),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.stars,
                    size: 16,
                    color: colorScheme.primary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '$points',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: colorScheme.primary,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRankIndicator(ThemeData theme, ColorScheme colorScheme) {
    // Top 3 get colored rank circles
    if (entry.rank >= 1 && entry.rank <= 3) {
      Color rankColor;
      switch (entry.rank) {
        case 1:
          rankColor = const Color(0xFFFFD700); // Gold
          break;
        case 2:
          rankColor = const Color(0xFFC0C0C0); // Silver
          break;
        case 3:
          rankColor = const Color(0xFFCD7F32); // Bronze
          break;
        default:
          rankColor = colorScheme.onSurfaceVariant;
      }

      return Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: rankColor.withOpacity(0.15),
          shape: BoxShape.circle,
          border: Border.all(color: rankColor, width: 2),
        ),
        child: Center(
          child: Text(
            '#${entry.rank}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: rankColor,
              fontSize: 14,
            ),
          ),
        ),
      );
    }

    // Regular rank circle for 4th place and below
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: isCurrentUser
            ? colorScheme.primaryContainer.withOpacity(0.5)
            : colorScheme.surfaceContainerHighest,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          '#${entry.rank}',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: isCurrentUser ? colorScheme.primary : colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
