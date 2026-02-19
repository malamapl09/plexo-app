import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/checklists/data/models/checklist_model.dart';
import 'package:plexo_ops/features/checklists/presentation/providers/checklists_provider.dart';
import 'package:plexo_ops/features/checklists/presentation/widgets/checklist_item_tile.dart';

/// Detail page for completing a checklist submission.
/// On open it calls startSubmission to create or resume a submission for today.
class ChecklistDetailPage extends ConsumerStatefulWidget {
  final ChecklistTemplate template;

  const ChecklistDetailPage({
    super.key,
    required this.template,
  });

  @override
  ConsumerState<ChecklistDetailPage> createState() =>
      _ChecklistDetailPageState();
}

class _ChecklistDetailPageState extends ConsumerState<ChecklistDetailPage> {
  /// Local state tracking per-item data before it is sent to the server.
  /// Maps itemId -> local state.
  final Map<String, _LocalItemState> _localItemStates = {};
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(_initSubmission);
  }

  Future<void> _initSubmission() async {
    final submission = await ref
        .read(checklistsProvider.notifier)
        .startSubmission(widget.template.id);

    if (submission != null && mounted) {
      // Pre-populate local states from existing responses
      for (final response in submission.responses) {
        _localItemStates[response.itemId] = _LocalItemState(
          isCompleted: response.isCompleted,
          photoUrls: List<String>.from(response.photoUrls),
          notes: response.notes,
        );
      }
      setState(() => _isInitialized = true);
    }
  }

  bool _isItemCompleted(String itemId) {
    return _localItemStates[itemId]?.isCompleted ?? false;
  }

  ChecklistResponse? _getResponse(String itemId) {
    final submission = ref.read(checklistsProvider).currentSubmission;
    if (submission == null) return null;
    try {
      return submission.responses.firstWhere((r) => r.itemId == itemId);
    } catch (_) {
      return null;
    }
  }

  Future<void> _onToggleItem(String itemId, bool isCompleted) async {
    final submission = ref.read(checklistsProvider).currentSubmission;
    if (submission == null) return;

    // Update local state immediately for responsiveness
    setState(() {
      _localItemStates[itemId] = (_localItemStates[itemId] ??
              _LocalItemState())
          .copyWith(isCompleted: isCompleted);
    });

    final localState = _localItemStates[itemId]!;

    await ref.read(checklistsProvider.notifier).respondToItem(
          submission.id,
          itemId,
          isCompleted,
          photoUrls:
              localState.photoUrls.isNotEmpty ? localState.photoUrls : null,
          notes: localState.notes,
        );
  }

  void _onPhotosChanged(String itemId, List<String> photoUrls) {
    setState(() {
      _localItemStates[itemId] =
          (_localItemStates[itemId] ?? _LocalItemState())
              .copyWith(photoUrls: photoUrls);
    });
  }

  void _onNotesChanged(String itemId, String? notes) {
    setState(() {
      _localItemStates[itemId] =
          (_localItemStates[itemId] ?? _LocalItemState())
              .copyWith(notes: notes);
    });
  }

  Future<void> _completeChecklist() async {
    final submission = ref.read(checklistsProvider).currentSubmission;
    if (submission == null) return;

    // Confirm dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Completar Checklist'),
        content: Text(
          'Se completara el checklist "${widget.template.title}" '
          'con ${submission.completedItems} de ${submission.totalItems} items marcados. '
          'Esta accion no se puede deshacer.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.success,
            ),
            child: const Text('Completar'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    // Send any outstanding item responses (notes/photos that haven't been sent yet)
    for (final entry in _localItemStates.entries) {
      final itemId = entry.key;
      final localState = entry.value;
      if (localState.isCompleted) {
        await ref.read(checklistsProvider.notifier).respondToItem(
              submission.id,
              itemId,
              localState.isCompleted,
              photoUrls: localState.photoUrls.isNotEmpty
                  ? localState.photoUrls
                  : null,
              notes: localState.notes,
            );
      }
    }

    final success = await ref
        .read(checklistsProvider.notifier)
        .completeSubmission(submission.id);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Checklist "${widget.template.title}" completado'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final checklistsState = ref.watch(checklistsProvider);
    final submission = checklistsState.currentSubmission;
    final isCompleted = submission?.isCompleted ?? false;
    final colorScheme = Theme.of(context).colorScheme;

    final completedItems = submission?.completedItems ?? 0;
    final totalItems = widget.template.items.length;
    final progress = totalItems > 0 ? completedItems / totalItems : 0.0;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.template.title,
          style: const TextStyle(fontSize: 18),
        ),
        actions: [
          if (submission != null && !isCompleted)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Chip(
                label: Text(
                  '$completedItems / $totalItems',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                backgroundColor: colorScheme.primary,
                side: BorderSide.none,
                padding: const EdgeInsets.symmetric(horizontal: 4),
              ),
            ),
        ],
      ),
      body: checklistsState.isSubmitting && !_isInitialized
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Error banner
                if (checklistsState.error != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    color: AppColors.error.withOpacity(0.1),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline,
                            color: AppColors.error, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            checklistsState.error!,
                            style: const TextStyle(
                              color: AppColors.error,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close,
                              size: 16, color: AppColors.error),
                          constraints: const BoxConstraints(),
                          padding: EdgeInsets.zero,
                          onPressed: () => ref
                              .read(checklistsProvider.notifier)
                              .clearError(),
                        ),
                      ],
                    ),
                  ),

                // Progress bar
                if (submission != null && !isCompleted)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Progreso',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Theme.of(context)
                                    .textTheme
                                    .bodyLarge
                                    ?.color,
                              ),
                            ),
                            Text(
                              '${(progress * 100).toInt()}%',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: colorScheme.primary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 10,
                            backgroundColor: colorScheme.outlineVariant,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              progress >= 1.0
                                  ? AppColors.success
                                  : colorScheme.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Completed banner
                if (isCompleted)
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.success.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.success.withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle,
                            color: AppColors.success, size: 28),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Checklist Completado',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.success,
                                ),
                              ),
                              if (submission?.score != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'Puntaje: ${submission!.score}%',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: AppColors.success.withOpacity(0.8),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                // Items list
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
                    itemCount: widget.template.items.length,
                    itemBuilder: (context, index) {
                      final item = widget.template.items[index];
                      return ChecklistItemTile(
                        item: item,
                        response: _getResponse(item.id),
                        isCompleted: _isItemCompleted(item.id),
                        readOnly: isCompleted,
                        onToggle: (value) =>
                            _onToggleItem(item.id, value),
                        onPhotosChanged: (urls) =>
                            _onPhotosChanged(item.id, urls),
                        onNotesChanged: (notes) =>
                            _onNotesChanged(item.id, notes),
                      );
                    },
                  ),
                ),
              ],
            ),

      // Complete button
      bottomNavigationBar: submission != null && !isCompleted
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed:
                        checklistsState.isSubmitting ? null : _completeChecklist,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.success,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                    child: checklistsState.isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.check_circle, color: Colors.white),
                              SizedBox(width: 8),
                              Text(
                                'Completar',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ),
            )
          : null,
    );
  }
}

/// Local state for an item while the user is filling out the checklist.
class _LocalItemState {
  final bool isCompleted;
  final List<String> photoUrls;
  final String? notes;

  _LocalItemState({
    this.isCompleted = false,
    this.photoUrls = const [],
    this.notes,
  });

  _LocalItemState copyWith({
    bool? isCompleted,
    List<String>? photoUrls,
    String? notes,
  }) {
    return _LocalItemState(
      isCompleted: isCompleted ?? this.isCompleted,
      photoUrls: photoUrls ?? this.photoUrls,
      notes: notes ?? this.notes,
    );
  }
}
