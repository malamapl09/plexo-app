import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Brand Colors (Plexo)
  static const Color primary = Color(0xFF1E3A8A); // Deep blue
  static const Color primaryLight = Color(0xFF3B82F6);
  static const Color primaryDark = Color(0xFF1E40AF);

  // Secondary Colors
  static const Color secondary = Color(0xFFF59E0B); // Amber/Orange
  static const Color secondaryLight = Color(0xFFFBBF24);

  // Semantic Colors
  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Priority Colors
  static const Color priorityHigh = Color(0xFFEF4444);
  static const Color priorityMedium = Color(0xFFF59E0B);
  static const Color priorityLow = Color(0xFF22C55E);

  // Status Colors
  static const Color statusPending = Color(0xFF6B7280);
  static const Color statusInProgress = Color(0xFF3B82F6);
  static const Color statusCompleted = Color(0xFF22C55E);
  static const Color statusOverdue = Color(0xFFEF4444);

  // Background Colors — DEPRECATED: use colorScheme.surface instead
  @Deprecated('Use Theme.of(context).colorScheme.surface')
  static const Color background = Color(0xFFF9FAFB);
  @Deprecated('Use Theme.of(context).colorScheme.surface')
  static const Color surface = Color(0xFFFFFFFF);
  @Deprecated('Use Theme.of(context).colorScheme.surfaceContainerLow')
  static const Color surfaceVariant = Color(0xFFF3F4F6);

  // Text Colors — DEPRECATED: use colorScheme.onSurface / onSurfaceVariant
  @Deprecated('Use Theme.of(context).colorScheme.onSurface')
  static const Color textPrimary = Color(0xFF111827);
  @Deprecated('Use Theme.of(context).colorScheme.onSurfaceVariant')
  static const Color textSecondary = Color(0xFF6B7280);
  @Deprecated('Use Theme.of(context).colorScheme.onSurfaceVariant')
  static const Color textTertiary = Color(0xFF9CA3AF);
  static const Color textOnPrimary = Color(0xFFFFFFFF);

  // Border Colors — DEPRECATED: use colorScheme.outlineVariant
  @Deprecated('Use Theme.of(context).colorScheme.outlineVariant')
  static const Color border = Color(0xFFE5E7EB);
  static const Color borderFocused = Color(0xFF3B82F6);

  // Issue Category Colors
  static const Color categoryMaintenance = Color(0xFFF97316);
  static const Color categoryCleaning = Color(0xFF06B6D4);
  static const Color categorySecurity = Color(0xFFEF4444);
  static const Color categoryIT = Color(0xFF8B5CF6);
  static const Color categoryPersonnel = Color(0xFFEC4899);
  static const Color categoryInventory = Color(0xFF84CC16);
}
