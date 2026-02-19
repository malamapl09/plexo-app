import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/checklists/data/models/checklist_model.dart';

/// Tile widget representing a single checklist item with checkbox, photo, and notes support.
class ChecklistItemTile extends StatefulWidget {
  final ChecklistItem item;
  final ChecklistResponse? response;
  final bool isCompleted;
  final bool readOnly;
  final void Function(bool isCompleted) onToggle;
  final void Function(List<String> photoUrls) onPhotosChanged;
  final void Function(String? notes) onNotesChanged;

  const ChecklistItemTile({
    super.key,
    required this.item,
    this.response,
    required this.isCompleted,
    this.readOnly = false,
    required this.onToggle,
    required this.onPhotosChanged,
    required this.onNotesChanged,
  });

  @override
  State<ChecklistItemTile> createState() => _ChecklistItemTileState();
}

class _ChecklistItemTileState extends State<ChecklistItemTile> {
  late TextEditingController _notesController;
  bool _isExpanded = false;
  final ImagePicker _picker = ImagePicker();
  List<String> _localPhotoPaths = [];

  @override
  void initState() {
    super.initState();
    _notesController =
        TextEditingController(text: widget.response?.notes ?? '');
    _isExpanded = widget.isCompleted &&
        (widget.item.requiresPhoto || widget.item.requiresNote);
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant ChecklistItemTile oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.response?.notes != widget.response?.notes) {
      _notesController.text = widget.response?.notes ?? '';
    }
  }

  Future<void> _takePhoto() async {
    try {
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

      final source =
          result == 'camera' ? ImageSource.camera : ImageSource.gallery;
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1920,
        maxHeight: 1920,
      );

      if (image != null && mounted) {
        setState(() {
          _localPhotoPaths = [..._localPhotoPaths, image.path];
        });
        // In a full implementation, photos would be uploaded via MediaUploadService
        // and the returned URLs would be sent. For now we pass local paths as
        // placeholders -- the detail page handles upload before responding.
        widget.onPhotosChanged(_localPhotoPaths);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al capturar la foto'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasPhotoReq = widget.item.requiresPhoto;
    final hasNoteReq = widget.item.requiresNote;
    final showExpandedContent =
        (hasPhotoReq || hasNoteReq) && (widget.isCompleted || _isExpanded);

    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: widget.isCompleted
            ? AppColors.success.withOpacity(0.04)
            : colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: widget.isCompleted
              ? AppColors.success.withOpacity(0.3)
              : colorScheme.outlineVariant,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Main row: checkbox + title + action icons
          InkWell(
            onTap: widget.readOnly
                ? null
                : () {
                    widget.onToggle(!widget.isCompleted);
                    if (!widget.isCompleted && (hasPhotoReq || hasNoteReq)) {
                      setState(() => _isExpanded = true);
                    }
                  },
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Checkbox
                  SizedBox(
                    width: 24,
                    height: 24,
                    child: Checkbox(
                      value: widget.isCompleted,
                      onChanged: widget.readOnly
                          ? null
                          : (value) {
                              widget.onToggle(value ?? false);
                              if (value == true &&
                                  (hasPhotoReq || hasNoteReq)) {
                                setState(() => _isExpanded = true);
                              }
                            },
                      activeColor: AppColors.success,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Title and description
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.item.title,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            color: widget.isCompleted
                                ? Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.color
                                    ?.withOpacity(0.5)
                                : Theme.of(context).textTheme.bodyLarge?.color,
                            decoration: widget.isCompleted
                                ? TextDecoration.lineThrough
                                : null,
                          ),
                        ),
                        if (widget.item.description != null &&
                            widget.item.description!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            widget.item.description!,
                            style: TextStyle(
                              fontSize: 13,
                              color: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.color
                                  ?.withOpacity(0.6),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Requirement indicators
                  if (hasPhotoReq)
                    Padding(
                      padding: const EdgeInsets.only(left: 4),
                      child: Icon(
                        Icons.camera_alt_outlined,
                        size: 18,
                        color: widget.isCompleted &&
                                (_localPhotoPaths.isNotEmpty ||
                                    (widget.response?.photoUrls.isNotEmpty ??
                                        false))
                            ? AppColors.success
                            : colorScheme.onSurfaceVariant,
                      ),
                    ),
                  if (hasNoteReq)
                    Padding(
                      padding: const EdgeInsets.only(left: 4),
                      child: Icon(
                        Icons.note_outlined,
                        size: 18,
                        color: widget.isCompleted &&
                                (_notesController.text.isNotEmpty ||
                                    (widget.response?.notes?.isNotEmpty ??
                                        false))
                            ? AppColors.success
                            : colorScheme.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Expanded content: photo and notes
          if (showExpandedContent) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Photo section
                  if (hasPhotoReq) ...[
                    Row(
                      children: [
                        Icon(Icons.camera_alt,
                            size: 16, color: colorScheme.onSurfaceVariant),
                        const SizedBox(width: 6),
                        Text(
                          'Foto requerida',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Photo thumbnails
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        // Existing remote photos
                        if (widget.response != null)
                          ...widget.response!.photoUrls.map(
                            (url) => ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                url,
                                width: 64,
                                height: 64,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  width: 64,
                                  height: 64,
                                  color: colorScheme.surfaceContainerHighest,
                                  child: Icon(Icons.broken_image,
                                      size: 24, color: colorScheme.onSurfaceVariant),
                                ),
                              ),
                            ),
                          ),

                        // Local photos
                        ..._localPhotoPaths.map(
                          (path) => ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.file(
                              File(path),
                              width: 64,
                              height: 64,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),

                        // Add photo button
                        if (!widget.readOnly)
                          GestureDetector(
                            onTap: _takePhoto,
                            child: Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: colorScheme.outlineVariant,
                                  style: BorderStyle.solid,
                                ),
                                color: colorScheme.surfaceContainerLow,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.add_a_photo,
                                      size: 20, color: colorScheme.onSurfaceVariant),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Foto',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                    if (hasNoteReq) const SizedBox(height: 12),
                  ],

                  // Notes section
                  if (hasNoteReq) ...[
                    Row(
                      children: [
                        Icon(Icons.note,
                            size: 16, color: colorScheme.onSurfaceVariant),
                        const SizedBox(width: 6),
                        Text(
                          'Nota requerida',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _notesController,
                      readOnly: widget.readOnly,
                      maxLines: 2,
                      style: const TextStyle(fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Agregar nota...',
                        hintStyle: TextStyle(
                          fontSize: 14,
                          color: colorScheme.onSurfaceVariant.withOpacity(0.5),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: colorScheme.outlineVariant),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: colorScheme.outlineVariant),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide:
                              BorderSide(color: colorScheme.primary),
                        ),
                      ),
                      onChanged: (value) {
                        widget.onNotesChanged(value.isEmpty ? null : value);
                      },
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
