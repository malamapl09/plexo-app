import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/gamification/data/models/gamification_model.dart';
import 'package:plexo_ops/features/gamification/presentation/providers/gamification_provider.dart';
import 'package:plexo_ops/features/gamification/presentation/widgets/badge_card.dart';

class BadgesPage extends ConsumerStatefulWidget {
  const BadgesPage({super.key});

  @override
  ConsumerState<BadgesPage> createState() => _BadgesPageState();
}

class _BadgesPageState extends ConsumerState<BadgesPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadBadges();
    });
  }

  void _loadBadges() {
    ref.read(gamificationProvider.notifier).loadBadges();
  }

  void _showBadgeDetail(BadgeModel badge) {
    showDialog(
      context: context,
      builder: (context) => _BadgeDetailDialog(badge: badge),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(gamificationProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return _buildErrorState(state.error!, theme, colorScheme);
    }

    if (state.allBadges.isEmpty) {
      return _buildEmptyState(theme, colorScheme);
    }

    return RefreshIndicator(
      onRefresh: () async => _loadBadges(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress summary banner
            _buildProgressBanner(state, theme),
            const SizedBox(height: 24),

            // Section: earned badges
            if (state.earnedBadgesCount > 0) ...[
              Text(
                'Obtenidas (${state.earnedBadgesCount})',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 12),
              _buildBadgeGrid(
                state.allBadges
                    .where((b) => b.isEarned)
                    .toList(),
              ),
              const SizedBox(height: 24),
            ],

            // Section: locked badges
            if (state.lockedBadgesCount > 0) ...[
              Text(
                'Por Obtener (${state.lockedBadgesCount})',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              _buildBadgeGrid(
                state.allBadges
                    .where((b) => !b.isEarned)
                    .toList(),
              ),
            ],

            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBanner(GamificationState state, ThemeData theme) {
    final colorScheme = theme.colorScheme;
    final total = state.allBadges.length;
    final earned = state.earnedBadgesCount;
    final progress = total > 0 ? earned / total : 0.0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            colorScheme.primary,
            colorScheme.primary.withOpacity(0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: colorScheme.primary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          const Icon(
            Icons.military_tech,
            size: 40,
            color: Colors.white,
          ),
          const SizedBox(height: 8),
          Text(
            'Progreso de Insignias',
            style: theme.textTheme.titleMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '$earned de $total',
            style: theme.textTheme.headlineMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: Colors.white.withOpacity(0.3),
              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${(progress * 100).toInt()}% completado',
            style: theme.textTheme.bodySmall?.copyWith(
              color: Colors.white70,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadgeGrid(List<BadgeModel> badges) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.72,
      ),
      itemCount: badges.length,
      itemBuilder: (context, index) {
        final badge = badges[index];
        return BadgeCard(
          badge: badge,
          onTap: () => _showBadgeDetail(badge),
        );
      },
    );
  }

  Widget _buildErrorState(String error, ThemeData theme, ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 48,
            color: colorScheme.error,
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              error,
              style: TextStyle(color: colorScheme.error),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadBadges,
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme, ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.stars,
            size: 64,
            color: colorScheme.primary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No hay insignias disponibles',
            style: theme.textTheme.titleMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== Badge Detail Dialog ====================

class _BadgeDetailDialog extends StatelessWidget {
  final BadgeModel badge;

  const _BadgeDetailDialog({required this.badge});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isEarned = badge.isEarned;

    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Badge icon
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: isEarned
                    ? colorScheme.primaryContainer.withOpacity(0.5)
                    : colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isEarned
                      ? colorScheme.primary
                      : colorScheme.outlineVariant,
                  width: 3,
                ),
              ),
              child: Center(
                child: badge.iconUrl != null && badge.iconUrl!.isNotEmpty
                    ? ClipOval(
                        child: Image.network(
                          badge.iconUrl!,
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                          color: isEarned ? null : Colors.grey,
                          colorBlendMode:
                              isEarned ? null : BlendMode.saturation,
                          errorBuilder: (_, __, ___) => Icon(
                            Icons.stars,
                            size: 64,
                            color: isEarned
                                ? colorScheme.primary
                                : colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                          ),
                        ),
                      )
                    : Icon(
                        Icons.stars,
                        size: 64,
                        color: isEarned
                            ? colorScheme.primary
                            : colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                      ),
              ),
            ),
            const SizedBox(height: 16),

            // Badge name
            Text(
              badge.name,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),

            // Earned / locked status chip
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isEarned
                    ? AppColors.success.withOpacity(0.1)
                    : colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isEarned ? AppColors.success : colorScheme.outlineVariant,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isEarned ? Icons.check_circle : Icons.lock,
                    size: 16,
                    color: isEarned
                        ? AppColors.success
                        : colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    isEarned ? 'Obtenida' : 'Bloqueada',
                    style: TextStyle(
                      color: isEarned
                          ? AppColors.success
                          : colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Description / criteria
            Text(
              badge.criteriaDescription,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),

            // Earn rate
            Text(
              badge.earnRateLabel,
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                fontStyle: FontStyle.italic,
              ),
              textAlign: TextAlign.center,
            ),

            // Earned date
            if (isEarned && badge.earnedAt != null) ...[
              const SizedBox(height: 8),
              Text(
                'Obtenida el ${_formatDate(badge.earnedAt!)}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: AppColors.success,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            const SizedBox(height: 24),

            // Close button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: colorScheme.onPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Cerrar'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year;
    return '$day/$month/$year';
  }
}
