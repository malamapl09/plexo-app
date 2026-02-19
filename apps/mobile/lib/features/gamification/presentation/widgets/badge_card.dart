import 'package:flutter/material.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/core/theme/app_theme.dart';
import 'package:plexo_ops/features/gamification/data/models/gamification_model.dart';

/// Card for a single badge in the grid.
/// Shows icon (placeholder circle if no iconUrl), name, earned/locked state.
/// If earned: shows "Obtenida" label with date.
/// If locked: shows gray overlay.
class BadgeCard extends StatelessWidget {
  final BadgeModel badge;
  final VoidCallback onTap;

  const BadgeCard({
    super.key,
    required this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isEarned = badge.isEarned;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: isEarned
              ? colorScheme.primaryContainer.withOpacity(context.isDark ? 0.15 : 0.3)
              : colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isEarned
                ? colorScheme.primary.withOpacity(context.isDark ? 0.5 : 1.0)
                : colorScheme.outlineVariant,
            width: isEarned ? 2 : 1,
          ),
        ),
        child: Stack(
          children: [
            // Gray overlay for locked badges
            if (!isEarned)
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.grey.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(11),
                  ),
                ),
              ),

            // Badge content
            Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Badge icon
                  _buildBadgeIcon(isEarned, colorScheme),
                  const SizedBox(height: 6),

                  // Badge name
                  Text(
                    badge.name,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isEarned
                          ? colorScheme.onSurface
                          : colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 4),

                  // Earned label with date, or lock icon
                  if (isEarned)
                    _buildEarnedLabel(theme, colorScheme)
                  else
                    _buildLockedLabel(theme, colorScheme),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadgeIcon(bool isEarned, ColorScheme colorScheme) {
    final hasIcon = badge.iconUrl != null && badge.iconUrl!.isNotEmpty;

    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: isEarned
            ? colorScheme.primaryContainer.withOpacity(0.5)
            : colorScheme.surfaceContainerHighest,
        shape: BoxShape.circle,
      ),
      child: hasIcon
          ? ClipOval(
              child: Image.network(
                badge.iconUrl!,
                width: 56,
                height: 56,
                fit: BoxFit.cover,
                color: isEarned ? null : Colors.grey,
                colorBlendMode: isEarned ? null : BlendMode.saturation,
                errorBuilder: (_, __, ___) => _buildPlaceholderIcon(isEarned, colorScheme),
              ),
            )
          : _buildPlaceholderIcon(isEarned, colorScheme),
    );
  }

  Widget _buildPlaceholderIcon(bool isEarned, ColorScheme colorScheme) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Icon(
          Icons.stars,
          size: 36,
          color: isEarned ? colorScheme.primary : colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
        ),
        if (!isEarned)
          Icon(
            Icons.lock,
            size: 18,
            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
          ),
      ],
    );
  }

  Widget _buildEarnedLabel(ThemeData theme, ColorScheme colorScheme) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: AppColors.success.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.check_circle,
                size: 12,
                color: AppColors.success,
              ),
              const SizedBox(width: 3),
              Text(
                'Obtenida',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: AppColors.success,
                  fontWeight: FontWeight.bold,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
        if (badge.earnedAt != null) ...[
          const SizedBox(height: 2),
          Text(
            _formatShortDate(badge.earnedAt!),
            style: theme.textTheme.labelSmall?.copyWith(
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
              fontSize: 9,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildLockedLabel(ThemeData theme, ColorScheme colorScheme) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.lock_outline,
          size: 12,
          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
        ),
        const SizedBox(width: 3),
        Text(
          'Bloqueada',
          style: theme.textTheme.labelSmall?.copyWith(
            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  String _formatShortDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year.toString().substring(2);
    return '$day/$month/$year';
  }
}
