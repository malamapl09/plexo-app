import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/receiving/data/models/receiving_model.dart';

class ReceivingCard extends StatelessWidget {
  final ReceivingModel receiving;
  final VoidCallback onTap;
  final VoidCallback? onStart;
  final VoidCallback? onComplete;

  const ReceivingCard({
    super.key,
    required this.receiving,
    required this.onTap,
    this.onStart,
    this.onComplete,
  });

  Color statusColorFor(BuildContext context) {
    switch (receiving.status) {
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

  IconData get statusIcon {
    switch (receiving.status) {
      case ReceivingStatus.pending:
        return Icons.pending_actions;
      case ReceivingStatus.inProgress:
        return Icons.sync;
      case ReceivingStatus.completed:
        return Icons.check_circle;
      case ReceivingStatus.withIssue:
        return Icons.warning;
      case ReceivingStatus.didNotArrive:
        return Icons.cancel;
    }
  }

  @override
  Widget build(BuildContext context) {
    final timeFormat = DateFormat('h:mm a');
    final statusColor = statusColorFor(context);
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Card(
      elevation: receiving.isCompleted ? 0 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: receiving.isCompleted
            ? BorderSide(color: statusColor.withOpacity(0.3))
            : BorderSide.none,
      ),
      color: receiving.isCompleted ? statusColor.withOpacity(isDark ? 0.1 : 0.05) : null,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  // Status indicator
                  Container(
                    width: 4,
                    height: 50,
                    decoration: BoxDecoration(
                      color: statusColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Supplier info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          receiving.supplierName,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: receiving.isCompleted
                                ? Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6)
                                : Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              receiving.supplierType ==
                                      SupplierType.distributionCenter
                                  ? Icons.warehouse
                                  : Icons.business,
                              size: 14,
                              color: Theme.of(context).iconTheme.color?.withOpacity(0.5),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              receiving.supplierTypeLabel,
                              style: TextStyle(
                                fontSize: 13,
                                color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                              ),
                            ),
                            if (receiving.poNumber != null && receiving.poNumber!.isNotEmpty) ...[
                              const SizedBox(width: 12),
                              Icon(
                                Icons.receipt_long,
                                size: 14,
                                color: colorScheme.primary.withOpacity(0.7),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                receiving.poNumber!,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: colorScheme.primary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Status badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(isDark ? 0.2 : 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(statusIcon, size: 14, color: statusColor),
                        const SizedBox(width: 4),
                        Text(
                          receiving.statusLabel,
                          style: TextStyle(
                            fontSize: 11,
                            color: statusColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Info row
              Row(
                children: [
                  // Time info
                  if (receiving.scheduledTime != null) ...[
                    Icon(Icons.schedule,
                        size: 14, color: Theme.of(context).iconTheme.color?.withOpacity(0.5)),
                    const SizedBox(width: 4),
                    Text(
                      timeFormat.format(receiving.scheduledTime!),
                      style: TextStyle(
                        fontSize: 13,
                        color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(width: 16),
                  ],

                  // Driver info
                  if (receiving.driverName != null) ...[
                    Icon(Icons.person, size: 14, color: Theme.of(context).iconTheme.color?.withOpacity(0.5)),
                    const SizedBox(width: 4),
                    Text(
                      receiving.driverName!,
                      style: TextStyle(
                        fontSize: 13,
                        color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(width: 16),
                  ],

                  // Item count
                  if (receiving.itemCount != null) ...[
                    Icon(Icons.inventory_2,
                        size: 14, color: Theme.of(context).iconTheme.color?.withOpacity(0.5)),
                    const SizedBox(width: 4),
                    Text(
                      '${receiving.itemCount} items',
                      style: TextStyle(
                        fontSize: 13,
                        color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                      ),
                    ),
                  ],

                  const Spacer(),

                  // Discrepancy indicator
                  if (receiving.discrepancyCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(isDark ? 0.2 : 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.warning,
                              size: 12, color: AppColors.error),
                          const SizedBox(width: 4),
                          Text(
                            '${receiving.discrepancyCount}',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppColors.error,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),

              // Action buttons
              if (onStart != null || onComplete != null) ...[
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (onStart != null)
                      TextButton.icon(
                        onPressed: onStart,
                        icon: const Icon(Icons.play_arrow, size: 18),
                        label: const Text('Iniciar'),
                        style: TextButton.styleFrom(
                          foregroundColor: colorScheme.primary,
                        ),
                      ),
                    if (onComplete != null)
                      ElevatedButton.icon(
                        onPressed: onComplete,
                        icon: const Icon(Icons.check, size: 18),
                        label: const Text('Completar'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.success,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
