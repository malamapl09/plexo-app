import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/features/store_audits/data/models/store_audit_model.dart';
import 'package:plexo_ops/features/store_audits/presentation/providers/store_audits_provider.dart';
import 'package:plexo_ops/features/store_audits/presentation/pages/audit_conduct_page.dart';
import 'package:plexo_ops/features/store_audits/presentation/pages/audit_summary_page.dart';

/// Main listing page showing all scheduled, in-progress, and completed audits
/// assigned to the current user. Accessed from the bottom nav or profile menu.
class AuditsPage extends ConsumerStatefulWidget {
  const AuditsPage({super.key});

  @override
  ConsumerState<AuditsPage> createState() => _AuditsPageState();
}

class _AuditsPageState extends ConsumerState<AuditsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    Future.microtask(() {
      ref.read(storeAuditsProvider.notifier).loadAudits();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    await ref.read(storeAuditsProvider.notifier).loadAudits();
  }

  void _onAuditTap(StoreAudit audit) {
    if (audit.isCompleted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => AuditSummaryPage(auditId: audit.id),
        ),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => AuditConductPage(auditId: audit.id),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(storeAuditsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      body: Column(
        children: [
          // Tab bar
          Material(
            color: theme.colorScheme.surface,
            child: TabBar(
              controller: _tabController,
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.pending_actions, size: 18),
                      const SizedBox(width: 6),
                      const Text('Pendientes'),
                      if (state.pendingAudits.isNotEmpty) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${state.pendingAudits.length}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.check_circle_outline, size: 18),
                      const SizedBox(width: 6),
                      const Text('Completadas'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Content
          Expanded(
            child: state.isLoading
                ? const Center(child: CircularProgressIndicator())
                : state.error != null
                    ? _buildErrorState(state.error!)
                    : TabBarView(
                        controller: _tabController,
                        children: [
                          _buildAuditsList(state.pendingAudits, isEmpty: false),
                          _buildAuditsList(state.completedAudits,
                              isEmpty: false),
                        ],
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              error,
              style: const TextStyle(color: Colors.red),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _onRefresh,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAuditsList(List<StoreAudit> audits, {required bool isEmpty}) {
    if (audits.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.assignment_outlined,
              size: 64,
              color: Theme.of(context).iconTheme.color?.withOpacity(0.4),
            ),
            const SizedBox(height: 16),
            Text(
              'No hay auditorias',
              style: TextStyle(
                fontSize: 16,
                color: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.color
                    ?.withOpacity(0.6),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 8, bottom: 100),
        itemCount: audits.length,
        itemBuilder: (context, index) {
          return _AuditCard(
            audit: audits[index],
            onTap: () => _onAuditTap(audits[index]),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Audit Card
// ---------------------------------------------------------------------------

class _AuditCard extends StatelessWidget {
  final StoreAudit audit;
  final VoidCallback onTap;

  const _AuditCard({
    required this.audit,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row: icon + template name
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color:
                          _statusColor(audit.status).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      _statusIcon(audit.status),
                      color: _statusColor(audit.status),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          audit.storeName,
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Auditor: ${audit.auditorName}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.textTheme.bodySmall?.color
                                ?.withOpacity(0.7),
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Score badge for completed audits
                  if (audit.isCompleted && audit.overallScore != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: _scoreColor(audit.overallScore!)
                            .withOpacity(0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        audit.scoreDisplay,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: _scoreColor(audit.overallScore!),
                        ),
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 12),

              // Bottom row: status chip, date, findings count
              Row(
                children: [
                  _buildStatusChip(context, audit),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.calendar_today,
                    size: 14,
                    color: theme.textTheme.bodySmall?.color,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(audit.scheduledDate),
                    style: theme.textTheme.bodySmall,
                  ),
                  const Spacer(),
                  if (audit.findings.isNotEmpty) ...[
                    Icon(
                      Icons.flag_outlined,
                      size: 14,
                      color: theme.brightness == Brightness.dark
                          ? Colors.orange.shade300
                          : Colors.orange.shade700,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${audit.findings.length} hallazgo${audit.findings.length != 1 ? 's' : ''}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.brightness == Brightness.dark
                            ? Colors.orange.shade300
                            : Colors.orange.shade700,
                      ),
                    ),
                  ],
                ],
              ),

              // Actual/max score if completed
              if (audit.isCompleted &&
                  audit.actualScore != null &&
                  audit.maxPossibleScore != null) ...[
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: audit.maxPossibleScore! > 0
                        ? audit.actualScore! / audit.maxPossibleScore!
                        : 0,
                    minHeight: 6,
                    backgroundColor: theme.dividerColor.withOpacity(0.2),
                    color: _scoreColor(audit.overallScore ?? 0),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${audit.actualScore} / ${audit.maxPossibleScore} puntos',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.textTheme.bodySmall?.color?.withOpacity(0.6),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(BuildContext context, StoreAudit audit) {
    final color = _statusColor(audit.status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        audit.statusLabel,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Color _statusColor(AuditStatus status) {
    switch (status) {
      case AuditStatus.scheduled:
        return Colors.blue;
      case AuditStatus.inProgress:
        return Colors.orange;
      case AuditStatus.completed:
        return Colors.green;
    }
  }

  IconData _statusIcon(AuditStatus status) {
    switch (status) {
      case AuditStatus.scheduled:
        return Icons.event_outlined;
      case AuditStatus.inProgress:
        return Icons.play_circle_outline;
      case AuditStatus.completed:
        return Icons.check_circle_outline;
    }
  }

  Color _scoreColor(double score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.amber.shade700;
    if (score >= 40) return Colors.orange;
    return Colors.red;
  }

  String _formatDate(String dateStr) {
    try {
      final parts = dateStr.split('-');
      if (parts.length == 3) {
        return '${parts[2]}/${parts[1]}/${parts[0]}';
      }
      return dateStr;
    } catch (_) {
      return dateStr;
    }
  }
}
