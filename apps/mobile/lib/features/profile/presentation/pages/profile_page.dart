import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';
import 'package:plexo_ops/shared/providers/roles_provider.dart';
import 'package:plexo_ops/core/theme/theme_provider.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:go_router/go_router.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final user = authState.user;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Profile avatar
          CircleAvatar(
            radius: 50,
            backgroundColor: Theme.of(context).colorScheme.primary,
            child: Text(
              user?.name.isNotEmpty == true
                  ? user!.name.substring(0, 1).toUpperCase()
                  : 'U',
              style: const TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 16),
          // User name
          Text(
            user?.name ?? 'Usuario',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 4),
          // User email
          Text(
            user?.email ?? '',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                ),
          ),
          const SizedBox(height: 8),
          // Role badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              _getRoleLabel(user?.role ?? '', ref),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ),
          const SizedBox(height: 32),
          // Info cards
          _buildInfoCard(
            context,
            icon: Icons.store,
            title: 'Tienda',
            value: user?.storeId != null ? 'Asignado' : 'Todas las tiendas',
          ),
          const SizedBox(height: 12),
          _buildInfoCard(
            context,
            icon: Icons.category,
            title: 'Departamento',
            value: user?.departmentId != null ? 'Asignado' : 'Todos los departamentos',
          ),
          const SizedBox(height: 32),
          // Gamification section
          _buildSectionHeader(context, 'Gamificación'),
          const SizedBox(height: 12),
          _GamificationSummary(),
          const SizedBox(height: 32),
          // Settings section
          _buildSectionHeader(context, 'Configuración'),
          const SizedBox(height: 12),
          _buildSettingsTile(
            context,
            icon: Icons.notifications_outlined,
            title: 'Notificaciones',
            onTap: () => _showNotificationSettings(context, ref),
          ),
          _buildSettingsTile(
            context,
            icon: Icons.dark_mode_outlined,
            title: 'Tema',
            subtitle: getThemeModeLabel(ref.watch(themeModeProvider)),
            onTap: () => _showThemeSelector(context, ref),
          ),
          _buildSettingsTile(
            context,
            icon: Icons.info_outline,
            title: 'Acerca de',
            onTap: () {
              _showAboutDialog(context);
            },
          ),
          const SizedBox(height: 32),
          // Logout button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _showLogoutDialog(context, ref),
              icon: const Icon(Icons.logout, color: Colors.red),
              label: const Text(
                'Cerrar Sesión',
                style: TextStyle(color: Colors.red),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 32),
          // App version
          Text(
            'Plexo v1.0.0',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.5),
                ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildInfoCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).dividerColor,
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: Theme.of(context).colorScheme.primary,
            size: 24,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).textTheme.bodySmall?.color?.withOpacity(0.7),
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }

  Widget _buildSettingsTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    String? subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).iconTheme.color),
      title: Text(title),
      subtitle: subtitle != null ? Text(subtitle) : null,
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
      contentPadding: EdgeInsets.zero,
    );
  }

  String _getRoleLabel(String role, WidgetRef ref) {
    final labelMap = ref.watch(roleLabelMapProvider);
    return getRoleLabelFromMap(labelMap, role);
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cerrar Sesión'),
        content: const Text('¿Está seguro que desea cerrar sesión?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(authStateProvider.notifier).logout();
            },
            child: const Text(
              'Cerrar Sesión',
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Plexo'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Versión: 1.0.0'),
            SizedBox(height: 8),
            Text('Sistema de gestión de operaciones para tiendas Plexo.'),
            SizedBox(height: 16),
            Text(
              '© 2025 Plexo',
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cerrar'),
          ),
        ],
      ),
    );
  }

  void _showThemeSelector(BuildContext context, WidgetRef ref) {
    final currentTheme = ref.read(themeModeProvider);

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Seleccionar Tema',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              _buildThemeOption(
                context,
                ref,
                icon: Icons.brightness_auto,
                title: 'Sistema',
                subtitle: 'Usar configuración del dispositivo',
                mode: ThemeMode.system,
                isSelected: currentTheme == ThemeMode.system,
              ),
              _buildThemeOption(
                context,
                ref,
                icon: Icons.light_mode,
                title: 'Claro',
                subtitle: 'Tema claro',
                mode: ThemeMode.light,
                isSelected: currentTheme == ThemeMode.light,
              ),
              _buildThemeOption(
                context,
                ref,
                icon: Icons.dark_mode,
                title: 'Oscuro',
                subtitle: 'Tema oscuro',
                mode: ThemeMode.dark,
                isSelected: currentTheme == ThemeMode.dark,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildThemeOption(
    BuildContext context,
    WidgetRef ref, {
    required IconData icon,
    required String title,
    required String subtitle,
    required ThemeMode mode,
    required bool isSelected,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? colorScheme.primary : null,
      ),
      title: Text(
        title,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? colorScheme.primary : null,
        ),
      ),
      subtitle: Text(subtitle),
      trailing: isSelected
          ? Icon(Icons.check_circle, color: colorScheme.primary)
          : null,
      onTap: () {
        ref.read(themeModeProvider.notifier).setThemeMode(mode);
        Navigator.pop(context);
      },
    );
  }

  void _showNotificationSettings(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const _NotificationSettingsSheet(),
    );
  }
}

class _NotificationSettingsSheet extends ConsumerStatefulWidget {
  const _NotificationSettingsSheet();

  @override
  ConsumerState<_NotificationSettingsSheet> createState() =>
      _NotificationSettingsSheetState();
}

class _NotificationSettingsSheetState
    extends ConsumerState<_NotificationSettingsSheet> {
  bool _pushEnabled = true;
  bool _taskReminders = true;
  bool _issueAssignments = true;
  bool _announcements = true;
  bool _receivingAlerts = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      setState(() {
        _pushEnabled = prefs.getBool('notif_push_enabled') ?? true;
        _taskReminders = prefs.getBool('notif_task_reminders') ?? true;
        _issueAssignments = prefs.getBool('notif_issue_assignments') ?? true;
        _announcements = prefs.getBool('notif_announcements') ?? true;
        _receivingAlerts = prefs.getBool('notif_receiving_alerts') ?? true;
      });
    } catch (e) {
      // Use defaults if loading fails
    }
  }

  Future<void> _saveSetting(String key, bool value) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(key, value);
    } catch (e) {
      // Ignore save errors
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(context).dividerColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Configuración de Notificaciones',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Controla qué notificaciones deseas recibir',
              style: TextStyle(
                fontSize: 14,
                color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
              ),
            ),
            const SizedBox(height: 24),

            // Master toggle
            _buildNotificationToggle(
              icon: Icons.notifications,
              title: 'Notificaciones Push',
              subtitle: 'Activar o desactivar todas las notificaciones',
              value: _pushEnabled,
              onChanged: (value) {
                setState(() => _pushEnabled = value);
                _saveSetting('notif_push_enabled', value);
              },
              isPrimary: true,
            ),
            const Divider(height: 32),

            // Individual toggles
            _buildNotificationToggle(
              icon: Icons.task_alt,
              title: 'Recordatorios de Tareas',
              subtitle: 'Tareas pendientes y vencimientos',
              value: _taskReminders && _pushEnabled,
              onChanged: _pushEnabled
                  ? (value) {
                      setState(() => _taskReminders = value);
                      _saveSetting('notif_task_reminders', value);
                    }
                  : null,
            ),
            _buildNotificationToggle(
              icon: Icons.report_problem,
              title: 'Asignación de Incidencias',
              subtitle: 'Cuando te asignan una incidencia',
              value: _issueAssignments && _pushEnabled,
              onChanged: _pushEnabled
                  ? (value) {
                      setState(() => _issueAssignments = value);
                      _saveSetting('notif_issue_assignments', value);
                    }
                  : null,
            ),
            _buildNotificationToggle(
              icon: Icons.campaign,
              title: 'Anuncios',
              subtitle: 'Comunicados y actualizaciones',
              value: _announcements && _pushEnabled,
              onChanged: _pushEnabled
                  ? (value) {
                      setState(() => _announcements = value);
                      _saveSetting('notif_announcements', value);
                    }
                  : null,
            ),
            _buildNotificationToggle(
              icon: Icons.local_shipping,
              title: 'Alertas de Recepción',
              subtitle: 'Llegada de proveedores y camiones',
              value: _receivingAlerts && _pushEnabled,
              onChanged: _pushEnabled
                  ? (value) {
                      setState(() => _receivingAlerts = value);
                      _saveSetting('notif_receiving_alerts', value);
                    }
                  : null,
            ),

            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationToggle({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required void Function(bool)? onChanged,
    bool isPrimary = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isPrimary
                  ? Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3)
                  : Theme.of(context).iconTheme.color?.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              icon,
              color: isPrimary ? Theme.of(context).colorScheme.primary : null,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: isPrimary ? FontWeight.bold : FontWeight.w500,
                    fontSize: isPrimary ? 16 : 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: Theme.of(context).colorScheme.primary,
          ),
        ],
      ),
    );
  }
}

class _GamificationSummary extends ConsumerStatefulWidget {
  @override
  ConsumerState<_GamificationSummary> createState() => _GamificationSummaryState();
}

class _GamificationSummaryState extends ConsumerState<_GamificationSummary> {
  Map<String, dynamic>? _profile;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.get('/gamification/my-profile');
      if (mounted) {
        setState(() {
          _profile = response.data is Map<String, dynamic> ? response.data : null;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 80,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_profile == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: const Center(
          child: Text('No hay datos de gamificación'),
        ),
      );
    }

    final totalPoints = _profile!['totalPoints'] ?? 0;
    final weeklyPoints = _profile!['weeklyPoints'] ?? 0;
    final monthlyPoints = _profile!['monthlyPoints'] ?? 0;
    final rank = _profile!['rank'] ?? 0;
    final badges = (_profile!['badges'] as List?)?.where((b) => b['isEarned'] == true).toList() ?? [];

    return Column(
      children: [
        // Points row
        Row(
          children: [
            _buildPointCard(context, 'Total', totalPoints, Theme.of(context).colorScheme.primary),
            const SizedBox(width: 8),
            _buildPointCard(context, 'Semanal', weeklyPoints, Colors.orange),
            const SizedBox(width: 8),
            _buildPointCard(context, 'Mensual', monthlyPoints, Colors.teal),
          ],
        ),
        const SizedBox(height: 12),
        // Rank & badges row
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Row(
            children: [
              Icon(Icons.emoji_events, color: Colors.amber, size: 28),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Posición #$rank',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    '${badges.length} insignia${badges.length != 1 ? 's' : ''} obtenida${badges.length != 1 ? 's' : ''}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const Spacer(),
              TextButton(
                onPressed: () => context.go('/leaderboard'),
                child: const Text('Ver más'),
              ),
            ],
          ),
        ),
        // Recent badges
        if (badges.isNotEmpty) ...[
          const SizedBox(height: 12),
          SizedBox(
            height: 60,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: badges.length > 5 ? 5 : badges.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final badge = badges[index];
                final badgeColorScheme = Theme.of(context).colorScheme;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: badgeColorScheme.primaryContainer.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.military_tech, color: badgeColorScheme.primary, size: 20),
                      const SizedBox(height: 2),
                      Text(
                        badge['name'] ?? '',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPointCard(BuildContext context, String label, int points, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Text(
              points.toString(),
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: color,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
