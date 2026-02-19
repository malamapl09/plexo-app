import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:plexo_ops/core/services/media_upload_service.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/corrective_actions/data/models/corrective_action_model.dart';
import 'package:plexo_ops/features/corrective_actions/presentation/providers/corrective_actions_provider.dart';

/// Detail page for a single corrective action.
///
/// Accepts [actionId] and resolves the action from the provider state.
/// Displays status badge, source type label, priority badge, title,
/// description, due date, store name, and a completion section with
/// notes text field and photo add button.
class CorrectiveActionDetailPage extends ConsumerStatefulWidget {
  final String actionId;

  const CorrectiveActionDetailPage({
    super.key,
    required this.actionId,
  });

  @override
  ConsumerState<CorrectiveActionDetailPage> createState() =>
      _CorrectiveActionDetailPageState();
}

class _CorrectiveActionDetailPageState
    extends ConsumerState<CorrectiveActionDetailPage> {
  final _notesController = TextEditingController();
  final List<String> _photoUrls = [];
  bool _isUploading = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  CorrectiveActionModel? _resolveAction() {
    return ref
        .read(correctiveActionsProvider.notifier)
        .getActionById(widget.actionId);
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    return '$day/$month/${date.year}';
  }

  IconData _sourceTypeIcon(String sourceType) {
    switch (sourceType) {
      case 'AUDIT_FINDING':
        return Icons.fact_check;
      case 'CHECKLIST_FAILURE':
        return Icons.playlist_remove;
      case 'ISSUE':
        return Icons.report_problem;
      case 'MANUAL':
        return Icons.edit_note;
      default:
        return Icons.assignment;
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  Future<void> _pickAndUploadPhoto() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1200,
      imageQuality: 80,
    );
    if (picked == null) return;

    setState(() => _isUploading = true);

    final uploadService = ref.read(mediaUploadServiceProvider);
    final result = await uploadService.uploadPhoto(File(picked.path));

    if (!mounted) return;

    if (result.success && result.url != null) {
      setState(() {
        _photoUrls.add(result.url!);
        _isUploading = false;
      });
    } else {
      setState(() => _isUploading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.error ?? 'Error al subir la foto'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _pickFromGallery() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1200,
      imageQuality: 80,
    );
    if (picked == null) return;

    setState(() => _isUploading = true);

    final uploadService = ref.read(mediaUploadServiceProvider);
    final result = await uploadService.uploadPhoto(File(picked.path));

    if (!mounted) return;

    if (result.success && result.url != null) {
      setState(() {
        _photoUrls.add(result.url!);
        _isUploading = false;
      });
    } else {
      setState(() => _isUploading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.error ?? 'Error al subir la foto'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _removePhoto(int index) {
    setState(() => _photoUrls.removeAt(index));
  }

  void _showPhotoOptions() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Tomar Foto'),
              onTap: () {
                Navigator.pop(ctx);
                _pickAndUploadPhoto();
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Seleccionar de Galeria'),
              onTap: () {
                Navigator.pop(ctx);
                _pickFromGallery();
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _markAsCompleted(CorrectiveActionModel action) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Marcar como Completada'),
        content: const Text(
          'Se marcara esta accion correctiva como completada. '
          'Esta accion sera revisada por un supervisor.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.success,
            ),
            child: const Text('Completar'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final success =
        await ref.read(correctiveActionsProvider.notifier).updateAction(
              action.id,
              status: 'COMPLETED',
              completionNotes: _notesController.text.trim().isNotEmpty
                  ? _notesController.text.trim()
                  : null,
              completionPhotoUrls: _photoUrls.isNotEmpty ? _photoUrls : null,
            );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Accion correctiva completada'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context);
    } else {
      final error = ref.read(correctiveActionsProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error ?? 'Error al completar la accion'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    // Watch the provider to react to updates.
    final capaState = ref.watch(correctiveActionsProvider);
    final action = capaState.myActions
        .cast<CorrectiveActionModel?>()
        .firstWhere((a) => a?.id == widget.actionId, orElse: () => null);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de Accion Correctiva'),
      ),
      body: capaState.isLoading && action == null
          ? const Center(child: CircularProgressIndicator())
          : action == null
              ? const Center(
                  child: Text('No se encontro la accion correctiva'),
                )
              : _buildBody(action),
      bottomNavigationBar:
          action != null && action.canComplete ? _buildBottomBar(action) : null,
    );
  }

  Widget _buildBody(CorrectiveActionModel action) {
    final colorScheme = Theme.of(context).colorScheme;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ---- Badges row: status + priority + overdue ----
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildStatusBadge(action),
              _buildPriorityBadge(action),
              if (action.isOverdue) _buildOverdueBadge(),
            ],
          ),
          const SizedBox(height: 20),

          // ---- Source type label ----
          _buildSectionRow(
            icon: _sourceTypeIcon(action.sourceType),
            label: 'Origen',
            value: action.sourceTypeLabel,
          ),
          const SizedBox(height: 12),

          // ---- Title ----
          Text(
            action.displayTitle,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 12),

          // ---- Description ----
          _buildInfoCard(
            title: 'Descripcion',
            child: Text(
              action.description,
              style: TextStyle(
                fontSize: 14,
                color: colorScheme.onSurface,
                height: 1.5,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // ---- Due date ----
          _buildSectionRow(
            icon: action.isOverdue ? Icons.warning : Icons.calendar_today,
            label: 'Vencimiento',
            value: _formatDate(action.dueDate),
            valueColor: action.isOverdue ? AppColors.error : null,
          ),
          const SizedBox(height: 12),

          // ---- Store name ----
          if (action.storeName != null) ...[
            _buildSectionRow(
              icon: Icons.store,
              label: 'Tienda',
              value: action.storeName!,
            ),
            const SizedBox(height: 12),
          ],

          // ---- Assigned to ----
          if (action.assignedToName != null) ...[
            _buildSectionRow(
              icon: Icons.person,
              label: 'Asignado a',
              value: action.assignedToName!,
            ),
            const SizedBox(height: 12),
          ],

          const Divider(height: 32),

          // ---- Existing completion notes (read-only) ----
          if (action.completionNotes != null &&
              action.completionNotes!.isNotEmpty) ...[
            _buildInfoCard(
              title: 'Notas de Completacion',
              child: Text(
                action.completionNotes!,
                style: const TextStyle(fontSize: 14, height: 1.5),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // ---- Existing completion photos (read-only) ----
          if (action.completionPhotoUrls.isNotEmpty) ...[
            _buildInfoCard(
              title: 'Fotos de Completacion',
              child: _buildPhotoGrid(action.completionPhotoUrls),
            ),
            const SizedBox(height: 16),
          ],

          // ---- Completion section (editable) ----
          if (action.canComplete) ...[
            const Divider(height: 32),
            Text(
              'Completar Accion',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 16),

            // Notes text field
            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: 'Notas de completacion',
                hintText: 'Describe las acciones tomadas...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: colorScheme.primary, width: 2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Photo section
            Text(
              'Fotos de Evidencia',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),

            if (_photoUrls.isNotEmpty) ...[
              SizedBox(
                height: 110,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _photoUrls.length,
                  itemBuilder: (context, index) {
                    return _buildPhotoThumbnail(index);
                  },
                ),
              ),
              const SizedBox(height: 12),
            ],

            OutlinedButton.icon(
              onPressed: _isUploading ? null : _showPhotoOptions,
              icon: _isUploading
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.add_photo_alternate),
              label: Text(
                _isUploading
                    ? 'Subiendo...'
                    : _photoUrls.isEmpty
                        ? 'Agregar Foto'
                        : 'Agregar Otra Foto',
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: colorScheme.primary,
                side: BorderSide(color: colorScheme.primary),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Badge builders
  // ---------------------------------------------------------------------------

  Widget _buildStatusBadge(CorrectiveActionModel action) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: action.statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: action.statusColor),
      ),
      child: Text(
        action.statusLabel,
        style: TextStyle(
          color: action.statusColor,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildPriorityBadge(CorrectiveActionModel action) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: action.priorityColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: action.priorityColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.flag, size: 14, color: action.priorityColor),
          const SizedBox(width: 4),
          Text(
            action.priorityLabel,
            style: TextStyle(
              color: action.priorityColor,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverdueBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.error,
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.warning, size: 14, color: Colors.white),
          SizedBox(width: 4),
          Text(
            'Vencida',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Info builders
  // ---------------------------------------------------------------------------

  Widget _buildSectionRow({
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Icon(icon, size: 20, color: colorScheme.primary),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              fontSize: 14,
              color: valueColor ?? colorScheme.onSurface,
              fontWeight: valueColor != null ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoCard({required String title, required Widget child}) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Photo builders
  // ---------------------------------------------------------------------------

  Widget _buildPhotoGrid(List<String> urls) {
    final colorScheme = Theme.of(context).colorScheme;
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.2,
      ),
      itemCount: urls.length,
      itemBuilder: (context, index) {
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            urls[index],
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) {
              return Container(
                color: colorScheme.surfaceContainerLow,
                child: Icon(Icons.image_not_supported,
                    color: colorScheme.onSurfaceVariant.withOpacity(0.7)),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildPhotoThumbnail(int index) {
    final colorScheme = Theme.of(context).colorScheme;
    return Stack(
      children: [
        Container(
          width: 100,
          margin: const EdgeInsets.only(right: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: colorScheme.outlineVariant),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              _photoUrls[index],
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) {
                return Container(
                  color: colorScheme.surfaceContainerLow,
                  child: const Icon(Icons.image_not_supported),
                );
              },
            ),
          ),
        ),
        Positioned(
          top: 4,
          right: 14,
          child: GestureDetector(
            onTap: () => _removePhoto(index),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.close,
                size: 14,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Bottom bar
  // ---------------------------------------------------------------------------

  Widget _buildBottomBar(CorrectiveActionModel action) {
    final isUpdating = ref.watch(correctiveActionsProvider).isLoading;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: isUpdating ? null : () => _markAsCompleted(action),
            icon: isUpdating
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.check_circle, color: Colors.white),
            label: Text(
              isUpdating ? 'Enviando...' : 'Marcar como Completada',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.success,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 2,
            ),
          ),
        ),
      ),
    );
  }
}
