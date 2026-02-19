import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/features/verification/data/models/pending_verification_model.dart';
import 'package:plexo_ops/features/verification/presentation/providers/verification_provider.dart';
import 'package:plexo_ops/features/verification/presentation/widgets/verification_card.dart';

class VerificationQueuePage extends ConsumerStatefulWidget {
  const VerificationQueuePage({super.key});

  @override
  ConsumerState<VerificationQueuePage> createState() =>
      _VerificationQueuePageState();
}

class _VerificationQueuePageState extends ConsumerState<VerificationQueuePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(verificationProvider.notifier).loadPendingVerifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(verificationProvider);

    return RefreshIndicator(
      onRefresh: () =>
          ref.read(verificationProvider.notifier).loadPendingVerifications(),
      child: state.isLoading && state.allItems.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.error != null && state.allItems.isEmpty
              ? _buildErrorView(state.error!)
              : state.allItems.isEmpty
                  ? _buildEmptyView()
                  : _buildContent(state),
    );
  }

  Widget _buildContent(VerificationState state) {
    return Column(
      children: [
        // Filter chips
        _buildFilterChips(state),

        // List
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.only(top: 8, bottom: 100),
            itemCount: state.filteredItems.length,
            itemBuilder: (context, index) {
              final item = state.filteredItems[index];
              return VerificationCard(
                item: item,
                isProcessing: state.isProcessing,
                onVerify: () => _showVerifyDialog(item),
                onReject: () => _showRejectDialog(item),
                onTap: () => _showDetailSheet(item),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChips(VerificationState state) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          FilterChip(
            label: Text('Todos (${state.allItems.length})'),
            selected: state.typeFilter == null,
            onSelected: (_) =>
                ref.read(verificationProvider.notifier).setTypeFilter(null),
          ),
          const SizedBox(width: 8),
          FilterChip(
            label: Text('Tareas (${state.tasks.length})'),
            selected:
                state.typeFilter == VerificationEntityType.taskAssignment,
            onSelected: (_) => ref
                .read(verificationProvider.notifier)
                .setTypeFilter(VerificationEntityType.taskAssignment),
          ),
          const SizedBox(width: 8),
          FilterChip(
            label: Text('Incidencias (${state.issues.length})'),
            selected: state.typeFilter == VerificationEntityType.issue,
            onSelected: (_) => ref
                .read(verificationProvider.notifier)
                .setTypeFilter(VerificationEntityType.issue),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyView() {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.check_circle_outline,
            size: 80,
            color: Colors.green.withValues(alpha: 0.4),
          ),
          const SizedBox(height: 16),
          Text(
            'No hay verificaciones pendientes',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Todas las tareas e incidencias han sido verificadas',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.outline,
                ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildErrorView(String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 60, color: Colors.red),
          const SizedBox(height: 16),
          Text(
            error,
            style: Theme.of(context).textTheme.bodyLarge,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => ref
                .read(verificationProvider.notifier)
                .loadPendingVerifications(),
            icon: const Icon(Icons.refresh),
            label: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }

  void _showVerifyDialog(PendingVerificationItem item) {
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Verificar ${item.entityTypeLabel}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '¿Confirmar que "${item.title}" ha sido completado correctamente?',
            ),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(
                labelText: 'Notas (opcional)',
                border: OutlineInputBorder(),
                hintText: 'Agregar comentarios...',
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              Navigator.pop(context);
              final success = item.entityType ==
                      VerificationEntityType.taskAssignment
                  ? await ref.read(verificationProvider.notifier).verifyTask(
                        item.entityId,
                        notes: notesController.text.isEmpty
                            ? null
                            : notesController.text,
                      )
                  : await ref.read(verificationProvider.notifier).verifyIssue(
                        item.entityId,
                        notes: notesController.text.isEmpty
                            ? null
                            : notesController.text,
                      );

              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('${item.entityTypeLabel} verificada'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            },
            icon: const Icon(Icons.check),
            label: const Text('Verificar'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _showRejectDialog(PendingVerificationItem item) {
    final reasonController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Rechazar ${item.entityTypeLabel}'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '¿Por qué se rechaza "${item.title}"?',
                style: const TextStyle(color: Colors.red),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: reasonController,
                decoration: const InputDecoration(
                  labelText: 'Razón del rechazo *',
                  border: OutlineInputBorder(),
                  hintText: 'Explique por qué necesita rehacerse...',
                ),
                maxLines: 3,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'La razón es requerida';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              if (!formKey.currentState!.validate()) return;

              Navigator.pop(context);
              final success = item.entityType ==
                      VerificationEntityType.taskAssignment
                  ? await ref.read(verificationProvider.notifier).rejectTask(
                        item.entityId,
                        reasonController.text.trim(),
                      )
                  : await ref.read(verificationProvider.notifier).rejectIssue(
                        item.entityId,
                        reasonController.text.trim(),
                      );

              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                        '${item.entityTypeLabel} rechazada - enviada a rehacer'),
                    backgroundColor: Colors.orange,
                  ),
                );
              }
            },
            icon: const Icon(Icons.close),
            label: const Text('Rechazar'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _showDetailSheet(PendingVerificationItem item) {
    final colorScheme = Theme.of(context).colorScheme;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                item.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 16),
              if (item.description != null && item.description!.isNotEmpty)
                Text(item.description!),
              const SizedBox(height: 24),
              _buildDetailRow(Icons.store, 'Tienda',
                  '${item.store.name} (${item.store.code})'),
              _buildDetailRow(Icons.person, 'Completado por',
                  '${item.submittedBy.name}\n${item.submittedBy.roleLabel}'),
              _buildDetailRow(
                  Icons.priority_high, 'Prioridad', item.priorityLabel),
              if (item.category != null)
                _buildDetailRow(Icons.category, 'Categoría',
                    item.categoryLabel ?? item.category!),
              if (item.notes != null && item.notes!.isNotEmpty)
                _buildDetailRow(Icons.note, 'Notas', item.notes!),
              if (item.photoUrls.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  'Fotos (${item.photoUrls.length})',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 100,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: item.photoUrls.length,
                    itemBuilder: (context, index) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          item.photoUrls[index],
                          width: 100,
                          height: 100,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 100,
                            height: 100,
                            color: colorScheme.outlineVariant,
                            child: const Icon(Icons.broken_image),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _showRejectDialog(item);
                      },
                      icon: const Icon(Icons.close),
                      label: const Text('Rechazar'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _showVerifyDialog(item);
                      },
                      icon: const Icon(Icons.check),
                      label: const Text('Verificar'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: colorScheme.onSurfaceVariant),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(fontSize: 14),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
