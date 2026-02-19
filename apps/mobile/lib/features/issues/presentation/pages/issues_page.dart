import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:plexo_ops/features/issues/data/models/issue_model.dart';
import 'package:plexo_ops/features/issues/presentation/providers/issues_provider.dart';
import 'package:plexo_ops/features/issues/presentation/widgets/issue_stats_header.dart';
import 'package:plexo_ops/features/issues/presentation/widgets/issue_card.dart';
import 'package:plexo_ops/features/issues/presentation/widgets/issue_filter_chips.dart';
import 'package:plexo_ops/features/issues/presentation/widgets/issue_category_selector.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';
import 'package:plexo_ops/core/services/media_upload_service.dart';

class IssuesPage extends ConsumerStatefulWidget {
  const IssuesPage({super.key});

  @override
  ConsumerState<IssuesPage> createState() => _IssuesPageState();
}

class _IssuesPageState extends ConsumerState<IssuesPage> {
  @override
  void initState() {
    super.initState();
    // Load issues when page initializes
    Future.microtask(() {
      final storeId = ref.read(authStateProvider).user?.storeId;
      // Load all issues for HQ/admin users (null storeId), or filter by store
      ref.read(issuesProvider.notifier).loadIssues(storeId: storeId);
    });
  }

  void _onViewModeChanged(IssueViewMode mode) {
    final notifier = ref.read(issuesProvider.notifier);
    final storeId = ref.read(authStateProvider).user?.storeId;
    switch (mode) {
      case IssueViewMode.all:
        notifier.loadIssues(storeId: storeId);
        break;
      case IssueViewMode.myReports:
        notifier.loadMyIssues();
        break;
      case IssueViewMode.assignedToMe:
        notifier.loadAssignedIssues();
        break;
    }
  }

  Future<void> _onRefresh() async {
    final notifier = ref.read(issuesProvider.notifier);
    final storeId = ref.read(authStateProvider).user?.storeId;
    final viewMode = ref.read(issuesProvider).viewMode;
    switch (viewMode) {
      case IssueViewMode.all:
        await notifier.loadIssues(storeId: storeId);
        break;
      case IssueViewMode.myReports:
        await notifier.loadMyIssues();
        break;
      case IssueViewMode.assignedToMe:
        await notifier.loadAssignedIssues();
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(issuesProvider);

    return Scaffold(
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? _buildErrorState(state.error!)
              : RefreshIndicator(
                  onRefresh: _onRefresh,
                  child: CustomScrollView(
                    slivers: [
                      // View mode selector
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                          child: SegmentedButton<IssueViewMode>(
                            segments: const [
                              ButtonSegment(
                                value: IssueViewMode.all,
                                label: Text('Todas'),
                                icon: Icon(Icons.list, size: 18),
                              ),
                              ButtonSegment(
                                value: IssueViewMode.myReports,
                                label: Text('Mis Reportes'),
                                icon: Icon(Icons.edit_note, size: 18),
                              ),
                              ButtonSegment(
                                value: IssueViewMode.assignedToMe,
                                label: Text('Asignadas'),
                                icon: Icon(Icons.assignment_ind, size: 18),
                              ),
                            ],
                            selected: {state.viewMode},
                            onSelectionChanged: (selection) {
                              _onViewModeChanged(selection.first);
                            },
                            showSelectedIcon: false,
                            style: ButtonStyle(
                              visualDensity: VisualDensity.compact,
                              textStyle: WidgetStatePropertyAll(
                                Theme.of(context).textTheme.labelSmall,
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Stats header (only for "all" view)
                      if (state.stats != null && state.viewMode == IssueViewMode.all)
                        SliverToBoxAdapter(
                          child: IssueStatsHeader(stats: state.stats!),
                        ),

                      // Filters
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: IssueFilterChips(
                            selectedStatus: state.statusFilter,
                            selectedCategory: state.categoryFilter,
                            onStatusSelected: (status) {
                              ref
                                  .read(issuesProvider.notifier)
                                  .setStatusFilter(status);
                            },
                            onCategorySelected: (category) {
                              ref
                                  .read(issuesProvider.notifier)
                                  .setCategoryFilter(category);
                            },
                          ),
                        ),
                      ),

                      // Issues list
                      if (state.filteredIssues.isEmpty)
                        SliverFillRemaining(
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.check_circle_outline,
                                  size: 64,
                                  color: Theme.of(context).iconTheme.color?.withOpacity(0.5),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  state.viewMode == IssueViewMode.assignedToMe
                                      ? 'No tienes incidencias asignadas'
                                      : state.viewMode == IssueViewMode.myReports
                                          ? 'No has reportado incidencias'
                                          : 'No hay incidencias',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final issue = state.filteredIssues[index];
                              return IssueCard(
                                issue: issue,
                                onTap: () => _showIssueDetail(context, issue),
                              );
                            },
                            childCount: state.filteredIssues.length,
                          ),
                        ),

                      // Bottom padding
                      const SliverToBoxAdapter(
                        child: SizedBox(height: 100),
                      ),
                    ],
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showQuickReportSheet(context),
        icon: const Icon(Icons.add),
        label: const Text('Reportar'),
      ),
    );
  }

  Widget _buildErrorState(String error) {
    final errorColor = Theme.of(context).colorScheme.error;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: errorColor,
          ),
          const SizedBox(height: 16),
          Text(
            error,
            style: TextStyle(color: errorColor),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _onRefresh,
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }

  void _showQuickReportSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _QuickReportSheet(),
    );
  }

  void _showIssueDetail(BuildContext context, IssueModel issue) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _IssueDetailSheet(issue: issue),
    );
  }
}

// Quick Report Sheet - Target: < 30 seconds to report
class _QuickReportSheet extends ConsumerStatefulWidget {
  const _QuickReportSheet();

  @override
  ConsumerState<_QuickReportSheet> createState() => _QuickReportSheetState();
}

class _QuickReportSheetState extends ConsumerState<_QuickReportSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _imagePicker = ImagePicker();
  final List<File> _selectedPhotos = [];

  IssueCategory? _selectedCategory;
  Priority _selectedPriority = Priority.medium;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
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
          _selectedPhotos.add(File(pickedFile.path));
        });
      }
    } catch (e) {
      // ignore: avoid_print
      print('Error picking image: $e');
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
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
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
                  color: colorScheme.outlineVariant,
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
                        'Reportar Incidencia',
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
                        onPressed: _canSubmit ? _submitReport : null,
                        child: const Text(
                          'Enviar',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              const Divider(height: 1),

              // Form content
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Category selector
                        const Text(
                          'Tipo de incidencia',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 12),
                        IssueCategorySelector(
                          selectedCategory: _selectedCategory,
                          onCategorySelected: (category) {
                            setState(() {
                              _selectedCategory = category;
                            });
                          },
                        ),

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
                        TextFormField(
                          controller: _titleController,
                          decoration: const InputDecoration(
                            hintText: 'Ej: Aire acondicionado no funciona',
                            border: OutlineInputBorder(),
                          ),
                          maxLength: 100,
                          textInputAction: TextInputAction.next,
                          onChanged: (_) => setState(() {}),
                          validator: (value) {
                            if (value == null || value.length < 5) {
                              return 'El titulo debe tener al menos 5 caracteres';
                            }
                            return null;
                          },
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
                        TextFormField(
                          controller: _descriptionController,
                          decoration: const InputDecoration(
                            hintText:
                                'Describe el problema con detalle. Incluye ubicacion si es relevante.',
                            border: OutlineInputBorder(),
                            alignLabelWithHint: true,
                          ),
                          maxLines: 4,
                          maxLength: 1000,
                          onChanged: (_) => setState(() {}),
                          validator: (value) {
                            if (value == null || value.length < 10) {
                              return 'La descripcion debe tener al menos 10 caracteres';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 16),

                        // Priority
                        const Text(
                          'Prioridad',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 8),
                        _buildPrioritySelector(),

                        const SizedBox(height: 24),

                        // Photo section
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Fotos',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
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
                        if (_selectedPhotos.isEmpty)
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
                                  Icon(
                                    Icons.photo_camera,
                                    size: 32,
                                    color: Theme.of(context).iconTheme.color?.withOpacity(0.5),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Sin fotos',
                                    style: TextStyle(
                                      color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.5),
                                      fontSize: 12,
                                    ),
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
                              itemCount: _selectedPhotos.length,
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
                                          image: FileImage(_selectedPhotos[index]),
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      top: 4,
                                      right: 12,
                                      child: GestureDetector(
                                        onTap: () {
                                          setState(() => _selectedPhotos.removeAt(index));
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

                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildPrioritySelector() {
    return Row(
      children: Priority.values.map((priority) {
        final isSelected = priority == _selectedPriority;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              right: priority != Priority.high ? 8 : 0,
            ),
            child: InkWell(
              onTap: () {
                setState(() {
                  _selectedPriority = priority;
                });
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? _getPriorityColor(priority).withOpacity(0.15)
                      : Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSelected
                        ? _getPriorityColor(priority)
                        : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      _getPriorityIcon(priority),
                      color: isSelected
                          ? _getPriorityColor(priority)
                          : Theme.of(context).colorScheme.onSurfaceVariant,
                      size: 24,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _getPriorityLabel(priority),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.w500,
                        color: isSelected
                            ? _getPriorityColor(priority)
                            : Theme.of(context).colorScheme.onSurfaceVariant,
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

  bool get _canSubmit {
    return _selectedCategory != null &&
        _titleController.text.length >= 5 &&
        _descriptionController.text.length >= 10 &&
        !_isSubmitting;
  }

  Future<void> _submitReport() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor selecciona un tipo de incidencia'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      // Get storeId from user context
      final storeId = ref.read(authStateProvider).user?.storeId;
      if (storeId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No tienes una tienda asignada. Contacta al administrador.'),
            backgroundColor: Colors.red,
          ),
        );
        setState(() => _isSubmitting = false);
        return;
      }

      // Upload photos
      final mediaService = ref.read(mediaUploadServiceProvider);
      final photoUrls = _selectedPhotos.isNotEmpty
          ? await mediaService.uploadPhotos(_selectedPhotos)
          : <String>[];

      final request = CreateIssueRequest(
        storeId: storeId,
        category: _selectedCategory!,
        priority: _selectedPriority,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        photoUrls: photoUrls,
      );

      final success =
          await ref.read(issuesProvider.notifier).createIssue(request);

      if (mounted) {
        if (success) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Incidencia reportada exitosamente'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Error al reportar incidencia'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  Color _getPriorityColor(Priority priority) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    switch (priority) {
      case Priority.low:
        return Colors.grey;
      case Priority.medium:
        return isDark ? Colors.amber.shade300 : Colors.amber.shade700;
      case Priority.high:
        return Colors.red;
    }
  }

  IconData _getPriorityIcon(Priority priority) {
    switch (priority) {
      case Priority.low:
        return Icons.keyboard_arrow_down;
      case Priority.medium:
        return Icons.remove;
      case Priority.high:
        return Icons.keyboard_arrow_up;
    }
  }

  String _getPriorityLabel(Priority priority) {
    switch (priority) {
      case Priority.low:
        return 'Baja';
      case Priority.medium:
        return 'Media';
      case Priority.high:
        return 'Alta';
    }
  }
}

// Issue Detail Sheet
class _IssueDetailSheet extends ConsumerWidget {
  final IssueModel issue;

  const _IssueDetailSheet({required this.issue});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.7,
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
                  color: colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header with category icon
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: _getCategoryColor(issue.category)
                                  .withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              _getCategoryIcon(issue.category),
                              color: _getCategoryColor(issue.category),
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  issue.categoryLabel,
                                  style: TextStyle(
                                    color: _getCategoryColor(issue.category),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                                if (issue.isEscalated)
                                  Builder(builder: (context) {
                                    final isDark = Theme.of(context).brightness == Brightness.dark;
                                    final escalationColor = isDark ? Colors.red.shade300 : Colors.red.shade700;
                                    return Container(
                                      margin: const EdgeInsets.only(top: 4),
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: Colors.red.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.warning_amber_rounded,
                                            size: 14,
                                            color: escalationColor,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            'ESCALADA',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: escalationColor,
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                  }),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Title
                      Text(
                        issue.title,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 8),

                      // Status and priority row
                      Row(
                        children: [
                          _buildChip(
                            label: issue.statusLabel,
                            color: _getStatusColor(issue.status),
                          ),
                          const SizedBox(width: 8),
                          _buildChip(
                            label: 'Prioridad ${issue.priorityLabel}',
                            color: _getPriorityColorForContext(context, issue.priority),
                            outlined: true,
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),

                      // Description
                      Text(
                        'Descripcion',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                          color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        issue.description,
                        style: const TextStyle(
                          fontSize: 15,
                          height: 1.5,
                        ),
                      ),

                      // Photos
                      if (issue.photoUrls.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Text(
                          'Fotos (${issue.photoUrls.length})',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        SizedBox(
                          height: 100,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: issue.photoUrls.length,
                            itemBuilder: (context, index) => Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  issue.photoUrls[index],
                                  width: 100,
                                  height: 100,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    width: 100,
                                    height: 100,
                                    color: colorScheme.surfaceContainerHighest,
                                    child: const Icon(Icons.broken_image),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 24),

                      // Info cards
                      _buildInfoRow(context,
                        icon: Icons.person_outline,
                        label: 'Reportado por',
                        value: issue.reportedBy.name,
                      ),
                      if (issue.assignedTo != null)
                        _buildInfoRow(context,
                          icon: Icons.assignment_ind_outlined,
                          label: 'Asignado a',
                          value: issue.assignedTo!.name,
                        ),
                      _buildInfoRow(context,
                        icon: Icons.access_time,
                        label: 'Reportado',
                        value: _formatDateTime(issue.createdAt),
                      ),
                      if (issue.resolvedAt != null)
                        _buildInfoRow(context,
                          icon: Icons.check_circle_outline,
                          label: 'Resuelto',
                          value: _formatDateTime(issue.resolvedAt!),
                        ),

                      // Resolution notes
                      if (issue.resolutionNotes != null) ...[
                        const SizedBox(height: 24),
                        Builder(builder: (context) {
                          final isDark = Theme.of(context).brightness == Brightness.dark;
                          final resolutionColor = isDark ? Colors.green.shade300 : Colors.green.shade700;
                          return Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.green.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.check_circle,
                                      color: resolutionColor,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Resolucion',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: resolutionColor,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  issue.resolutionNotes!,
                                  style: TextStyle(
                                    color: resolutionColor,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],

                      const SizedBox(height: 24),

                      // Action buttons
                      if (issue.canRecategorize)
                        Builder(builder: (context) {
                          final isDark = Theme.of(context).brightness == Brightness.dark;
                          final amberColor = isDark ? Colors.amber.shade300 : Colors.amber.shade700;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  _showRecategorizeDialog(context, ref, issue);
                                },
                                icon: const Icon(Icons.category_outlined),
                                label: const Text('Cambiar Categoria'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: amberColor,
                                  side: BorderSide(color: amberColor),
                                ),
                              ),
                            ),
                          );
                        }),

                      if (issue.canStart)
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              await ref
                                  .read(issuesProvider.notifier)
                                  .startProgress(issue.id);
                              if (context.mounted) {
                                Navigator.pop(context);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Trabajo iniciado'),
                                    backgroundColor: Colors.blue,
                                  ),
                                );
                              }
                            },
                            icon: const Icon(Icons.play_arrow),
                            label: const Text('Iniciar Trabajo'),
                          ),
                        ),

                      if (issue.canResolve)
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              _showResolveDialog(context, ref, issue.id);
                            },
                            icon: const Icon(Icons.check),
                            label: const Text('Marcar como Resuelto'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                            ),
                          ),
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

  Widget _buildChip({
    required String label,
    required Color color,
    bool outlined = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: outlined ? Colors.transparent : color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
    );
  }

  Widget _buildInfoRow(BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Theme.of(context).iconTheme.color?.withOpacity(0.6)),
          const SizedBox(width: 12),
          Text(
            '$label: ',
            style: TextStyle(
              color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  void _showRecategorizeDialog(BuildContext context, WidgetRef ref, IssueModel issue) {
    IssueCategory? selectedCategory;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Cambiar Categoria'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('La incidencia sera reasignada automaticamente.'),
              const SizedBox(height: 16),
              IssueCategorySelector(
                selectedCategory: selectedCategory,
                excludeCategory: issue.category,
                onCategorySelected: (category) {
                  setDialogState(() {
                    selectedCategory = category;
                  });
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: selectedCategory == null
                  ? null
                  : () async {
                      final success = await ref
                          .read(issuesProvider.notifier)
                          .recategorizeIssue(issue.id, selectedCategory!);

                      if (context.mounted) {
                        Navigator.pop(context); // Close dialog
                        Navigator.pop(context); // Close detail sheet
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(success
                                ? 'Incidencia recategorizada'
                                : 'Error al recategorizar'),
                            backgroundColor: success ? Colors.green : Colors.red,
                          ),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).brightness == Brightness.dark
                    ? Colors.amber.shade300
                    : Colors.amber.shade700,
              ),
              child: const Text('Recategorizar'),
            ),
          ],
        ),
      ),
    );
  }

  void _showResolveDialog(BuildContext context, WidgetRef ref, String issueId) {
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Resolver Incidencia'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Describe como se resolvio el problema:'),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              decoration: const InputDecoration(
                hintText: 'Notas de resolucion...',
                border: OutlineInputBorder(),
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
          ElevatedButton(
            onPressed: () async {
              if (notesController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Por favor ingresa las notas de resolucion'),
                    backgroundColor: Colors.orange,
                  ),
                );
                return;
              }

              await ref
                  .read(issuesProvider.notifier)
                  .resolveIssue(issueId, notesController.text.trim());

              if (context.mounted) {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Close detail sheet
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Incidencia resuelta'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
            ),
            child: const Text('Resolver'),
          ),
        ],
      ),
    );
  }

  Color _getCategoryColor(IssueCategory category) {
    switch (category) {
      case IssueCategory.maintenance:
        return Colors.orange;
      case IssueCategory.cleaning:
        return Colors.teal;
      case IssueCategory.security:
        return Colors.red;
      case IssueCategory.itSystems:
        return Colors.blue;
      case IssueCategory.personnel:
        return Colors.purple;
      case IssueCategory.inventory:
        return Colors.indigo;
    }
  }

  IconData _getCategoryIcon(IssueCategory category) {
    switch (category) {
      case IssueCategory.maintenance:
        return Icons.build_rounded;
      case IssueCategory.cleaning:
        return Icons.cleaning_services_rounded;
      case IssueCategory.security:
        return Icons.security_rounded;
      case IssueCategory.itSystems:
        return Icons.computer_rounded;
      case IssueCategory.personnel:
        return Icons.people_rounded;
      case IssueCategory.inventory:
        return Icons.inventory_2_rounded;
    }
  }

  Color _getStatusColor(IssueStatus status) {
    switch (status) {
      case IssueStatus.reported:
        return Colors.orange;
      case IssueStatus.assigned:
        return Colors.blue;
      case IssueStatus.inProgress:
        return Colors.indigo;
      case IssueStatus.resolved:
        return Colors.green;
      case IssueStatus.pendingVerification:
        return Colors.amber;
      case IssueStatus.verified:
        return Colors.teal;
      case IssueStatus.rejected:
        return Colors.red;
    }
  }

  Color _getPriorityColorForContext(BuildContext context, Priority priority) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    switch (priority) {
      case Priority.low:
        return Colors.grey;
      case Priority.medium:
        return isDark ? Colors.amber.shade300 : Colors.amber.shade700;
      case Priority.high:
        return Colors.red;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) {
      return 'Hoy ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (difference.inDays == 1) {
      return 'Ayer ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }
}
