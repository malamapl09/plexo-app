import 'package:flutter/material.dart';
import 'package:plexo_ops/features/issues/data/models/issue_model.dart';

class IssueCategorySelector extends StatelessWidget {
  final IssueCategory? selectedCategory;
  final IssueCategory? excludeCategory;
  final ValueChanged<IssueCategory> onCategorySelected;

  const IssueCategorySelector({
    super.key,
    required this.selectedCategory,
    this.excludeCategory,
    required this.onCategorySelected,
  });

  @override
  Widget build(BuildContext context) {
    final categories = IssueCategory.values
        .where((c) => c != excludeCategory)
        .toList();

    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.1,
      children: categories.map((category) {
        final isSelected = category == selectedCategory;
        return _CategoryCard(
          category: category,
          isSelected: isSelected,
          onTap: () => onCategorySelected(category),
        );
      }).toList(),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final IssueCategory category;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryCard({
    required this.category,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = _getCategoryColor(category);
    final colorScheme = Theme.of(context).colorScheme;

    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: isSelected ? color.withOpacity(isDark ? 0.25 : 0.15) : colorScheme.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : Colors.transparent,
              width: 2,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _getCategoryIcon(category),
                size: 32,
                color: isSelected ? color : colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 8),
              Text(
                _getCategoryLabel(category),
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: isSelected ? color : colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getCategoryLabel(IssueCategory category) {
    switch (category) {
      case IssueCategory.maintenance:
        return 'Mantenimiento';
      case IssueCategory.cleaning:
        return 'Limpieza';
      case IssueCategory.security:
        return 'Seguridad';
      case IssueCategory.itSystems:
        return 'Sistemas/IT';
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
}
