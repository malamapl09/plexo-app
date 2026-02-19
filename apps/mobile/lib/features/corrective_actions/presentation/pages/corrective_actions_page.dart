import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/features/corrective_actions/data/models/corrective_action_model.dart';
import 'package:plexo_ops/features/corrective_actions/presentation/pages/corrective_action_detail_page.dart';
import 'package:plexo_ops/features/corrective_actions/presentation/providers/corrective_actions_provider.dart';
import 'package:plexo_ops/features/corrective_actions/presentation/widgets/capa_card.dart';

class CorrectiveActionsPage extends ConsumerStatefulWidget {
  const CorrectiveActionsPage({super.key});

  @override
  ConsumerState<CorrectiveActionsPage> createState() =>
      _CorrectiveActionsPageState();
}

class _CorrectiveActionsPageState extends ConsumerState<CorrectiveActionsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(correctiveActionsProvider.notifier).loadMyActions();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadActions() {
    ref.read(correctiveActionsProvider.notifier).loadMyActions();
  }

  void _openDetail(CorrectiveActionModel action) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CorrectiveActionDetailPage(actionId: action.id),
      ),
    ).then((_) {
      // Reload on return in case the user updated the action.
      _loadActions();
    });
  }

  @override
  Widget build(BuildContext context) {
    final capaState = ref.watch(correctiveActionsProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        Material(
          color: colorScheme.primary,
          child: TabBar(
            controller: _tabController,
            isScrollable: true,
            indicatorColor: colorScheme.onPrimary,
            labelColor: colorScheme.onPrimary,
            unselectedLabelColor: colorScheme.onPrimary.withValues(alpha: 0.6),
            tabs: [
              Tab(text: 'Todas (${capaState.totalCount})'),
              Tab(text: 'Pendientes (${capaState.pendingCount})'),
              Tab(text: 'En Progreso (${capaState.inProgressCount})'),
              Tab(text: 'Vencidas (${capaState.overdueCount})'),
            ],
          ),
        ),
        Expanded(
          child: capaState.isLoading && capaState.myActions.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : capaState.error != null && capaState.myActions.isEmpty
                  ? _buildErrorState(capaState.error!, colorScheme)
                  : Column(
                      children: [
                        // Error banner (non-blocking if data already loaded)
                        if (capaState.error != null &&
                            capaState.myActions.isNotEmpty)
                          _buildErrorBanner(capaState.error!, colorScheme),

                        Expanded(
                          child: TabBarView(
                            controller: _tabController,
                            children: [
                              _buildActionsList(
                                  capaState.myActions, colorScheme),
                              _buildActionsList(
                                  capaState.pendingActions, colorScheme),
                              _buildActionsList(
                                  capaState.inProgressActions, colorScheme),
                              _buildActionsList(
                                  capaState.overdueActions, colorScheme),
                            ],
                          ),
                        ),
                      ],
                    ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Sub-widgets
  // ---------------------------------------------------------------------------

  Widget _buildActionsList(
      List<CorrectiveActionModel> actions, ColorScheme colorScheme) {
    if (actions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.check_circle_outline,
              size: 64,
              color: colorScheme.primary.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              'No hay acciones en esta categoria',
              style: TextStyle(
                fontSize: 16,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Las acciones correctivas aparecen cuando se te asignan',
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => _loadActions(),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
        itemCount: actions.length,
        itemBuilder: (context, index) {
          final action = actions[index];
          return CapaCard(
            action: action,
            onTap: () => _openDetail(action),
          );
        },
      ),
    );
  }

  Widget _buildErrorState(String message, ColorScheme colorScheme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 48,
              color: colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: TextStyle(color: colorScheme.error),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadActions,
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorBanner(String message, ColorScheme colorScheme) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: colorScheme.error.withValues(alpha: 0.1),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: colorScheme.error, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: colorScheme.error, fontSize: 13),
            ),
          ),
          IconButton(
            icon: Icon(Icons.close, size: 16, color: colorScheme.error),
            constraints: const BoxConstraints(),
            padding: EdgeInsets.zero,
            onPressed: () =>
                ref.read(correctiveActionsProvider.notifier).clearError(),
          ),
        ],
      ),
    );
  }
}
