import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/receiving/data/models/receiving_model.dart';
import 'package:plexo_ops/features/receiving/presentation/providers/receiving_provider.dart';
import 'package:plexo_ops/features/receiving/presentation/widgets/receiving_stats_header.dart';
import 'package:plexo_ops/features/receiving/presentation/widgets/receiving_card.dart';
import 'package:plexo_ops/features/receiving/presentation/widgets/receiving_filter_chips.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';
import 'package:plexo_ops/shared/widgets/barcode_scanner_sheet.dart';
import 'package:plexo_ops/shared/widgets/signature_capture_widget.dart';
import 'package:plexo_ops/core/services/media_upload_service.dart';
import 'dart:typed_data';

class ReceivingPage extends ConsumerStatefulWidget {
  const ReceivingPage({super.key});

  @override
  ConsumerState<ReceivingPage> createState() => _ReceivingPageState();
}

class _ReceivingPageState extends ConsumerState<ReceivingPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final storeId = ref.read(authStateProvider).user?.storeId;
      // Load all receivings for HQ/admin users (null storeId), or filter by store
      ref.read(receivingProvider.notifier).loadReceivings(storeId: storeId);
    });
  }

  Future<void> _onRefresh() async {
    final storeId = ref.read(authStateProvider).user?.storeId;
    await ref.read(receivingProvider.notifier).loadReceivings(storeId: storeId);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(receivingProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        child: state.isLoading && state.receivings.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : CustomScrollView(
                slivers: [
                  // Stats Header
                  SliverToBoxAdapter(
                    child: ReceivingStatsHeader(
                      stats: state.stats,
                      isLoading: state.isLoading,
                    ),
                  ),

                  // Filter Chips
                  SliverToBoxAdapter(
                    child: ReceivingFilterChips(
                      selectedStatus: state.statusFilter,
                      onStatusChanged: (status) {
                        ref
                            .read(receivingProvider.notifier)
                            .setStatusFilter(status);
                      },
                    ),
                  ),

                  // Error message
                  if (state.error != null)
                    SliverToBoxAdapter(
                      child: Builder(builder: (context) {
                        final isDark = Theme.of(context).brightness == Brightness.dark;
                        return Container(
                        margin: const EdgeInsets.all(16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(isDark ? 0.2 : 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, color: AppColors.error),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                state.error!,
                                style: TextStyle(color: AppColors.error),
                              ),
                            ),
                          ],
                        ),
                      );
                      }),
                    ),

                  // Receiving List
                  if (state.filteredReceivings.isEmpty && !state.isLoading)
                    SliverFillRemaining(
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.local_shipping_outlined,
                              size: 64,
                              color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No hay recepciones',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w500,
                                color: Theme.of(context).colorScheme.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              state.statusFilter != null
                                  ? 'No hay recepciones con este estado'
                                  : 'Las recepciones programadas aparecerán aquí',
                              style: TextStyle(
                                fontSize: 14,
                                color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.all(16),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final receiving = state.filteredReceivings[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: ReceivingCard(
                                receiving: receiving,
                                onTap: () => _openReceivingDetail(receiving),
                                onStart: receiving.isPending
                                    ? () => _startReceiving(receiving)
                                    : null,
                                onComplete: receiving.isInProgress
                                    ? () => _completeReceiving(receiving)
                                    : null,
                              ),
                            );
                          },
                          childCount: state.filteredReceivings.length,
                        ),
                      ),
                    ),

                  // Bottom padding
                  const SliverToBoxAdapter(
                    child: SizedBox(height: 80),
                  ),
                ],
              ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddReceivingSheet(context),
        icon: const Icon(Icons.add),
        label: const Text('Nueva Recepción'),
      ),
    );
  }

  void _openReceivingDetail(ReceivingModel receiving) {
    // TODO: Navigate to receiving detail page
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ReceivingDetailSheet(receiving: receiving),
    );
  }

  void _startReceiving(ReceivingModel receiving) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Iniciar Recepción'),
        content: Text(
          '¿Confirmar llegada de ${receiving.supplierName}?\n\n'
          'Esto marcará la hora de llegada como ahora.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await ref.read(receivingProvider.notifier).startReceiving(receiving.id);
    }
  }

  void _completeReceiving(ReceivingModel receiving) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CompleteReceivingSheet(receiving: receiving),
    );
  }

  void _showAddReceivingSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _AddReceivingSheet(),
    );
  }
}

class _ReceivingDetailSheet extends StatelessWidget {
  final ReceivingModel receiving;

  const _ReceivingDetailSheet({required this.receiving});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colorScheme.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        receiving.supplierName,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        receiving.supplierTypeLabel,
                        style: TextStyle(
                          fontSize: 14,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                _StatusBadge(status: receiving.status),
              ],
            ),
          ),
          const Divider(),
          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _DetailRow(
                    icon: Icons.store,
                    label: 'Tienda',
                    value: '${receiving.store.code} - ${receiving.store.name}',
                  ),
                  if (receiving.poNumber != null && receiving.poNumber!.isNotEmpty)
                    _DetailRow(
                      icon: Icons.receipt_long,
                      label: 'Número de PO',
                      value: receiving.poNumber!,
                    ),
                  if (receiving.driverName != null)
                    _DetailRow(
                      icon: Icons.person,
                      label: 'Conductor',
                      value: receiving.driverName!,
                    ),
                  if (receiving.truckPlate != null)
                    _DetailRow(
                      icon: Icons.local_shipping,
                      label: 'Placa',
                      value: receiving.truckPlate!,
                    ),
                  if (receiving.itemCount != null)
                    _DetailRow(
                      icon: Icons.inventory_2,
                      label: 'Cantidad',
                      value: '${receiving.itemCount} items',
                    ),
                  if (receiving.scheduledTime != null)
                    _DetailRow(
                      icon: Icons.schedule,
                      label: 'Programado',
                      value: _formatTime(receiving.scheduledTime!),
                    ),
                  if (receiving.arrivalTime != null)
                    _DetailRow(
                      icon: Icons.login,
                      label: 'Llegada',
                      value: _formatTime(receiving.arrivalTime!),
                    ),
                  if (receiving.notes != null && receiving.notes!.isNotEmpty)
                    _DetailRow(
                      icon: Icons.notes,
                      label: 'Notas',
                      value: receiving.notes!,
                    ),
                  if (receiving.discrepancies.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Icon(Icons.warning_amber, color: AppColors.error, size: 20),
                        const SizedBox(width: 8),
                        const Text(
                          'Discrepancias Reportadas',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ...receiving.discrepancies.map((d) => _DiscrepancyItem(d)),
                  ],
                ],
              ),
            ),
          ),
          // Action buttons for in-progress receiving
          if (receiving.isInProgress)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (context) => _ReportDiscrepancySheet(receiving: receiving),
                        );
                      },
                      icon: const Icon(Icons.report_problem, color: Colors.orange),
                      label: const Text('Reportar Error/Discrepancia'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.orange,
                        side: const BorderSide(color: Colors.orange),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}

class _StatusBadge extends StatelessWidget {
  final ReceivingStatus status;

  const _StatusBadge({required this.status});

  Color _color(BuildContext context) {
    switch (status) {
      case ReceivingStatus.pending:
        return AppColors.warning;
      case ReceivingStatus.inProgress:
        return Theme.of(context).colorScheme.primary;
      case ReceivingStatus.completed:
        return AppColors.success;
      case ReceivingStatus.withIssue:
        return AppColors.error;
      case ReceivingStatus.didNotArrive:
        return Colors.grey;
    }
  }

  String get _label {
    switch (status) {
      case ReceivingStatus.pending:
        return 'Pendiente';
      case ReceivingStatus.inProgress:
        return 'En Proceso';
      case ReceivingStatus.completed:
        return 'Completada';
      case ReceivingStatus.withIssue:
        return 'Con Incidencias';
      case ReceivingStatus.didNotArrive:
        return 'No Llegó';
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _color(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.2 : 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DiscrepancyItem extends StatelessWidget {
  final DiscrepancyModel discrepancy;

  const _DiscrepancyItem(this.discrepancy);

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(isDark ? 0.15 : 0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.error.withOpacity(isDark ? 0.4 : 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  discrepancy.typeLabel,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.error,
                  ),
                ),
              ),
              if (discrepancy.quantity != null) ...[
                const SizedBox(width: 8),
                Text(
                  'Cantidad: ${discrepancy.quantity}',
                  style: TextStyle(
                    fontSize: 12,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          Text(
            discrepancy.productInfo,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          if (discrepancy.notes != null) ...[
            const SizedBox(height: 4),
            Text(
              discrepancy.notes!,
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CompleteReceivingSheet extends ConsumerStatefulWidget {
  final ReceivingModel receiving;

  const _CompleteReceivingSheet({required this.receiving});

  @override
  ConsumerState<_CompleteReceivingSheet> createState() =>
      _CompleteReceivingSheetState();
}

class _CompleteReceivingSheetState
    extends ConsumerState<_CompleteReceivingSheet> {
  final _notesController = TextEditingController();
  final _itemCountController = TextEditingController();
  final List<File> _photos = [];
  final _imagePicker = ImagePicker();
  Uint8List? _signatureBytes;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.receiving.itemCount != null) {
      _itemCountController.text = widget.receiving.itemCount.toString();
    }
  }

  @override
  void dispose() {
    _notesController.dispose();
    _itemCountController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    try {
      final pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        setState(() {
          _photos.add(File(pickedFile.path));
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  void _showPhotoOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Tomar Foto'),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Seleccionar de Galería'),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colorScheme.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Completar Recepción',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.receiving.supplierName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),

                  // Show existing discrepancies if any
                  if (widget.receiving.discrepancyCount > 0) ...[
                    const SizedBox(height: 16),
                    Builder(builder: (context) {
                      final isDark = Theme.of(context).brightness == Brightness.dark;
                      return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(isDark ? 0.2 : 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.error.withOpacity(isDark ? 0.5 : 0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.warning_amber, color: AppColors.error),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              '${widget.receiving.discrepancyCount} discrepancia(s) reportada(s)',
                              style: TextStyle(
                                color: AppColors.error,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                    }),
                  ],

                  const SizedBox(height: 24),
                  TextField(
                    controller: _itemCountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Cantidad de items recibidos',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.inventory_2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _notesController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Notas (opcional)',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.notes),
                    ),
                  ),

                  // Photos section
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Fotos',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: _showPhotoOptions,
                        icon: const Icon(Icons.add_a_photo, size: 20),
                        label: const Text('Agregar'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (_photos.isEmpty)
                    Container(
                      height: 100,
                      decoration: BoxDecoration(
                        border: Border.all(color: Theme.of(context).dividerColor),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.photo_camera, size: 32, color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
                            const SizedBox(height: 4),
                            Text(
                              'Sin fotos',
                              style: TextStyle(color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    SizedBox(
                      height: 100,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _photos.length,
                        itemBuilder: (context, index) {
                          return Stack(
                            children: [
                              Container(
                                width: 100,
                                height: 100,
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  image: DecorationImage(
                                    image: FileImage(_photos[index]),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 4,
                                right: 12,
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() => _photos.removeAt(index));
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.close, size: 14, color: Colors.white),
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),

                  // Report issue during completion option
                  const SizedBox(height: 24),
                  OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (context) => _ReportDiscrepancySheet(receiving: widget.receiving),
                      );
                    },
                    icon: const Icon(Icons.report_problem, color: Colors.orange),
                    label: const Text('Reportar Error/Discrepancia'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.orange,
                      side: const BorderSide(color: Colors.orange),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      minimumSize: const Size(double.infinity, 48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),

                  // Signature capture
                  const SizedBox(height: 24),
                  SignatureCaptureWidget(
                    label: 'Firma del Conductor',
                    height: 150,
                    onSignatureCaptured: (bytes) {
                      setState(() => _signatureBytes = bytes);
                    },
                    onClear: () {
                      setState(() => _signatureBytes = null);
                    },
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (widget.receiving.discrepancyCount > 0) ...[
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : () => _complete(withIssues: true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              'Completar con Incidencias',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                            ),
                    ),
                  ),
                ] else ...[
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : () => _complete(withIssues: false),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text(
                              'Completar Recepción',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                            ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _complete({required bool withIssues}) async {
    setState(() => _isLoading = true);

    try {
      final mediaService = ref.read(mediaUploadServiceProvider);

      // Upload photos
      final photoUrls = _photos.isNotEmpty
          ? await mediaService.uploadPhotos(_photos)
          : <String>[];

      // Upload signature
      String? signatureUrl;
      if (_signatureBytes != null) {
        final sigResult = await mediaService.uploadSignature(_signatureBytes!);
        if (sigResult.success) {
          signatureUrl = sigResult.url;
        }
      }

      if (withIssues) {
        await ref.read(receivingProvider.notifier).completeWithIssues(
              widget.receiving.id,
              itemCount: int.tryParse(_itemCountController.text),
              notes: _notesController.text.isNotEmpty ? _notesController.text : null,
              photoUrls: photoUrls.isNotEmpty ? photoUrls : null,
              signatureUrl: signatureUrl,
            );
      } else {
        if (signatureUrl == null) {
          setState(() => _isLoading = false);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('La firma del conductor es requerida'),
                backgroundColor: Colors.orange,
              ),
            );
          }
          return;
        }
        await ref.read(receivingProvider.notifier).completeReceiving(
              widget.receiving.id,
              itemCount: int.tryParse(_itemCountController.text),
              notes: _notesController.text.isNotEmpty ? _notesController.text : null,
              photoUrls: photoUrls.isNotEmpty ? photoUrls : null,
              signatureUrl: signatureUrl,
            );
      }

      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al completar: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

// New widget for reporting discrepancies
class _ReportDiscrepancySheet extends ConsumerStatefulWidget {
  final ReceivingModel receiving;

  const _ReportDiscrepancySheet({required this.receiving});

  @override
  ConsumerState<_ReportDiscrepancySheet> createState() => _ReportDiscrepancySheetState();
}

class _ReportDiscrepancySheetState extends ConsumerState<_ReportDiscrepancySheet> {
  final _productController = TextEditingController();
  final _quantityController = TextEditingController();
  final _notesController = TextEditingController();
  final List<File> _photos = [];
  final _imagePicker = ImagePicker();
  String _selectedType = 'MISSING';
  bool _isLoading = false;

  final Map<String, String> _discrepancyTypes = {
    'MISSING': 'Faltante',
    'DAMAGED': 'Dañado',
    'WRONG_PRODUCT': 'Producto Incorrecto',
  };

  @override
  void dispose() {
    _productController.dispose();
    _quantityController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    try {
      final pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        setState(() {
          _photos.add(File(pickedFile.path));
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  void _showPhotoOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Tomar Foto'),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Seleccionar de Galería'),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colorScheme.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.report_problem, color: Colors.orange),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text(
                    'Reportar Discrepancia',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Proveedor: ${widget.receiving.supplierName}',
                    style: TextStyle(
                      fontSize: 14,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Discrepancy type selector
                  const Text(
                    'Tipo de Discrepancia',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _discrepancyTypes.entries.map((entry) {
                      final isSelected = _selectedType == entry.key;
                      final isDark = Theme.of(context).brightness == Brightness.dark;
                      return ChoiceChip(
                        label: Text(entry.value),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _selectedType = entry.key);
                          }
                        },
                        selectedColor: Colors.orange.withOpacity(isDark ? 0.35 : 0.2),
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.orange : null,
                          fontWeight: isSelected ? FontWeight.w600 : null,
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 24),
                  TextField(
                    controller: _productController,
                    decoration: const InputDecoration(
                      labelText: 'Producto Afectado *',
                      hintText: 'Ej: Cajas de leche, pallets de agua...',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.inventory),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _quantityController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Cantidad (opcional)',
                      hintText: 'Número de unidades afectadas',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.numbers),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _notesController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Descripción del Problema',
                      hintText: 'Describe el problema encontrado...',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.notes),
                    ),
                  ),

                  // Photos section
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Fotos de Evidencia',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(width: 8),
                          Builder(builder: (context) {
                            final isDark = Theme.of(context).brightness == Brightness.dark;
                            return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(isDark ? 0.25 : 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Recomendado',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.orange,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          );
                          }),
                        ],
                      ),
                      TextButton.icon(
                        onPressed: _showPhotoOptions,
                        icon: const Icon(Icons.add_a_photo, size: 20),
                        label: const Text('Agregar'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (_photos.isEmpty)
                    Builder(builder: (context) {
                      final isDark = Theme.of(context).brightness == Brightness.dark;
                      return Container(
                      height: 100,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.orange.withOpacity(isDark ? 0.5 : 0.3)),
                        borderRadius: BorderRadius.circular(8),
                        color: Colors.orange.withOpacity(isDark ? 0.15 : 0.05),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.photo_camera, size: 32, color: Colors.orange.withOpacity(isDark ? 0.7 : 0.5)),
                            const SizedBox(height: 4),
                            Text(
                              'Agrega fotos de la discrepancia',
                              style: TextStyle(color: Colors.orange.withOpacity(isDark ? 0.85 : 0.7), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    );
                    })
                  else
                    SizedBox(
                      height: 100,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _photos.length,
                        itemBuilder: (context, index) {
                          return Stack(
                            children: [
                              Container(
                                width: 100,
                                height: 100,
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  image: DecorationImage(
                                    image: FileImage(_photos[index]),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 4,
                                right: 12,
                                child: GestureDetector(
                                  onTap: () {
                                    setState(() => _photos.removeAt(index));
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.close, size: 14, color: Colors.white),
                                  ),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading || _productController.text.isEmpty ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Reportar Discrepancia',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (_productController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor ingresa el producto afectado')),
      );
      return;
    }

    setState(() => _isLoading = true);

    // Upload photos
    final mediaService = ref.read(mediaUploadServiceProvider);
    final photoUrls = _photos.isNotEmpty
        ? await mediaService.uploadPhotos(_photos)
        : <String>[];

    final success = await ref.read(receivingProvider.notifier).addDiscrepancy(
          widget.receiving.id,
          type: _selectedType,
          productInfo: _productController.text,
          quantity: int.tryParse(_quantityController.text),
          notes: _notesController.text.isNotEmpty ? _notesController.text : null,
          photoUrls: photoUrls.isNotEmpty ? photoUrls : null,
        );

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Discrepancia reportada exitosamente'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al reportar discrepancia'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

void debugPrint(String message) {
  // ignore: avoid_print
  print(message);
}

class _AddReceivingSheet extends ConsumerStatefulWidget {
  const _AddReceivingSheet();

  @override
  ConsumerState<_AddReceivingSheet> createState() => _AddReceivingSheetState();
}

class _AddReceivingSheetState extends ConsumerState<_AddReceivingSheet> {
  final _supplierController = TextEditingController();
  final _poNumberController = TextEditingController();
  final _driverController = TextEditingController();
  final _plateController = TextEditingController();
  final _itemCountController = TextEditingController();
  String _selectedSupplierType = 'DISTRIBUTION_CENTER';
  TimeOfDay? _scheduledTime;

  @override
  void dispose() {
    _supplierController.dispose();
    _poNumberController.dispose();
    _driverController.dispose();
    _plateController.dispose();
    _itemCountController.dispose();
    super.dispose();
  }

  Future<void> _scanPoNumber() async {
    final scannedValue = await BarcodeScannerSheet.show(
      context,
      title: 'Escanear Número de PO',
      subtitle: 'Apunta al código de barras de la orden de compra',
    );
    if (scannedValue != null && mounted) {
      setState(() {
        _poNumberController.text = scannedValue;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: colorScheme.outlineVariant,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Nueva Recepción',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
          ),
          const Divider(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Tipo de Proveedor',
                    style: TextStyle(fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: _SupplierTypeOption(
                          label: 'Centro de Distribución',
                          value: 'DISTRIBUTION_CENTER',
                          selected: _selectedSupplierType == 'DISTRIBUTION_CENTER',
                          onTap: () => setState(
                              () => _selectedSupplierType = 'DISTRIBUTION_CENTER'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _SupplierTypeOption(
                          label: 'Proveedor Externo',
                          value: 'THIRD_PARTY',
                          selected: _selectedSupplierType == 'THIRD_PARTY',
                          onTap: () =>
                              setState(() => _selectedSupplierType = 'THIRD_PARTY'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: _supplierController,
                    decoration: const InputDecoration(
                      labelText: 'Nombre del Proveedor *',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _poNumberController,
                    decoration: InputDecoration(
                      labelText: 'Número de PO',
                      hintText: 'Escanea o ingresa el número de orden',
                      border: const OutlineInputBorder(),
                      prefixIcon: const Icon(Icons.receipt_long),
                      suffixIcon: IconButton(
                        onPressed: _scanPoNumber,
                        icon: Icon(
                          Icons.qr_code_scanner,
                          color: colorScheme.primary,
                        ),
                        tooltip: 'Escanear código',
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _driverController,
                          decoration: const InputDecoration(
                            labelText: 'Conductor',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: _plateController,
                          decoration: const InputDecoration(
                            labelText: 'Placa',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _itemCountController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Cantidad esperada',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: InkWell(
                          onTap: _selectTime,
                          child: InputDecorator(
                            decoration: const InputDecoration(
                              labelText: 'Hora programada',
                              border: OutlineInputBorder(),
                            ),
                            child: Text(
                              _scheduledTime != null
                                  ? _scheduledTime!.format(context)
                                  : 'Seleccionar',
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Crear Recepción',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _selectTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time != null) {
      setState(() => _scheduledTime = time);
    }
  }

  Future<void> _save() async {
    if (_supplierController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('El nombre del proveedor es requerido'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Get user's store ID
    final authState = ref.read(authStateProvider);
    final storeId = authState.user?.storeId;

    if (storeId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No se pudo obtener la tienda del usuario'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Build scheduled time if provided
    DateTime? scheduledTime;
    if (_scheduledTime != null) {
      final now = DateTime.now();
      scheduledTime = DateTime(
        now.year,
        now.month,
        now.day,
        _scheduledTime!.hour,
        _scheduledTime!.minute,
      );
    }

    // Call provider to create receiving
    final success = await ref.read(receivingProvider.notifier).createReceiving(
      storeId: storeId,
      supplierType: _selectedSupplierType,
      supplierName: _supplierController.text.trim(),
      poNumber: _poNumberController.text.isNotEmpty
          ? _poNumberController.text.trim()
          : null,
      driverName: _driverController.text.isNotEmpty
          ? _driverController.text.trim()
          : null,
      truckPlate: _plateController.text.isNotEmpty
          ? _plateController.text.trim()
          : null,
      itemCount: _itemCountController.text.isNotEmpty
          ? int.tryParse(_itemCountController.text)
          : null,
      scheduledTime: scheduledTime,
    );

    if (mounted) {
      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Recepción creada exitosamente'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al crear la recepción'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

class _SupplierTypeOption extends StatelessWidget {
  final String label;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  const _SupplierTypeOption({
    required this.label,
    required this.value,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: selected
              ? colorScheme.primary.withOpacity(0.1)
              : colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? colorScheme.primary : colorScheme.outlineVariant,
            width: selected ? 2 : 1,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
            color: selected ? colorScheme.primary : Theme.of(context).textTheme.bodyMedium?.color,
          ),
        ),
      ),
    );
  }
}
