import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/checklists/data/models/checklist_model.dart';
import 'package:plexo_ops/features/checklists/presentation/providers/checklists_provider.dart';
import 'package:plexo_ops/features/checklists/presentation/widgets/checklist_card.dart';
import 'package:plexo_ops/features/checklists/presentation/pages/checklist_detail_page.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

class ChecklistsPage extends ConsumerStatefulWidget {
  const ChecklistsPage({super.key});

  @override
  ConsumerState<ChecklistsPage> createState() => _ChecklistsPageState();
}

class _ChecklistsPageState extends ConsumerState<ChecklistsPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final storeId = ref.read(authStateProvider).user?.storeId;
      if (storeId != null) {
        ref.read(checklistsProvider.notifier).loadStoreChecklists(storeId);
      }
    });
  }

  void _openChecklist(BuildContext context, ChecklistTemplate template) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChecklistDetailPage(template: template),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final checklistsState = ref.watch(checklistsProvider);
    final storeId = ref.watch(authStateProvider).user?.storeId;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          if (storeId != null) {
            await ref
                .read(checklistsProvider.notifier)
                .loadStoreChecklists(storeId);
          }
        },
        child: CustomScrollView(
          slivers: [
            // Progress summary header
            SliverToBoxAdapter(
              child: _ChecklistsProgressHeader(
                total: checklistsState.totalChecklists,
                completed: checklistsState.completedToday,
                pending: checklistsState.pendingToday,
                isLoading: checklistsState.isLoading,
              ),
            ),

            // Error message
            if (checklistsState.error != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline,
                            color: AppColors.error),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            checklistsState.error!,
                            style: const TextStyle(color: AppColors.error),
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            if (storeId != null) {
                              ref.read(checklistsProvider.notifier).loadStoreChecklists(storeId);
                            }
                          },
                          child: const Text('Reintentar'),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close,
                              size: 18, color: AppColors.error),
                          onPressed: () => ref
                              .read(checklistsProvider.notifier)
                              .clearError(),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Loading state
            if (checklistsState.isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            // Empty state
            else if (checklistsState.templates.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.playlist_add_check,
                        size: 64,
                        color: Theme.of(context)
                            .iconTheme
                            .color
                            ?.withOpacity(0.5),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No hay checklists asignados',
                        style: TextStyle(
                          fontSize: 16,
                          color: Theme.of(context)
                              .textTheme
                              .bodyMedium
                              ?.color
                              ?.withOpacity(0.7),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Los checklists aparecen cuando son asignados a tu tienda',
                        style: TextStyle(
                          fontSize: 14,
                          color: Theme.of(context)
                              .textTheme
                              .bodySmall
                              ?.color
                              ?.withOpacity(0.5),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              )
            // Checklist cards
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final template = checklistsState.templates[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: ChecklistCard(
                          template: template,
                          onTap: () => _openChecklist(context, template),
                        ),
                      );
                    },
                    childCount: checklistsState.templates.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Header widget that shows overall progress for today's checklists.
class _ChecklistsProgressHeader extends StatelessWidget {
  final int total;
  final int completed;
  final int pending;
  final bool isLoading;

  const _ChecklistsProgressHeader({
    required this.total,
    required this.completed,
    required this.pending,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final completionRate =
        total > 0 ? (completed / total * 100).roundToDouble() : 0.0;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
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
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: isLoading
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              ),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Checklists de Hoy',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${completionRate.toInt()}%',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Progress bar
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: total > 0 ? completed / total : 0,
                    minHeight: 8,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    valueColor:
                        const AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
                const SizedBox(height: 16),

                // Stats row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _StatItem(
                      value: total.toString(),
                      label: 'Total',
                      icon: Icons.list_alt,
                    ),
                    _StatItem(
                      value: completed.toString(),
                      label: 'Completados',
                      icon: Icons.check_circle_outline,
                    ),
                    _StatItem(
                      value: pending.toString(),
                      label: 'Pendientes',
                      icon: Icons.pending_outlined,
                    ),
                  ],
                ),
              ],
            ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;

  const _StatItem({
    required this.value,
    required this.label,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: Colors.white.withOpacity(0.8), size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withOpacity(0.8),
          ),
        ),
      ],
    );
  }
}
