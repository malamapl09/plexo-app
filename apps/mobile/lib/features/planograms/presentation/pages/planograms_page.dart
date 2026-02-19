import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plexo_ops/features/planograms/presentation/providers/planograms_provider.dart';
import 'package:plexo_ops/features/planograms/presentation/widgets/planogram_card.dart';

class PlanogramsPage extends ConsumerStatefulWidget {
  const PlanogramsPage({super.key});

  @override
  ConsumerState<PlanogramsPage> createState() => _PlanogramsPageState();
}

class _PlanogramsPageState extends ConsumerState<PlanogramsPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final notifier = ref.read(planogramsProvider.notifier);
    await Future.wait([
      notifier.loadPendingPlanograms(),
      notifier.loadMySubmissions(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(planogramsProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        Material(
          color: colorScheme.primary,
          child: TabBar(
            controller: _tabController,
            indicatorColor: colorScheme.onPrimary,
            labelColor: colorScheme.onPrimary,
            unselectedLabelColor: colorScheme.onPrimary.withValues(alpha: 0.6),
            tabs: [
              Tab(
                text: 'Pendientes',
                icon: state.totalPending > 0
                    ? Badge(
                        label: Text('${state.totalPending}'),
                        child: const Icon(Icons.pending_actions),
                      )
                    : const Icon(Icons.pending_actions),
              ),
              Tab(
                text: 'Mis Envios',
                icon: state.mySubmissions.isNotEmpty
                    ? Badge(
                        label: Text('${state.mySubmissions.length}'),
                        child: const Icon(Icons.send),
                      )
                    : const Icon(Icons.send),
              ),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              // Tab 1: Pendientes
              _PendingTab(
                state: state,
                onRefresh: _loadData,
              ),
              // Tab 2: Mis Envios
              _SubmissionsTab(
                state: state,
                onRefresh: _loadData,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ==================== Pending Tab ====================

class _PendingTab extends StatelessWidget {
  final PlanogramsState state;
  final Future<void> Function() onRefresh;

  const _PendingTab({
    required this.state,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: state.isLoading && state.pendingTemplates.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.error != null && state.pendingTemplates.isEmpty
              ? _buildErrorState(theme, colorScheme)
              : state.pendingTemplates.isEmpty
                  ? _buildEmptyState(theme, colorScheme)
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.pendingTemplates.length,
                      itemBuilder: (context, index) {
                        final template = state.pendingTemplates[index];
                        return PlanogramCard(
                          planogram: template,
                          onTap: () {
                            context.push(
                              '/planograms/submit/${template.id}',
                              extra: template,
                            );
                          },
                        );
                      },
                    ),
    );
  }

  Widget _buildErrorState(ThemeData theme, ColorScheme colorScheme) {
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
              state.error!,
              style: TextStyle(color: colorScheme.error),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRefresh,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme, ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 64,
            color: const Color(0xFF22C55E).withValues(alpha: 0.6),
          ),
          const SizedBox(height: 16),
          Text(
            'No hay planogramas pendientes',
            style: theme.textTheme.titleMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Todos los planogramas estan al dia',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== Submissions Tab ====================

class _SubmissionsTab extends StatelessWidget {
  final PlanogramsState state;
  final Future<void> Function() onRefresh;

  const _SubmissionsTab({
    required this.state,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: state.isLoading && state.mySubmissions.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.error != null && state.mySubmissions.isEmpty
              ? _buildErrorState(theme, colorScheme)
              : state.mySubmissions.isEmpty
                  ? _buildEmptyState(theme, colorScheme)
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.mySubmissions.length,
                      itemBuilder: (context, index) {
                        final submission = state.mySubmissions[index];
                        return _SubmissionCard(
                          submission: submission,
                          onTap: () {
                            context.push(
                              '/planograms/detail/${submission.id}',
                              extra: submission,
                            );
                          },
                        );
                      },
                    ),
    );
  }

  Widget _buildErrorState(ThemeData theme, ColorScheme colorScheme) {
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
              state.error!,
              style: TextStyle(color: colorScheme.error),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRefresh,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme, ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.inbox_outlined,
            size: 64,
            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
          ),
          const SizedBox(height: 16),
          Text(
            'No has enviado planogramas',
            style: theme.textTheme.titleMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tus envios apareceran aqui',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== Submission Card (for Mis Envios tab) ====================

class _SubmissionCard extends StatelessWidget {
  final dynamic submission;
  final VoidCallback onTap;

  const _SubmissionCard({
    required this.submission,
    required this.onTap,
  });

  Color _statusColor(String status) {
    switch (status) {
      case 'PENDING_REVIEW':
        return Colors.amber.shade700;
      case 'APPROVED':
        return const Color(0xFF22C55E); // success
      case 'NEEDS_REVISION':
        return const Color(0xFFEF4444); // error
      case 'RESUBMITTED':
        return const Color(0xFF3B82F6); // info
      default:
        return Colors.grey;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'PENDING_REVIEW':
        return Icons.hourglass_top;
      case 'APPROVED':
        return Icons.check_circle;
      case 'NEEDS_REVISION':
        return Icons.error;
      case 'RESUBMITTED':
        return Icons.replay;
      default:
        return Icons.help_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final color = _statusColor(submission.status);
    final templateName =
        submission.template?.name ?? 'Planograma';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: submission.needsRevision
            ? BorderSide(color: colorScheme.error, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Photo thumbnail
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: colorScheme.outlineVariant,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: submission.photoUrls.isNotEmpty
                      ? Image.network(
                          submission.photoUrls.first,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: colorScheme.surfaceContainerHighest,
                              child: Icon(
                                Icons.image_not_supported,
                                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                              ),
                            );
                          },
                        )
                      : Container(
                          color: colorScheme.surfaceContainerHighest,
                          child: Icon(
                            Icons.grid_view,
                            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 12),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      templateName,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Enviado: ${_formatDate(submission.submittedAt)}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 6),
                    // Status badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: color),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _statusIcon(submission.status),
                            size: 14,
                            color: color,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            submission.statusLabel,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: color,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Arrow
              Icon(
                Icons.chevron_right,
                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
              ),
            ],
          ),
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
