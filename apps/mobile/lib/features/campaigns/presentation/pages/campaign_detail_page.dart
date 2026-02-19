import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:plexo_ops/core/services/media_upload_service.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/campaigns/data/models/campaign_model.dart';
import 'package:plexo_ops/features/campaigns/presentation/providers/campaigns_provider.dart';
import 'package:plexo_ops/features/planograms/presentation/widgets/photo_comparison_widget.dart';

class CampaignDetailPage extends ConsumerStatefulWidget {
  final String submissionId;
  final CampaignSubmission? submission;

  const CampaignDetailPage({
    super.key,
    required this.submissionId,
    this.submission,
  });

  @override
  ConsumerState<CampaignDetailPage> createState() =>
      _CampaignDetailPageState();
}

class _CampaignDetailPageState extends ConsumerState<CampaignDetailPage> {
  CampaignSubmission? _submission;
  bool _showResubmitForm = false;
  final _resubmitNotesController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  final List<File> _resubmitFiles = [];
  bool _isUploading = false;

  @override
  void initState() {
    super.initState();
    _submission = widget.submission;
  }

  @override
  void dispose() {
    _resubmitNotesController.dispose();
    super.dispose();
  }

  Future<void> _showPhotoSourceDialog() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Tomar foto'),
                onTap: () => Navigator.pop(context, 'camera'),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Seleccionar de galeria'),
                onTap: () => Navigator.pop(context, 'gallery'),
              ),
            ],
          ),
        ),
      ),
    );

    if (result == null) return;

    try {
      final XFile? image = await _picker.pickImage(
        source: result == 'camera' ? ImageSource.camera : ImageSource.gallery,
        imageQuality: 80,
        maxWidth: 1920,
        maxHeight: 1920,
      );

      if (image != null) {
        setState(() {
          _resubmitFiles.add(File(image.path));
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error al capturar la foto'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _removeResubmitPhoto(int index) {
    setState(() {
      _resubmitFiles.removeAt(index);
    });
  }

  Future<void> _handleResubmit() async {
    if (_resubmitFiles.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor agregue al menos una foto'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isUploading = true;
    });

    try {
      final uploadService = ref.read(mediaUploadServiceProvider);
      final photoUrls = await uploadService.uploadPhotos(_resubmitFiles);

      if (photoUrls.isEmpty) {
        if (!mounted) return;
        setState(() {
          _isUploading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al subir las fotos. Intente de nuevo.'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      final submission = _submission!;
      final success =
          await ref.read(campaignsProvider.notifier).resubmitExecution(
                submission.campaignId,
                widget.submissionId,
                photoUrls,
                _resubmitNotesController.text.trim().isNotEmpty
                    ? _resubmitNotesController.text.trim()
                    : null,
              );

      if (!mounted) return;

      setState(() {
        _isUploading = false;
      });

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ejecucion reenviada exitosamente'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      } else {
        final error = ref.read(campaignsProvider).error;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error ?? 'Error al reenviar ejecucion'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isUploading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error inesperado: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(campaignsProvider);
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final submission = _submission;

    if (submission == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Detalle de Ejecucion'),
        ),
        body: const Center(
          child: Text('No se encontro la informacion del envio'),
        ),
      );
    }

    final isResubmitting = _isUploading || state.isLoading;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detalle de Ejecucion'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status badge
            _buildStatusBadge(submission, theme),
            const SizedBox(height: 20),

            // Campaign name
            if (submission.campaign != null) ...[
              Text(
                submission.campaign!.title,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (submission.campaign!.description != null) ...[
                const SizedBox(height: 8),
                Text(
                  submission.campaign!.description!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              const SizedBox(height: 16),
            ],

            // Submitted date
            _buildInfoRow(
              icon: Icons.calendar_today,
              label: 'Enviado',
              value: _formatDate(submission.submittedAt),
              theme: theme,
            ),
            const SizedBox(height: 8),

            // Photo count
            _buildInfoRow(
              icon: Icons.photo_library,
              label: 'Fotos',
              value:
                  '${submission.photoUrls.length} foto${submission.photoUrls.length == 1 ? '' : 's'}',
              theme: theme,
            ),
            const SizedBox(height: 20),

            // Notes section
            if (submission.notes != null &&
                submission.notes!.isNotEmpty) ...[
              Text(
                'Notas del Envio',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  submission.notes!,
                  style: theme.textTheme.bodyMedium,
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Review section
            if (submission.reviewNotes != null &&
                submission.reviewNotes!.isNotEmpty) ...[
              Text(
                'Notas de Revision',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: submission.isApproved
                      ? AppColors.success.withOpacity(0.1)
                      : submission.needsRevision
                          ? AppColors.error.withOpacity(0.1)
                          : colorScheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: submission.isApproved
                        ? AppColors.success
                        : submission.needsRevision
                            ? AppColors.error
                            : colorScheme.outlineVariant,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (submission.reviewedAt != null) ...[
                      Text(
                        'Revisado el ${_formatDate(submission.reviewedAt!)}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    Text(
                      submission.reviewNotes!,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Photo comparison: reference vs submitted
            if (submission.photoUrls.isNotEmpty) ...[
              Text(
                'Fotos',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              PhotoComparisonWidget(
                referencePhotos:
                    submission.campaign?.referencePhotoUrls ?? [],
                submittedPhotos: submission.photoUrls,
              ),
              const SizedBox(height: 24),
            ],

            // Resubmit section
            if (submission.needsRevision) ...[
              const Divider(height: 32),

              if (!_showResubmitForm) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      setState(() {
                        _showResubmitForm = true;
                      });
                    },
                    icon: const Icon(Icons.replay),
                    label: const Text('Reenviar Ejecucion'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colorScheme.primary,
                      foregroundColor: colorScheme.onPrimary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              ] else ...[
                Text(
                  'Reenviar Ejecucion',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Tome nuevas fotos y envie la correccion',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),

                if (_resubmitFiles.isEmpty)
                  _buildAddPhotoPlaceholder()
                else
                  SizedBox(
                    height: 120,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _resubmitFiles.length + 1,
                      itemBuilder: (context, index) {
                        if (index == _resubmitFiles.length) {
                          return Container(
                            width: 80,
                            margin: const EdgeInsets.only(right: 12),
                            decoration: BoxDecoration(
                              border: Border.all(
                                  color: colorScheme.outlineVariant, width: 2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: InkWell(
                              onTap: _showPhotoSourceDialog,
                              borderRadius: BorderRadius.circular(8),
                              child: Column(
                                mainAxisAlignment:
                                    MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add_photo_alternate,
                                      size: 24,
                                      color: colorScheme.primary),
                                  const SizedBox(height: 2),
                                  Text('Agregar',
                                      style: TextStyle(
                                          color: colorScheme.primary,
                                          fontSize: 10)),
                                ],
                              ),
                            ),
                          );
                        }

                        return Stack(
                          children: [
                            Container(
                              width: 120,
                              margin: const EdgeInsets.only(right: 12),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color:
                                      AppColors.success.withOpacity(0.5),
                                  width: 2,
                                ),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(6),
                                child: Image.file(
                                  _resubmitFiles[index],
                                  fit: BoxFit.cover,
                                  errorBuilder:
                                      (context, error, stackTrace) {
                                    return Container(
                                      color: colorScheme.surfaceContainerLow,
                                      child: Icon(
                                        Icons.image_not_supported,
                                        color: colorScheme.onSurfaceVariant,
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 16,
                              child: GestureDetector(
                                onTap: () =>
                                    _removeResubmitPhoto(index),
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(
                                    color: AppColors.error,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.close,
                                      size: 12, color: Colors.white),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),

                const SizedBox(height: 16),

                TextField(
                  controller: _resubmitNotesController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText:
                        'Notas sobre la correccion (opcional)...',
                    hintStyle: TextStyle(
                        color: colorScheme.onSurfaceVariant.withOpacity(0.5)),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide:
                          BorderSide(color: colorScheme.outlineVariant),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(
                          color: colorScheme.primary, width: 2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: isResubmitting
                            ? null
                            : () {
                                setState(() {
                                  _showResubmitForm = false;
                                  _resubmitFiles.clear();
                                  _resubmitNotesController.clear();
                                });
                              },
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Cancelar'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed:
                            isResubmitting ? null : _handleResubmit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: colorScheme.primary,
                          foregroundColor: colorScheme.onPrimary,
                          padding: const EdgeInsets.symmetric(
                              vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          disabledBackgroundColor:
                              colorScheme.primary.withOpacity(0.5),
                        ),
                        child: isResubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Reenviar'),
                      ),
                    ),
                  ],
                ),
              ],
            ],

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(
      CampaignSubmission submission, ThemeData theme) {
    Color backgroundColor;
    Color textColor;
    IconData icon;

    switch (submission.status) {
      case 'PENDING_REVIEW':
        backgroundColor = Colors.amber.shade700;
        textColor = Colors.white;
        icon = Icons.hourglass_top;
        break;
      case 'APPROVED':
        backgroundColor = AppColors.success;
        textColor = Colors.white;
        icon = Icons.check_circle;
        break;
      case 'NEEDS_REVISION':
        backgroundColor = AppColors.error;
        textColor = Colors.white;
        icon = Icons.error;
        break;
      case 'RESUBMITTED':
        backgroundColor = AppColors.info;
        textColor = Colors.white;
        icon = Icons.replay;
        break;
      default:
        backgroundColor = theme.colorScheme.surfaceContainerLow;
        textColor = theme.colorScheme.onSurface;
        icon = Icons.help_outline;
    }

    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: textColor, size: 20),
          const SizedBox(width: 8),
          Text(
            submission.statusLabel,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    required ThemeData theme,
  }) {
    return Row(
      children: [
        Icon(icon, size: 18, color: theme.colorScheme.primary),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        Expanded(
          child: Text(value, style: theme.textTheme.bodyMedium),
        ),
      ],
    );
  }

  Widget _buildAddPhotoPlaceholder() {
    final cs = Theme.of(context).colorScheme;
    return Container(
      height: 120,
      decoration: BoxDecoration(
        border: Border.all(
          color: cs.primary.withOpacity(0.4),
          width: 2,
        ),
        borderRadius: BorderRadius.circular(12),
        color: cs.primary.withOpacity(0.03),
      ),
      child: InkWell(
        onTap: _showPhotoSourceDialog,
        borderRadius: BorderRadius.circular(12),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add_a_photo, size: 40, color: cs.primary),
              const SizedBox(height: 8),
              Text(
                'Agregar Nuevas Fotos',
                style: TextStyle(
                  color: cs.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
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
