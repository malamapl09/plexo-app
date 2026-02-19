import 'package:flutter/material.dart';
import 'package:plexo_ops/features/store_audits/data/models/store_audit_model.dart';

/// Compact card rendering an [AuditFinding] with severity indicator,
/// description, photo count, and corrective action status.
class FindingCard extends StatelessWidget {
  final AuditFinding finding;
  final VoidCallback? onTap;

  const FindingCard({
    super.key,
    required this.finding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Severity + Title row
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _severityColor(finding.severity).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _severityIcon(finding.severity),
                      color: _severityColor(finding.severity),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          finding.title,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          finding.description,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.textTheme.bodySmall?.color
                                ?.withOpacity(0.7),
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Bottom row: severity badge, status, photo count
              Row(
                children: [
                  _buildChip(
                    context,
                    label: finding.severityLabel,
                    color: _severityColor(finding.severity),
                  ),
                  const SizedBox(width: 8),
                  _buildChip(
                    context,
                    label: finding.statusLabel,
                    color: _findingStatusColor(finding.status),
                    outlined: true,
                  ),
                  const Spacer(),
                  if (finding.photoUrls.isNotEmpty)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.photo_camera_outlined,
                          size: 14,
                          color: theme.textTheme.bodySmall?.color,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${finding.photoUrls.length}',
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ),
                ],
              ),

              // Corrective action indicator
              if (finding.correctiveAction != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest
                        .withOpacity(0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.assignment_outlined,
                        size: 14,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Accion correctiva: ${finding.correctiveAction!.statusLabel} - ${finding.correctiveAction!.assignedTo.name}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.primary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChip(
    BuildContext context, {
    required String label,
    required Color color,
    bool outlined = false,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: outlined ? Colors.transparent : color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
        border: outlined ? Border.all(color: color.withOpacity(0.5)) : null,
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  Color _severityColor(FindingSeverity severity) {
    switch (severity) {
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

  IconData _severityIcon(FindingSeverity severity) {
    switch (severity) {
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

  Color _findingStatusColor(FindingStatus status) {
    switch (status) {
      case FindingStatus.open:
        return Colors.orange;
      case FindingStatus.inProgress:
        return Colors.blue;
      case FindingStatus.resolved:
        return Colors.green;
      case FindingStatus.closed:
        return Colors.grey;
    }
  }
}
