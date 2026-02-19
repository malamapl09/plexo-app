import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/features/store_audits/data/models/audit_template_model.dart';
import 'package:plexo_ops/features/store_audits/data/models/store_audit_model.dart';
import 'package:plexo_ops/features/store_audits/presentation/providers/store_audits_provider.dart';
import 'package:plexo_ops/features/store_audits/presentation/widgets/question_widget.dart';
import 'package:plexo_ops/features/store_audits/presentation/pages/audit_summary_page.dart';

/// Full-screen page for conducting a store audit section by section.
///
/// Uses a [PageView] to navigate through sections. Each section lists its
/// questions with appropriate input widgets. The auditor can also report
/// findings from this screen.
class AuditConductPage extends ConsumerStatefulWidget {
  final String auditId;

  const AuditConductPage({
    super.key,
    required this.auditId,
  });

  @override
  ConsumerState<AuditConductPage> createState() => _AuditConductPageState();
}

class _AuditConductPageState extends ConsumerState<AuditConductPage> {
  late PageController _pageController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    Future.microtask(() async {
      final notifier = ref.read(storeAuditsProvider.notifier);
      await notifier.loadAuditDetail(widget.auditId);

      // After loading the audit, load its template for section/question data.
      final audit = ref.read(storeAuditsProvider).currentAudit;
      if (audit != null) {
        await notifier.loadTemplate(audit.templateId);

        // If the audit is still SCHEDULED, start it automatically.
        if (audit.isScheduled) {
          await notifier.startAudit(widget.auditId);
        }
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    ref.read(storeAuditsProvider.notifier).clearCurrentAudit();
    super.dispose();
  }

  void _goToNextSection(int totalSections) {
    if (_currentPage < totalSections - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _completeAudit() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Completar Auditoria'),
        content: const Text(
          'Se calculara el puntaje final y no se podran modificar las respuestas. Desea continuar?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Completar'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final success = await ref
        .read(storeAuditsProvider.notifier)
        .completeAudit(widget.auditId);

    if (success && mounted) {
      // Navigate to summary replacing the conduct page.
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => AuditSummaryPage(auditId: widget.auditId),
        ),
      );
    } else if (mounted) {
      final error = ref.read(storeAuditsProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Error al completar auditoria'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showReportFindingSheet(String? sectionId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ReportFindingSheet(
        auditId: widget.auditId,
        sectionId: sectionId,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(storeAuditsProvider);
    final template = state.currentTemplate;
    final audit = state.currentAudit;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          audit != null ? audit.storeName : 'Auditoria',
          style: const TextStyle(fontSize: 18),
        ),
        actions: [
          // Finding report button
          if (audit != null && audit.isInProgress)
            IconButton(
              icon: const Icon(Icons.flag_outlined),
              tooltip: 'Reportar Hallazgo',
              onPressed: () {
                final sectionId = template != null &&
                        template.sections.isNotEmpty &&
                        _currentPage < template.sections.length
                    ? template.sections[_currentPage].id
                    : null;
                _showReportFindingSheet(sectionId);
              },
            ),
        ],
      ),
      body: _buildBody(state, template, audit, theme),
    );
  }

  Widget _buildBody(
    StoreAuditsState state,
    AuditTemplate? template,
    StoreAudit? audit,
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

    if (template == null || audit == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final sections = template.sections;
    if (sections.isEmpty) {
      return const Center(
        child: Text('Esta plantilla no tiene secciones.'),
      );
    }

    return Column(
      children: [
        // Progress indicator
        _buildProgressHeader(theme, template, state),

        // Section page view
        Expanded(
          child: PageView.builder(
            controller: _pageController,
            itemCount: sections.length,
            onPageChanged: (page) {
              setState(() => _currentPage = page);
            },
            itemBuilder: (context, sectionIndex) {
              final section = sections[sectionIndex];
              return _buildSectionPage(
                theme,
                section,
                sectionIndex,
                sections.length,
                state,
                audit,
              );
            },
          ),
        ),
      ],
    );
  }

  // -----------------------------------------------------------------------
  // Progress header
  // -----------------------------------------------------------------------

  Widget _buildProgressHeader(
    ThemeData theme,
    AuditTemplate template,
    StoreAuditsState state,
  ) {
    final totalQuestions = template.totalQuestions;
    final answeredCount = state.answers.length;
    final progress =
        totalQuestions > 0 ? answeredCount / totalQuestions : 0.0;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Seccion ${_currentPage + 1} de ${template.sections.length}',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.primary,
                ),
              ),
              const Spacer(),
              Text(
                '$answeredCount / $totalQuestions preguntas',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.textTheme.bodySmall?.color?.withOpacity(0.7),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: theme.dividerColor.withOpacity(0.2),
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 6),
          // Section dots
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(template.sections.length, (index) {
              final isActive = index == _currentPage;
              // Check if all questions in this section are answered
              final sectionQuestions = template.sections[index].questions;
              final allAnswered = sectionQuestions.isNotEmpty &&
                  sectionQuestions
                      .every((q) => state.answers.containsKey(q.id));

              return Container(
                width: isActive ? 24 : 8,
                height: 8,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: allAnswered
                      ? Colors.green
                      : isActive
                          ? theme.colorScheme.primary
                          : theme.dividerColor,
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  // -----------------------------------------------------------------------
  // Section page
  // -----------------------------------------------------------------------

  Widget _buildSectionPage(
    ThemeData theme,
    AuditSection section,
    int sectionIndex,
    int totalSections,
    StoreAuditsState state,
    StoreAudit audit,
  ) {
    final isLastSection = sectionIndex == totalSections - 1;

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Section header
                Text(
                  section.title,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (section.description != null &&
                    section.description!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    section.description!,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.textTheme.bodyMedium?.color
                          ?.withOpacity(0.7),
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.scale, size: 14, color: theme.hintColor),
                    const SizedBox(width: 4),
                    Text(
                      'Peso: ${section.weight.toStringAsFixed(1)}x',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.hintColor,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(Icons.help_outline, size: 14, color: theme.hintColor),
                    const SizedBox(width: 4),
                    Text(
                      '${section.questions.length} preguntas',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.hintColor,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 8),

                // Questions
                ...section.questions.asMap().entries.map((entry) {
                  final qIndex = entry.key;
                  final question = entry.value;
                  final existingAnswer = state.answers[question.id];

                  return QuestionWidget(
                    question: question,
                    existingAnswer: existingAnswer,
                    questionIndex: qIndex,
                    onAnswerSubmitted: ({
                      required String questionId,
                      int? score,
                      bool? booleanValue,
                      String? textValue,
                      List<String>? photoUrls,
                      String? notes,
                    }) async {
                      final success = await ref
                          .read(storeAuditsProvider.notifier)
                          .submitAnswer(
                            auditId: widget.auditId,
                            questionId: questionId,
                            score: score,
                            booleanValue: booleanValue,
                            textValue: textValue,
                            photoUrls: photoUrls,
                            notes: notes,
                          );

                      if (success && mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Respuesta guardada'),
                            duration: Duration(seconds: 1),
                            backgroundColor: Colors.green,
                          ),
                        );
                      }
                    },
                  );
                }),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),

        // Bottom navigation bar
        _buildBottomBar(theme, isLastSection, totalSections, audit),
      ],
    );
  }

  // -----------------------------------------------------------------------
  // Bottom navigation bar
  // -----------------------------------------------------------------------

  Widget _buildBottomBar(
    ThemeData theme,
    bool isLastSection,
    int totalSections,
    StoreAudit audit,
  ) {
    final state = ref.watch(storeAuditsProvider);

    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        12,
        16,
        12 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Previous button
          if (_currentPage > 0)
            OutlinedButton.icon(
              onPressed: () {
                _pageController.previousPage(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                );
              },
              icon: const Icon(Icons.arrow_back, size: 18),
              label: const Text('Anterior'),
            )
          else
            const SizedBox.shrink(),

          const Spacer(),

          // Next / Complete button
          if (isLastSection)
            FilledButton.icon(
              onPressed:
                  state.isSubmitting ? null : _completeAudit,
              icon: state.isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.check_circle, size: 18),
              label: Text(
                state.isSubmitting ? 'Completando...' : 'Completar',
              ),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.green,
              ),
            )
          else
            FilledButton.icon(
              onPressed: () => _goToNextSection(totalSections),
              icon: const Icon(Icons.arrow_forward, size: 18),
              label: const Text('Siguiente Seccion'),
            ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Report Finding Sheet
// ---------------------------------------------------------------------------

class _ReportFindingSheet extends ConsumerStatefulWidget {
  final String auditId;
  final String? sectionId;

  const _ReportFindingSheet({
    required this.auditId,
    this.sectionId,
  });

  @override
  ConsumerState<_ReportFindingSheet> createState() =>
      _ReportFindingSheetState();
}

class _ReportFindingSheetState extends ConsumerState<_ReportFindingSheet> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  FindingSeverity _severity = FindingSeverity.medium;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _titleController.text.length >= 3 &&
      _descriptionController.text.length >= 5 &&
      !_isSubmitting;

  Future<void> _submit() async {
    if (!_canSubmit) return;

    setState(() => _isSubmitting = true);

    final success = await ref.read(storeAuditsProvider.notifier).reportFinding(
          auditId: widget.auditId,
          severity: AuditFinding.severityToString(_severity),
          title: _titleController.text.trim(),
          description: _descriptionController.text.trim(),
          sectionId: widget.sectionId,
        );

    if (mounted) {
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Hallazgo reportado'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al reportar hallazgo'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final theme = Theme.of(context);

    return Container(
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.8,
        minChildSize: 0.4,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) {
          return Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.grey[600] : Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Reportar Hallazgo',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (_isSubmitting)
                      const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    else
                      TextButton(
                        onPressed: _canSubmit ? _submit : null,
                        child: const Text(
                          'Enviar',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                  ],
                ),
              ),

              const Divider(height: 1),

              // Form
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Severity selector
                      const Text(
                        'Severidad',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildSeveritySelector(),

                      const SizedBox(height: 24),

                      // Title
                      const Text(
                        'Titulo',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _titleController,
                        decoration: const InputDecoration(
                          hintText: 'Ej: Extintor vencido',
                          border: OutlineInputBorder(),
                        ),
                        maxLength: 100,
                        onChanged: (_) => setState(() {}),
                      ),

                      const SizedBox(height: 16),

                      // Description
                      const Text(
                        'Descripcion',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _descriptionController,
                        decoration: const InputDecoration(
                          hintText: 'Describe el hallazgo con detalle...',
                          border: OutlineInputBorder(),
                          alignLabelWithHint: true,
                        ),
                        maxLines: 4,
                        maxLength: 1000,
                        onChanged: (_) => setState(() {}),
                      ),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSeveritySelector() {
    return Row(
      children: FindingSeverity.values.map((sev) {
        final isSelected = sev == _severity;
        final color = _severityColor(sev);
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              right: sev != FindingSeverity.critical ? 8 : 0,
            ),
            child: InkWell(
              onTap: () => setState(() => _severity = sev),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? color.withOpacity(0.15) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSelected ? color : Colors.grey.shade300,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      _severityIcon(sev),
                      color: isSelected ? color : Colors.grey.shade500,
                      size: 22,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _severityLabel(sev),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.w500,
                        color: isSelected ? color : Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Color _severityColor(FindingSeverity sev) {
    switch (sev) {
      case FindingSeverity.low:
        return Colors.grey;
      case FindingSeverity.medium:
        return Colors.amber.shade700;
      case FindingSeverity.high:
        return Colors.orange;
      case FindingSeverity.critical:
        return Colors.red;
    }
  }

  IconData _severityIcon(FindingSeverity sev) {
    switch (sev) {
      case FindingSeverity.low:
        return Icons.info_outline;
      case FindingSeverity.medium:
        return Icons.warning_amber_outlined;
      case FindingSeverity.high:
        return Icons.report_outlined;
      case FindingSeverity.critical:
        return Icons.dangerous_outlined;
    }
  }

  String _severityLabel(FindingSeverity sev) {
    switch (sev) {
      case FindingSeverity.low:
        return 'Baja';
      case FindingSeverity.medium:
        return 'Media';
      case FindingSeverity.high:
        return 'Alta';
      case FindingSeverity.critical:
        return 'Critica';
    }
  }
}
