import 'package:flutter/material.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/receiving/data/models/receiving_model.dart';

class ReceivingFilterChips extends StatelessWidget {
  final ReceivingStatus? selectedStatus;
  final ValueChanged<ReceivingStatus?> onStatusChanged;

  const ReceivingFilterChips({
    super.key,
    this.selectedStatus,
    required this.onStatusChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _FilterChip(
            label: 'Todas',
            isSelected: selectedStatus == null,
            onTap: () => onStatusChanged(null),
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'Pendientes',
            isSelected: selectedStatus == ReceivingStatus.pending,
            onTap: () => onStatusChanged(ReceivingStatus.pending),
            color: AppColors.warning,
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'En Proceso',
            isSelected: selectedStatus == ReceivingStatus.inProgress,
            onTap: () => onStatusChanged(ReceivingStatus.inProgress),
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'Completadas',
            isSelected: selectedStatus == ReceivingStatus.completed,
            onTap: () => onStatusChanged(ReceivingStatus.completed),
            color: AppColors.success,
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'Con Incidencias',
            isSelected: selectedStatus == ReceivingStatus.withIssue,
            onTap: () => onStatusChanged(ReceivingStatus.withIssue),
            color: AppColors.error,
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Color? color;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final chipColor = color ?? Theme.of(context).colorScheme.primary;

    return Material(
      color: isSelected ? chipColor : Colors.transparent,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            border: Border.all(
              color: isSelected ? chipColor : Theme.of(context).colorScheme.outlineVariant,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: isSelected ? Colors.white : Theme.of(context).textTheme.bodyMedium?.color,
            ),
          ),
        ),
      ),
    );
  }
}
