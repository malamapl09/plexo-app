import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/features/announcements/data/models/announcement_model.dart';
import 'package:plexo_ops/features/announcements/presentation/providers/announcements_provider.dart';
import 'package:intl/intl.dart';

class AnnouncementDetailPage extends ConsumerStatefulWidget {
  final AnnouncementModel announcement;

  const AnnouncementDetailPage({
    super.key,
    required this.announcement,
  });

  @override
  ConsumerState<AnnouncementDetailPage> createState() =>
      _AnnouncementDetailPageState();
}

class _AnnouncementDetailPageState
    extends ConsumerState<AnnouncementDetailPage> {
  bool _isAcknowledging = false;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    // Watch the provider to get updated acknowledgment status
    final state = ref.watch(announcementsProvider);
    final currentAnnouncement = state.announcements.firstWhere(
      (a) => a.id == widget.announcement.id,
      orElse: () => widget.announcement,
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Anuncio'),
        actions: [
          if (currentAnnouncement.attachmentUrls.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.attach_file),
              onPressed: () {
                _showAttachments(currentAnnouncement.attachmentUrls);
              },
              tooltip: 'Archivos adjuntos',
            ),
        ],
      ),
      body: Column(
        children: [
          // Scrollable content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header badges
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildTypeBadge(currentAnnouncement.type),
                      _buildPriorityBadge(currentAnnouncement.priority),
                      if (currentAnnouncement.requiresAck)
                        _buildAckBadge(currentAnnouncement.isAcknowledged),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Text(
                    currentAnnouncement.title,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).textTheme.titleLarge?.color,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Author and date
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundColor: colorScheme.primary.withValues(alpha: 0.1),
                        child: Text(
                          currentAnnouncement.createdBy.name[0].toUpperCase(),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: colorScheme.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            currentAnnouncement.createdBy.name,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            _formatDateTime(
                              currentAnnouncement.publishedAt ??
                                  currentAnnouncement.createdAt,
                            ),
                            style: TextStyle(
                              fontSize: 12,
                              color: Theme.of(context).textTheme.bodySmall?.color,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Divider
                  const Divider(),
                  const SizedBox(height: 16),

                  // Content
                  _buildContentSection(currentAnnouncement.content),

                  // Expiration notice
                  if (currentAnnouncement.expiresAt != null) ...[
                    const SizedBox(height: 24),
                    _buildExpirationNotice(currentAnnouncement.expiresAt!),
                  ],

                  // Image
                  if (currentAnnouncement.imageUrl != null) ...[
                    const SizedBox(height: 24),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        currentAnnouncement.imageUrl!,
                        fit: BoxFit.cover,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Container(
                            height: 200,
                            color: Theme.of(context).colorScheme.surfaceContainerHighest,
                            child: const Center(
                              child: CircularProgressIndicator(),
                            ),
                          );
                        },
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            height: 200,
                            color: Theme.of(context).colorScheme.surfaceContainerHighest,
                            child: Center(
                              child: Icon(
                                Icons.broken_image,
                                color: Theme.of(context).iconTheme.color?.withValues(alpha: 0.5),
                                size: 48,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],

                  // Bottom spacing for button
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),

          // Acknowledgment button (fixed at bottom)
          if (currentAnnouncement.requiresAck &&
              !currentAnnouncement.isAcknowledged)
            _buildAcknowledgmentButton(currentAnnouncement.id),
        ],
      ),
    );
  }

  Widget _buildTypeBadge(AnnouncementType type) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    Color bgColor;
    Color textColor;
    IconData icon;

    switch (type) {
      case AnnouncementType.emergency:
        bgColor = Colors.red.withValues(alpha: isDark ? 0.25 : 0.15);
        textColor = isDark ? Colors.red.shade300 : Colors.red.shade700;
        icon = Icons.warning;
        break;
      case AnnouncementType.systemAlert:
        bgColor = Colors.orange.withValues(alpha: isDark ? 0.25 : 0.15);
        textColor = isDark ? Colors.orange.shade300 : Colors.orange.shade700;
        icon = Icons.notifications_active;
        break;
      case AnnouncementType.operationalUpdate:
        bgColor = Colors.blue.withValues(alpha: isDark ? 0.25 : 0.15);
        textColor = isDark ? Colors.blue.shade300 : Colors.blue.shade700;
        icon = Icons.update;
        break;
      case AnnouncementType.policyUpdate:
        bgColor = Colors.purple.withValues(alpha: isDark ? 0.25 : 0.15);
        textColor = isDark ? Colors.purple.shade300 : Colors.purple.shade700;
        icon = Icons.policy;
        break;
      case AnnouncementType.training:
        bgColor = Colors.green.withValues(alpha: isDark ? 0.25 : 0.15);
        textColor = isDark ? Colors.green.shade300 : Colors.green.shade700;
        icon = Icons.school;
        break;
      case AnnouncementType.general:
      default:
        bgColor = Theme.of(context).colorScheme.surfaceContainerHighest;
        textColor = Theme.of(context).colorScheme.onSurfaceVariant;
        icon = Icons.info;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: textColor),
          const SizedBox(width: 6),
          Text(
            _getTypeLabel(type),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriorityBadge(Priority priority) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    Color bgColor;
    Color textColor;

    switch (priority) {
      case Priority.high:
        bgColor = Colors.red.withValues(alpha: isDark ? 0.25 : 0.15);
        textColor = isDark ? Colors.red.shade300 : Colors.red.shade700;
        break;
      case Priority.medium:
        bgColor = Colors.yellow.withValues(alpha: isDark ? 0.25 : 0.15);
        textColor = isDark ? Colors.amber.shade300 : Colors.yellow.shade900;
        break;
      case Priority.low:
      default:
        bgColor = Theme.of(context).colorScheme.surfaceContainerHighest;
        textColor = Theme.of(context).colorScheme.onSurfaceVariant;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        'Prioridad ${_getPriorityLabel(priority)}',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
    );
  }

  Widget _buildAckBadge(bool isAcknowledged) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isAcknowledged
            ? Colors.green.withValues(alpha: isDark ? 0.25 : 0.15)
            : Colors.orange.withValues(alpha: isDark ? 0.25 : 0.15),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isAcknowledged ? Icons.check_circle : Icons.pending,
            size: 16,
            color: isAcknowledged
                ? (isDark ? Colors.green.shade300 : Colors.green.shade700)
                : (isDark ? Colors.orange.shade300 : Colors.orange.shade700),
          ),
          const SizedBox(width: 6),
          Text(
            isAcknowledged ? 'Confirmado' : 'Requiere confirmacion',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isAcknowledged
                  ? (isDark ? Colors.green.shade300 : Colors.green.shade700)
                  : (isDark ? Colors.orange.shade300 : Colors.orange.shade700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContentSection(String content) {
    // Simple markdown-like rendering
    final lines = content.split('\n');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: lines.map((line) {
        if (line.startsWith('# ')) {
          return Padding(
            padding: const EdgeInsets.only(top: 16, bottom: 8),
            child: Text(
              line.substring(2),
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).textTheme.titleLarge?.color,
              ),
            ),
          );
        } else if (line.startsWith('## ')) {
          return Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 6),
            child: Text(
              line.substring(3),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).textTheme.titleMedium?.color,
              ),
            ),
          );
        } else if (line.startsWith('- ')) {
          return Padding(
            padding: const EdgeInsets.only(left: 8, top: 4, bottom: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('•  ', style: TextStyle(fontSize: 16)),
                Expanded(
                  child: _buildRichText(line.substring(2)),
                ),
              ],
            ),
          );
        } else if (RegExp(r'^\d+\. ').hasMatch(line)) {
          final match = RegExp(r'^(\d+)\. (.*)').firstMatch(line);
          if (match != null) {
            return Padding(
              padding: const EdgeInsets.only(left: 8, top: 4, bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${match.group(1)}.  ',
                    style: const TextStyle(fontSize: 16),
                  ),
                  Expanded(
                    child: _buildRichText(match.group(2)!),
                  ),
                ],
              ),
            );
          }
        } else if (line.trim().isEmpty) {
          return const SizedBox(height: 8);
        }

        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: _buildRichText(line),
        );
      }).toList(),
    );
  }

  Widget _buildRichText(String text) {
    // Handle bold and italic
    final spans = <TextSpan>[];
    final regex = RegExp(r'\*\*(.*?)\*\*|\*(.*?)\*');

    int lastEnd = 0;
    for (final match in regex.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(text: text.substring(lastEnd, match.start)));
      }

      if (match.group(1) != null) {
        // Bold text
        spans.add(TextSpan(
          text: match.group(1),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ));
      } else if (match.group(2) != null) {
        // Italic text
        spans.add(TextSpan(
          text: match.group(2),
          style: const TextStyle(fontStyle: FontStyle.italic),
        ));
      }

      lastEnd = match.end;
    }

    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd)));
    }

    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: 16,
          color: Theme.of(context).textTheme.bodyLarge?.color,
          height: 1.5,
        ),
        children: spans.isEmpty ? [TextSpan(text: text)] : spans,
      ),
    );
  }

  Widget _buildExpirationNotice(DateTime expiresAt) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isExpired = expiresAt.isBefore(DateTime.now());

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isExpired
            ? Colors.red.withValues(alpha: isDark ? 0.2 : 0.1)
            : Colors.orange.withValues(alpha: isDark ? 0.2 : 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isExpired
              ? Colors.red.withValues(alpha: isDark ? 0.4 : 0.3)
              : Colors.orange.withValues(alpha: isDark ? 0.4 : 0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            isExpired ? Icons.event_busy : Icons.schedule,
            color: isExpired
                ? (isDark ? Colors.red.shade300 : Colors.red.shade700)
                : (isDark ? Colors.orange.shade300 : Colors.orange.shade700),
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              isExpired
                  ? 'Este anuncio ha expirado'
                  : 'Expira: ${_formatDateTime(expiresAt)}',
              style: TextStyle(
                fontSize: 14,
                color: isExpired
                    ? (isDark ? Colors.red.shade300 : Colors.red.shade700)
                    : (isDark ? Colors.orange.shade300 : Colors.orange.shade700),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAcknowledgmentButton(String announcementId) {
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: EdgeInsets.fromLTRB(
        16,
        16,
        16,
        16 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.1),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _isAcknowledging ? null : () => _acknowledgeAnnouncement(announcementId),
          style: ElevatedButton.styleFrom(
            backgroundColor: colorScheme.primary,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          icon: _isAcknowledging
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Icon(Icons.check_circle_outline),
          label: Text(
            _isAcknowledging ? 'Confirmando...' : 'Confirmar lectura',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _acknowledgeAnnouncement(String announcementId) async {
    setState(() {
      _isAcknowledging = true;
    });

    final success = await ref
        .read(announcementsProvider.notifier)
        .acknowledgeAnnouncement(announcementId);

    setState(() {
      _isAcknowledging = false;
    });

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Lectura confirmada'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _showAttachments(List<String> attachmentUrls) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Archivos adjuntos',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...attachmentUrls.map(
              (url) => ListTile(
                leading: const Icon(Icons.attach_file),
                title: Text(
                  url.split('/').last,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: const Icon(Icons.download),
                onTap: () {
                  // TODO: Implement file download
                  Navigator.pop(context);
                },
              ),
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom),
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime date) {
    return DateFormat('d MMMM yyyy, HH:mm', 'es').format(date);
  }

  String _getTypeLabel(AnnouncementType type) {
    switch (type) {
      case AnnouncementType.emergency:
        return 'Emergencia';
      case AnnouncementType.systemAlert:
        return 'Alerta del Sistema';
      case AnnouncementType.operationalUpdate:
        return 'Actualizacion Operativa';
      case AnnouncementType.policyUpdate:
        return 'Actualizacion de Politica';
      case AnnouncementType.training:
        return 'Capacitacion';
      case AnnouncementType.general:
        return 'General';
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
