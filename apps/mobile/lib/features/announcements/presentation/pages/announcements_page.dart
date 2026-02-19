import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/features/announcements/data/models/announcement_model.dart';
import 'package:plexo_ops/features/announcements/presentation/providers/announcements_provider.dart';
import 'package:plexo_ops/features/announcements/presentation/widgets/announcement_card.dart';
import 'package:plexo_ops/features/announcements/presentation/pages/announcement_detail_page.dart';

class AnnouncementsPage extends ConsumerStatefulWidget {
  const AnnouncementsPage({super.key});

  @override
  ConsumerState<AnnouncementsPage> createState() => _AnnouncementsPageState();
}

class _AnnouncementsPageState extends ConsumerState<AnnouncementsPage> {
  @override
  void initState() {
    super.initState();
    // Load announcements on init
    Future.microtask(() {
      ref.read(announcementsProvider.notifier).loadAnnouncements();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(announcementsProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Comunicaciones'),
        actions: [
          // Filter button
          PopupMenuButton<AnnouncementType?>(
            icon: Badge(
              isLabelVisible: state.typeFilter != null,
              child: const Icon(Icons.filter_list),
            ),
            tooltip: 'Filtrar por tipo',
            onSelected: (type) {
              ref.read(announcementsProvider.notifier).setTypeFilter(type);
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: null,
                child: Text('Todos los tipos'),
              ),
              const PopupMenuDivider(),
              ...AnnouncementType.values.map(
                (type) => PopupMenuItem(
                  value: type,
                  child: Row(
                    children: [
                      Icon(
                        _getTypeIcon(type),
                        size: 18,
                        color: state.typeFilter == type
                            ? colorScheme.primary
                            : colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 8),
                      Text(_getTypeLabel(type)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(announcementsProvider.notifier).refreshAnnouncements();
        },
        child: state.isLoading && state.announcements.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : state.error != null && state.announcements.isEmpty
                ? _buildErrorState(state.error!)
                : _buildContent(state),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).iconTheme.color?.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Theme.of(context).textTheme.bodyMedium?.color,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                ref.read(announcementsProvider.notifier).loadAnnouncements();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(AnnouncementsState state) {
    final announcements = state.filteredAnnouncements;
    final colorScheme = Theme.of(context).colorScheme;

    if (announcements.isEmpty) {
      return _buildEmptyState(state.typeFilter != null || state.showUnreadOnly);
    }

    return CustomScrollView(
      slivers: [
        // Stats header
        if (state.stats != null)
          SliverToBoxAdapter(
            child: _buildStatsHeader(state.stats!),
          ),

        // Unread filter toggle
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Text(
                  '${announcements.length} ${announcements.length == 1 ? 'anuncio' : 'anuncios'}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Theme.of(context).textTheme.bodyMedium?.color?.withValues(alpha: 0.7),
                  ),
                ),
                const Spacer(),
                FilterChip(
                  label: const Text('Solo no leidos'),
                  selected: state.showUnreadOnly,
                  onSelected: (selected) {
                    ref
                        .read(announcementsProvider.notifier)
                        .setShowUnreadOnly(selected);
                  },
                  selectedColor: colorScheme.primary.withValues(alpha: 0.2),
                ),
              ],
            ),
          ),
        ),

        // Announcements list
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final announcement = announcements[index];
              return AnnouncementCard(
                announcement: announcement,
                onTap: () => _openAnnouncementDetail(announcement),
              );
            },
            childCount: announcements.length,
          ),
        ),

        // Bottom padding
        const SliverToBoxAdapter(
          child: SizedBox(height: 16),
        ),
      ],
    );
  }

  Widget _buildStatsHeader(AnnouncementStats stats) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainer,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: Theme.of(context).brightness == Brightness.dark ? 0.3 : 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          _buildStatItem(
            icon: Icons.campaign,
            label: 'Total',
            value: stats.total.toString(),
            color: Colors.blue,
          ),
          _buildStatDivider(),
          _buildStatItem(
            icon: Icons.mark_email_unread,
            label: 'Sin leer',
            value: stats.unread.toString(),
            color: colorScheme.primary,
          ),
          _buildStatDivider(),
          _buildStatItem(
            icon: Icons.pending_actions,
            label: 'Pendientes',
            value: stats.unacknowledged.toString(),
            color: Colors.orange,
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Theme.of(context).textTheme.bodySmall?.color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatDivider() {
    return Container(
      height: 40,
      width: 1,
      color: Theme.of(context).dividerColor,
    );
  }

  Widget _buildEmptyState(bool hasFilters) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              hasFilters ? Icons.filter_alt_off : Icons.campaign_outlined,
              size: 64,
              color: Theme.of(context).iconTheme.color?.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              hasFilters
                  ? 'No hay anuncios con los filtros seleccionados'
                  : 'No hay anuncios',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: Theme.of(context).textTheme.bodyLarge?.color,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              hasFilters
                  ? 'Intente con otros filtros'
                  : 'Los anuncios apareceran aqui',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).textTheme.bodySmall?.color,
              ),
            ),
            if (hasFilters) ...[
              const SizedBox(height: 24),
              TextButton.icon(
                onPressed: () {
                  ref.read(announcementsProvider.notifier).clearFilters();
                },
                icon: const Icon(Icons.clear_all),
                label: const Text('Limpiar filtros'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _openAnnouncementDetail(AnnouncementModel announcement) {
    // Mark as viewed when opening
    ref.read(announcementsProvider.notifier).markAsViewed(announcement.id);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AnnouncementDetailPage(
          announcement: announcement,
        ),
      ),
    );
  }

  IconData _getTypeIcon(AnnouncementType type) {
    switch (type) {
      case AnnouncementType.emergency:
        return Icons.warning;
      case AnnouncementType.systemAlert:
        return Icons.notifications_active;
      case AnnouncementType.operationalUpdate:
        return Icons.update;
      case AnnouncementType.policyUpdate:
        return Icons.policy;
      case AnnouncementType.training:
        return Icons.school;
      case AnnouncementType.general:
        return Icons.info;
    }
  }

  String _getTypeLabel(AnnouncementType type) {
    switch (type) {
      case AnnouncementType.emergency:
        return 'Emergencia';
      case AnnouncementType.systemAlert:
        return 'Alerta del Sistema';
      case AnnouncementType.operationalUpdate:
        return 'Actualizacion Operativa';
      case AnnouncementType.policyUpdate:
        return 'Actualizacion de Politica';
      case AnnouncementType.training:
        return 'Capacitacion';
      case AnnouncementType.general:
        return 'General';
    }
  }
}
