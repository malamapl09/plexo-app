import 'package:flutter/material.dart';
import 'package:plexo_ops/features/issues/data/models/issue_model.dart';

class IssueFilterChips extends StatelessWidget {
  final IssueStatus? selectedStatus;
  final IssueCategory? selectedCategory;
  final ValueChanged<IssueStatus?> onStatusSelected;
  final ValueChanged<IssueCategory?> onCategorySelected;

  const IssueFilterChips({
    super.key,
    this.selectedStatus,
    this.selectedCategory,
    required this.onStatusSelected,
    required this.onCategorySelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Status filters
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              _buildFilterChip(
                context: context,
                label: 'Todas',
                isSelected: selectedStatus == null,
                onSelected: () => onStatusSelected(null),
              ),
              const SizedBox(width: 8),
              ...IssueStatus.values.map((status) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _buildFilterChip(
                    context: context,
                    label: _getStatusLabel(status),
                    isSelected: selectedStatus == status,
                    onSelected: () => onStatusSelected(status),
                    color: _getStatusColor(status),
                  ),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // Category filters
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              _buildCategoryChip(
                context: context,
                label: 'Todas',
                icon: Icons.apps,
                isSelected: selectedCategory == null,
                onSelected: () => onCategorySelected(null),
              ),
              const SizedBox(width: 8),
              ...IssueCategory.values.map((category) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: _buildCategoryChip(
                    context: context,
                    label: _getCategoryLabel(category),
                    icon: _getCategoryIcon(category),
                    isSelected: selectedCategory == category,
                    onSelected: () => onCategorySelected(category),
                    color: _getCategoryColor(category),
                  ),
                );
              }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip({
    required BuildContext context,
    required String label,
    required bool isSelected,
    required VoidCallback onSelected,
    Color? color,
  }) {
    final chipColor = color ?? Theme.of(context).colorScheme.primary;

    return FilterChip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : chipColor,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
          fontSize: 13,
        ),
      ),
      selected: isSelected,
      onSelected: (_) => onSelected(),
      backgroundColor: chipColor.withOpacity(0.1),
      selectedColor: chipColor,
      checkmarkColor: Colors.white,
      side: BorderSide(
        color: isSelected ? chipColor : chipColor.withOpacity(0.3),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }

  Widget _buildCategoryChip({
    required BuildContext context,
    required String label,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onSelected,
    Color? color,
  }) {
    final chipColor = color ?? Theme.of(context).colorScheme.primary;

    return FilterChip(
      avatar: Icon(
        icon,
        size: 16,
        color: isSelected ? Colors.white : chipColor,
      ),
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : chipColor,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
          fontSize: 12,
        ),
      ),
      selected: isSelected,
      onSelected: (_) => onSelected(),
      backgroundColor: chipColor.withOpacity(0.1),
      selectedColor: chipColor,
      showCheckmark: false,
      side: BorderSide(
        color: isSelected ? chipColor : chipColor.withOpacity(0.3),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }

  String _getStatusLabel(IssueStatus status) {
    switch (status) {
      case IssueStatus.reported:
        return 'Reportadas';
      case IssueStatus.assigned:
        return 'Asignadas';
      case IssueStatus.inProgress:
        return 'En Proceso';
      case IssueStatus.resolved:
        return 'Resueltas';
      case IssueStatus.pendingVerification:
        return 'Pendiente Verif.';
      case IssueStatus.verified:
        return 'Verificadas';
      case IssueStatus.rejected:
        return 'Rechazadas';
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

  String _getCategoryLabel(IssueCategory category) {
    switch (category) {
      case IssueCategory.maintenance:
        return 'Manten.';
      case IssueCategory.cleaning:
        return 'Limpieza';
      case IssueCategory.security:
        return 'Seguridad';
      case IssueCategory.itSystems:
        return 'IT';
      case IssueCategory.personnel:
        return 'Personal';
      case IssueCategory.inventory:
        return 'Inventario';
    }
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
        return Icons.build_outlined;
      case IssueCategory.cleaning:
        return Icons.cleaning_services_outlined;
      case IssueCategory.security:
        return Icons.security_outlined;
      case IssueCategory.itSystems:
        return Icons.computer_outlined;
      case IssueCategory.personnel:
        return Icons.people_outline;
      case IssueCategory.inventory:
        return Icons.inventory_2_outlined;
    }
  }
}
