import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';

/// Represents a selected media item (photo or video)
class MediaItem {
  final String id;
  final File? file;
  final String? url; // For existing media from server
  final bool isVideo;
  final bool isUploading;
  final bool uploadFailed;

  const MediaItem({
    required this.id,
    this.file,
    this.url,
    this.isVideo = false,
    this.isUploading = false,
    this.uploadFailed = false,
  });

  bool get isLocal => file != null;
  bool get isRemote => url != null;

  MediaItem copyWith({
    String? id,
    File? file,
    String? url,
    bool? isVideo,
    bool? isUploading,
    bool? uploadFailed,
  }) {
    return MediaItem(
      id: id ?? this.id,
      file: file ?? this.file,
      url: url ?? this.url,
      isVideo: isVideo ?? this.isVideo,
      isUploading: isUploading ?? this.isUploading,
      uploadFailed: uploadFailed ?? this.uploadFailed,
    );
  }
}

/// A widget for picking and displaying photos and videos
class MediaPickerWidget extends StatefulWidget {
  /// Current list of media items
  final List<MediaItem> mediaItems;

  /// Callback when media items change
  final void Function(List<MediaItem> items) onMediaChanged;

  /// Maximum number of photos allowed
  final int maxPhotos;

  /// Maximum number of videos allowed
  final int maxVideos;

  /// Maximum video duration in seconds
  final int maxVideoDurationSeconds;

  /// Whether to allow video capture
  final bool allowVideo;

  /// Whether the widget is in read-only mode
  final bool readOnly;

  /// Grid item size
  final double itemSize;

  const MediaPickerWidget({
    super.key,
    required this.mediaItems,
    required this.onMediaChanged,
    this.maxPhotos = 5,
    this.maxVideos = 2,
    this.maxVideoDurationSeconds = 30,
    this.allowVideo = true,
    this.readOnly = false,
    this.itemSize = 100,
  });

  @override
  State<MediaPickerWidget> createState() => _MediaPickerWidgetState();
}

class _MediaPickerWidgetState extends State<MediaPickerWidget> {
  final ImagePicker _picker = ImagePicker();

  int get _photoCount =>
      widget.mediaItems.where((m) => !m.isVideo).length;

  int get _videoCount =>
      widget.mediaItems.where((m) => m.isVideo).length;

  bool get _canAddPhoto => _photoCount < widget.maxPhotos;
  bool get _canAddVideo =>
      widget.allowVideo && _videoCount < widget.maxVideos;
  bool get _canAddMedia => _canAddPhoto || _canAddVideo;

  Future<void> _showMediaSourceDialog() async {
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
              if (_canAddPhoto) ...[
                ListTile(
                  leading: const Icon(Icons.camera_alt),
                  title: const Text('Tomar foto'),
                  onTap: () => Navigator.pop(context, 'photo_camera'),
                ),
                ListTile(
                  leading: const Icon(Icons.photo_library),
                  title: const Text('Seleccionar de galería'),
                  onTap: () => Navigator.pop(context, 'photo_gallery'),
                ),
              ],
              if (_canAddVideo) ...[
                ListTile(
                  leading: const Icon(Icons.videocam),
                  title: Text(
                    'Grabar video (máx ${widget.maxVideoDurationSeconds}s)',
                  ),
                  onTap: () => Navigator.pop(context, 'video_camera'),
                ),
                ListTile(
                  leading: const Icon(Icons.video_library),
                  title: const Text('Seleccionar video'),
                  onTap: () => Navigator.pop(context, 'video_gallery'),
                ),
              ],
            ],
          ),
        ),
      ),
    );

    if (result == null) return;

    switch (result) {
      case 'photo_camera':
        await _capturePhoto(ImageSource.camera);
        break;
      case 'photo_gallery':
        await _capturePhoto(ImageSource.gallery);
        break;
      case 'video_camera':
        await _captureVideo(ImageSource.camera);
        break;
      case 'video_gallery':
        await _captureVideo(ImageSource.gallery);
        break;
    }
  }

  Future<void> _capturePhoto(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1920,
        maxHeight: 1920,
      );

      if (image != null) {
        final newItem = MediaItem(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          file: File(image.path),
          isVideo: false,
        );
        widget.onMediaChanged([...widget.mediaItems, newItem]);
      }
    } catch (e) {
      debugPrint('Error capturing photo: $e');
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

  Future<void> _captureVideo(ImageSource source) async {
    try {
      final XFile? video = await _picker.pickVideo(
        source: source,
        maxDuration: Duration(seconds: widget.maxVideoDurationSeconds),
      );

      if (video != null) {
        final newItem = MediaItem(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          file: File(video.path),
          isVideo: true,
        );
        widget.onMediaChanged([...widget.mediaItems, newItem]);
      }
    } catch (e) {
      debugPrint('Error capturing video: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error al capturar el video'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _removeMedia(String id) {
    widget.onMediaChanged(
      widget.mediaItems.where((m) => m.id != id).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Header with counts
        Row(
          children: [
            const Icon(Icons.attach_file, size: 20),
            const SizedBox(width: 8),
            Text(
              'Archivos adjuntos',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.grey[700],
              ),
            ),
            const Spacer(),
            Text(
              'Fotos: $_photoCount/${widget.maxPhotos}',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[500],
              ),
            ),
            if (widget.allowVideo) ...[
              const SizedBox(width: 8),
              Text(
                'Videos: $_videoCount/${widget.maxVideos}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),

        // Media grid
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            // Existing media items
            ...widget.mediaItems.map(
              (item) => _MediaItemTile(
                item: item,
                size: widget.itemSize,
                readOnly: widget.readOnly,
                onRemove: () => _removeMedia(item.id),
              ),
            ),

            // Add button
            if (!widget.readOnly && _canAddMedia)
              _AddMediaButton(
                size: widget.itemSize,
                onTap: _showMediaSourceDialog,
              ),
          ],
        ),

        // Empty state
        if (widget.mediaItems.isEmpty && widget.readOnly)
          Container(
            padding: const EdgeInsets.all(24),
            child: Center(
              child: Text(
                'Sin archivos adjuntos',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Individual media item tile
class _MediaItemTile extends StatelessWidget {
  final MediaItem item;
  final double size;
  final bool readOnly;
  final VoidCallback onRemove;

  const _MediaItemTile({
    required this.item,
    required this.size,
    required this.readOnly,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Image/Video thumbnail
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(7),
            child: _buildContent(),
          ),
        ),

        // Video indicator
        if (item.isVideo)
          Positioned(
            bottom: 4,
            left: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.videocam, size: 12, color: Colors.white),
                  SizedBox(width: 2),
                  Text(
                    'Video',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Loading indicator
        if (item.isUploading)
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black38,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              ),
            ),
          ),

        // Error indicator
        if (item.uploadFailed)
          Positioned(
            top: 4,
            left: 4,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error,
                size: 12,
                color: Colors.white,
              ),
            ),
          ),

        // Remove button
        if (!readOnly && !item.isUploading)
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.black54,
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

  Widget _buildContent() {
    if (item.isLocal && item.file != null) {
      if (item.isVideo) {
        // Show video placeholder for local video
        return Container(
          color: Colors.grey[200],
          child: const Center(
            child: Icon(
              Icons.play_circle_outline,
              size: 40,
              color: Colors.grey,
            ),
          ),
        );
      }
      return Image.file(
        item.file!,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _buildPlaceholder(),
      );
    }

    if (item.isRemote && item.url != null) {
      return Image.network(
        item.url!,
        fit: BoxFit.cover,
        loadingBuilder: (_, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Center(
            child: CircularProgressIndicator(
              value: loadingProgress.expectedTotalBytes != null
                  ? loadingProgress.cumulativeBytesLoaded /
                      loadingProgress.expectedTotalBytes!
                  : null,
              strokeWidth: 2,
            ),
          );
        },
        errorBuilder: (_, __, ___) => _buildPlaceholder(),
      );
    }

    return _buildPlaceholder();
  }

  Widget _buildPlaceholder() {
    return Container(
      color: Colors.grey[200],
      child: Icon(
        item.isVideo ? Icons.videocam : Icons.image,
        color: Colors.grey[400],
      ),
    );
  }
}

/// Add media button
class _AddMediaButton extends StatelessWidget {
  final double size;
  final VoidCallback onTap;

  const _AddMediaButton({
    required this.size,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: Colors.grey[400]!,
            style: BorderStyle.solid,
          ),
          color: Colors.grey[50],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.add_photo_alternate,
              size: 32,
              color: Colors.grey[500],
            ),
            const SizedBox(height: 4),
            Text(
              'Agregar',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
