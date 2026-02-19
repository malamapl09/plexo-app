import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/features/store_audits/data/models/audit_template_model.dart';
import 'package:plexo_ops/features/store_audits/data/models/store_audit_model.dart';
import 'package:plexo_ops/features/store_audits/presentation/providers/store_audits_provider.dart';
import 'package:plexo_ops/features/store_audits/presentation/widgets/score_gauge.dart';
import 'package:plexo_ops/features/store_audits/presentation/widgets/finding_card.dart';

/// Summary page displayed after an audit is completed. Shows the overall
/// score gauge, per-section score breakdown, and a list of findings.
class AuditSummaryPage extends ConsumerStatefulWidget {
  final String auditId;

  const AuditSummaryPage({
    super.key,
    required this.auditId,
  });

  @override
  ConsumerState<AuditSummaryPage> createState() => _AuditSummaryPageState();
}

class _AuditSummaryPageState extends ConsumerState<AuditSummaryPage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      final notifier = ref.read(storeAuditsProvider.notifier);
      await notifier.loadAuditDetail(widget.auditId);
      final audit = ref.read(storeAuditsProvider).currentAudit;
      if (audit != null) {
        await notifier.loadTemplate(audit.templateId);
      }
    });
  }

  @override
  void dispose() {
    ref.read(storeAuditsProvider.notifier).clearCurrentAudit();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(storeAuditsProvider);
    final audit = state.currentAudit;
    final template = state.currentTemplate;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Resumen de Auditoria',
          style: TextStyle(fontSize: 18),
        ),
      ),
      body: _buildBody(state, audit, template, theme),
    );
  }

  Widget _buildBody(
    StoreAuditsState state,
    StoreAudit? audit,
    AuditTemplate? template,
    ThemeData theme,
  ) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                state.error!,
                style: const TextStyle(color: Colors.red),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  ref
                      .read(storeAuditsProvider.notifier)
                      .loadAuditDetail(widget.auditId);
                },
                child: const Text('Reintentar'),
              ),
            ],
          ),
        ),
      );
    }

    if (audit == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Score hero section
          _buildScoreHero(theme, audit),

          const SizedBox(height: 24),

          // Audit info card
          _buildInfoCard(theme, audit),

          const SizedBox(height: 24),

          // Section breakdown
          if (template != null) ...[
            Text(
              'Desglose por Seccion',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...template.sections.map((section) {
              return _buildSectionScoreCard(theme, section, state);
            }),
          ],

          const SizedBox(height: 24),

          // Findings
          if (audit.findings.isNotEmpty) ...[
            Row(
              children: [
                Text(
                  'Hallazgos',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${audit.findings.length}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.orange.shade700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...audit.findings.map((finding) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 0),
                child: FindingCard(finding: finding),
              );
            }),
          ],

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  // -----------------------------------------------------------------------
  // Score hero
  // -----------------------------------------------------------------------

  Widget _buildScoreHero(ThemeData theme, StoreAudit audit) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primaryContainer.withOpacity(0.3),
            theme.colorScheme.primaryContainer.withOpacity(0.1),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.primary.withOpacity(0.15),
        ),
      ),
      child: Column(
        children: [
          ScoreGauge(
            score: audit.overallScore ?? 0,
            size: 140,
            strokeWidth: 12,
            label: 'Puntuacion General',
          ),
          const SizedBox(height: 16),
          if (audit.actualScore != null && audit.maxPossibleScore != null)
            Text(
              '${audit.actualScore} de ${audit.maxPossibleScore} puntos',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: theme.textTheme.bodyMedium?.color?.withOpacity(0.7),
              ),
            ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              audit.statusLabel,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.green,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // -----------------------------------------------------------------------
  // Info card
  // -----------------------------------------------------------------------

  Widget _buildInfoCard(ThemeData theme, StoreAudit audit) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _infoRow(
              theme,
              icon: Icons.store_outlined,
              label: 'Tienda',
              value: audit.storeName,
            ),
            _infoRow(
              theme,
              icon: Icons.person_outline,
              label: 'Auditor',
              value: audit.auditorName,
            ),
            _infoRow(
              theme,
              icon: Icons.calendar_today_outlined,
              label: 'Fecha programada',
              value: _formatDate(audit.scheduledDate),
            ),
            if (audit.completedAt != null)
              _infoRow(
                theme,
                icon: Icons.check_circle_outline,
                label: 'Completada',
                value: _formatDateTime(audit.completedAt!),
              ),
            _infoRow(
              theme,
              icon: Icons.flag_outlined,
              label: 'Hallazgos',
              value: '${audit.findings.length}',
              isLast: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(
    ThemeData theme, {
    required IconData icon,
    required String label,
    required String value,
    bool isLast = false,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
      child: Row(
        children: [
          Icon(icon,
              size: 20,
              color: theme.iconTheme.color?.withOpacity(0.6)),
          const SizedBox(width: 12),
          Text(
            '$label: ',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.textTheme.bodyMedium?.color?.withOpacity(0.6),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  // -----------------------------------------------------------------------
  // Section score card
  // -----------------------------------------------------------------------

  Widget _buildSectionScoreCard(
    ThemeData theme,
    AuditSection section,
    StoreAuditsState state,
  ) {
    // Calculate section score from the answers map.
    int sectionActual = 0;
    int sectionMax = 0;

    for (final question in section.questions) {
      sectionMax += question.maxScore;
      final answer = state.answers[question.id];
      if (answer != null) {
        if (question.questionType == QuestionType.score &&
            answer.score != null) {
          sectionActual += answer.score!.clamp(0, question.maxScore);
        } else if (question.questionType == QuestionType.yesNo &&
            answer.booleanValue != null) {
          sectionActual += answer.booleanValue! ? question.maxScore : 0;
        }
        // TEXT questions do not contribute to score.
      }
    }

    final percentage = sectionMax > 0 ? (sectionActual / sectionMax) * 100 : 0.0;
    final barColor = _scoreColor(percentage);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    section.title,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Text(
                  '${percentage.toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: barColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '$sectionActual / $sectionMax pts  |  Peso: ${section.weight.toStringAsFixed(1)}x',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.textTheme.bodySmall?.color?.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: sectionMax > 0 ? sectionActual / sectionMax : 0,
                minHeight: 8,
                backgroundColor: theme.dividerColor.withOpacity(0.2),
                color: barColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

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

  String _formatDateTime(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year} '
        '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
