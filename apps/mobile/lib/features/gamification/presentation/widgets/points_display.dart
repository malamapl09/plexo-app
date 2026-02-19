import 'package:flutter/material.dart';
import 'package:plexo_ops/features/gamification/data/models/gamification_model.dart';

/// Displays points summary as a row of 3 cards (weekly, total, monthly)
/// with the center card (total) emphasized / larger. Shows rank below.
class PointsDisplay extends StatelessWidget {
  final GamificationProfile profile;

  const PointsDisplay({
    super.key,
    required this.profile,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Column(
      children: [
        // Row of 3 point cards
        Row(
          children: [
            // Weekly points (left)
            Expanded(
              child: _PointCard(
                label: 'Semanal',
                points: profile.weeklyPoints,
                icon: Icons.calendar_view_week,
                isEmphasized: false,
              ),
            ),
            const SizedBox(width: 8),

            // Total points (center, emphasized)
            Expanded(
              flex: 2,
              child: _PointCard(
                label: 'Total',
                points: profile.totalPoints,
                icon: Icons.stars,
                isEmphasized: true,
              ),
            ),
            const SizedBox(width: 8),

            // Monthly points (right)
            Expanded(
              child: _PointCard(
                label: 'Mensual',
                points: profile.monthlyPoints,
                icon: Icons.calendar_month,
                isEmphasized: false,
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Rank display
        if (profile.rank > 0)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: colorScheme.primaryContainer.withOpacity(0.3),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: colorScheme.primary.withOpacity(0.3),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.leaderboard,
                  size: 18,
                  color: colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Posicion en el ranking: ',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                Text(
                  '#${profile.rank}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: colorScheme.primary,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// Individual point card within the row.
class _PointCard extends StatelessWidget {
  final String label;
  final int points;
  final IconData icon;
  final bool isEmphasized;

  const _PointCard({
    required this.label,
    required this.points,
    required this.icon,
    required this.isEmphasized,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (isEmphasized) {
      // Larger center card with gradient background
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              colorScheme.primary,
              colorScheme.primary.withOpacity(0.8),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: colorScheme.primary.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: Colors.white, size: 28),
            ),
            const SizedBox(height: 8),
            Text(
              _formatPoints(points),
              style: theme.textTheme.headlineSmall?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.white70,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    // Standard side card
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: colorScheme.shadow.withOpacity(0.1),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: colorScheme.primary, size: 22),
          const SizedBox(height: 6),
          Text(
            _formatPoints(points),
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: theme.textTheme.labelSmall?.copyWith(
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }

  /// Format large point numbers with K suffix.
  String _formatPoints(int points) {
    if (points >= 10000) {
      final k = points / 1000;
      return '${k.toStringAsFixed(k.truncateToDouble() == k ? 0 : 1)}K';
    }
    return points.toString();
  }
}
