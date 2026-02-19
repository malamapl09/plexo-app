import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plexo_ops/core/services/connectivity_service.dart';
import 'package:plexo_ops/core/services/sync_service.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';
import 'package:plexo_ops/shared/providers/roles_provider.dart';
import 'package:plexo_ops/shared/widgets/offline_indicator.dart';
import 'package:plexo_ops/shared/widgets/connection_status_indicator.dart';
import 'package:plexo_ops/features/announcements/presentation/providers/announcements_provider.dart';
import 'package:plexo_ops/features/announcements/presentation/widgets/announcement_banner.dart';
import 'package:plexo_ops/features/announcements/presentation/pages/announcements_page.dart';
import 'package:plexo_ops/features/announcements/presentation/pages/announcement_detail_page.dart';
import 'package:plexo_ops/features/verification/presentation/providers/verification_provider.dart';

class HomePage extends ConsumerStatefulWidget {
  final Widget child;

  const HomePage({
    super.key,
    required this.child,
  });

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  @override
  void initState() {
    super.initState();
    // Load announcements on init
    Future.microtask(() {
      ref.read(announcementsProvider.notifier).loadAnnouncements();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).user;
    final isOnline = ref.watch(isOnlineProvider);
    final pendingCount = ref.watch(pendingSyncCountProvider);
    final unreadCount = ref.watch(unreadCountProvider);
    final urgentAnnouncement = ref.watch(latestUrgentAnnouncementProvider);
    final pendingVerificationCount = ref.watch(pendingVerificationCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: _getTitle(context),
        actions: [
          // WebSocket connection indicator
          const Padding(
            padding: EdgeInsets.only(right: 4),
            child: ConnectionStatusChip(),
          ),
          // Offline/Sync indicator
          if (!isOnline || pendingCount > 0)
            const Padding(
              padding: EdgeInsets.only(right: 8),
              child: OfflineChip(),
            ),
          // Notifications/Announcements button with badge
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () => _navigateToAnnouncements(context),
              ),
              if (unreadCount > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 18,
                      minHeight: 18,
                    ),
                    child: Text(
                      unreadCount > 9 ? '9+' : unreadCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      drawer: _buildDrawer(context, user, pendingVerificationCount),
      body: Column(
        children: [
          const OfflineBanner(),
          // Urgent announcement banner
          if (urgentAnnouncement != null)
            AnnouncementBanner(
              announcement: urgentAnnouncement,
              onTap: () => _openAnnouncementDetail(urgentAnnouncement),
              onDismiss: () {
                // Acknowledge to hide banner
                ref
                    .read(announcementsProvider.notifier)
                    .acknowledgeAnnouncement(urgentAnnouncement.id);
              },
            ),
          Expanded(child: widget.child),
        ],
      ),
    );
  }

  Widget _buildDrawer(
      BuildContext context, UserInfo? user, int pendingVerificationCount) {
    final location = GoRouterState.of(context).matchedLocation;
    final colorScheme = Theme.of(context).colorScheme;

    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            // User header — brand color stays consistent in both themes
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
              decoration: BoxDecoration(
                color: colorScheme.primary,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white24,
                    child: Text(
                      user?.name.isNotEmpty == true
                          ? user!.name[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: colorScheme.onPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    user?.name ?? 'Usuario',
                    style: TextStyle(
                      color: colorScheme.onPrimary,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    user?.email ?? '',
                    style: TextStyle(
                      color: colorScheme.onPrimary.withValues(alpha: 0.7),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (user?.role != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _getRoleLabel(user!.role),
                        style: TextStyle(
                          color: colorScheme.onPrimary,
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Scrollable menu items — filtered by module access
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  // OPERACIONES section
                  if (_hasAnyModule(user, ['tasks', 'receiving', 'issues', 'verification'])) ...[
                    _buildSectionHeader(context, 'OPERACIONES'),
                    if (user?.hasModuleAccess('tasks') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.checklist_outlined,
                        activeIcon: Icons.checklist,
                        label: 'Plan del Día',
                        route: '/',
                        currentLocation: location,
                      ),
                    if (user?.hasModuleAccess('receiving') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.local_shipping_outlined,
                        activeIcon: Icons.local_shipping,
                        label: 'Recepciones',
                        route: '/receiving',
                        currentLocation: location,
                      ),
                    if (user?.hasModuleAccess('issues') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.warning_amber_outlined,
                        activeIcon: Icons.warning_amber,
                        label: 'Incidencias',
                        route: '/issues',
                        currentLocation: location,
                      ),
                    if (user?.hasModuleAccess('verification') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.verified_outlined,
                        activeIcon: Icons.verified,
                        label: 'Verificaciones',
                        route: '/verification',
                        currentLocation: location,
                        badgeCount: pendingVerificationCount,
                      ),
                  ],

                  if (_hasAnyModule(user, ['checklists', 'audits', 'corrective_actions', 'planograms', 'campaigns', 'training'])) ...[
                    const Divider(height: 1),
                    _buildSectionHeader(context, 'CALIDAD'),
                    if (user?.hasModuleAccess('checklists') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.fact_check_outlined,
                        activeIcon: Icons.fact_check,
                        label: 'Checklists',
                        route: '/checklists',
                        currentLocation: location,
                      ),
                    if (user?.hasModuleAccess('audits') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.assignment_outlined,
                        activeIcon: Icons.assignment,
                        label: 'Auditorías',
                        route: '/audits',
                        currentLocation: location,
                      ),
                    if (user?.hasModuleAccess('corrective_actions') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.build_outlined,
                        activeIcon: Icons.build,
                        label: 'Acciones Correctivas',
                        route: '/corrective-actions',
                        currentLocation: location,
                      ),
                    if (user?.hasModuleAccess('planograms') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.grid_view_outlined,
                        activeIcon: Icons.grid_view,
                        label: 'Planogramas',
                        route: '/planograms',
                        currentLocation: location,
                      ),
                    if (user?.hasModuleAccess('campaigns') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.campaign_outlined,
                        activeIcon: Icons.campaign,
                        label: 'Campañas',
                        route: '/campaigns',
                        currentLocation: location,
                      ),
                    if (user?.hasModuleAccess('training') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.school_outlined,
                        activeIcon: Icons.school,
                        label: 'Entrenamiento',
                        route: '/training',
                        currentLocation: location,
                      ),
                  ],

                  if (_hasAnyModule(user, ['gamification'])) ...[
                    const Divider(height: 1),
                    _buildSectionHeader(context, 'EQUIPO'),
                    if (user?.hasModuleAccess('gamification') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.leaderboard_outlined,
                        activeIcon: Icons.leaderboard,
                        label: 'Clasificación',
                        route: '/leaderboard',
                        currentLocation: location,
                      ),
                    if (user?.hasModuleAccess('gamification') ?? true)
                      _buildDrawerItem(
                        context: context,
                        icon: Icons.military_tech_outlined,
                        activeIcon: Icons.military_tech,
                        label: 'Insignias',
                        route: '/badges',
                        currentLocation: location,
                      ),
                  ],
                  // Profile is always visible
                  _buildDrawerItem(
                    context: context,
                    icon: Icons.person_outline,
                    activeIcon: Icons.person,
                    label: 'Mi Perfil',
                    route: '/profile',
                    currentLocation: location,
                  ),
                ],
              ),
            ),

            // Logout at bottom
            const Divider(height: 1),
            ListTile(
              leading: Icon(Icons.logout, color: colorScheme.error),
              title: Text(
                'Cerrar Sesión',
                style: TextStyle(color: colorScheme.error),
              ),
              onTap: () {
                Navigator.pop(context); // close drawer
                _showLogoutDialog(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  bool _hasAnyModule(UserInfo? user, List<String> modules) {
    if (user == null) return true;
    return modules.any((m) => user.hasModuleAccess(m));
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 2),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: colorScheme.onSurfaceVariant,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required BuildContext context,
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required String route,
    required String currentLocation,
    int badgeCount = 0,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    final isSelected = route == '/'
        ? currentLocation == '/'
        : currentLocation.startsWith(route);

    Widget leadingIcon = Icon(isSelected ? activeIcon : icon);
    if (badgeCount > 0) {
      leadingIcon = Badge(
        label: Text(badgeCount > 9 ? '9+' : '$badgeCount'),
        child: leadingIcon,
      );
    }

    return ListTile(
      leading: leadingIcon,
      title: Text(label),
      dense: true,
      selected: isSelected,
      selectedTileColor: colorScheme.primary.withValues(alpha: 0.1),
      selectedColor: colorScheme.primary,
      iconColor: isSelected ? colorScheme.primary : colorScheme.onSurface,
      textColor: isSelected ? colorScheme.primary : colorScheme.onSurface,
      onTap: () {
        Navigator.pop(context); // close drawer
        context.go(route);
      },
    );
  }

  String _getRoleLabel(String role) {
    final labelMap = ref.read(roleLabelMapProvider);
    return getRoleLabelFromMap(labelMap, role);
  }

  void _showLogoutDialog(BuildContext context) {
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

  Widget _getTitle(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;

    switch (location) {
      case '/':
        return const Text('Plan del Día');
      case '/receiving':
        return const Text('Recepciones');
      case '/issues':
        return const Text('Incidencias');
      case '/verification':
        return const Text('Verificaciones');
      case '/profile':
        return const Text('Mi Perfil');
      case '/checklists':
        return const Text('Checklists');
      case '/audits':
        return const Text('Auditorías');
      case '/planograms':
        return const Text('Planogramas');
      case '/campaigns':
        return const Text('Campañas');
      case '/corrective-actions':
        return const Text('Acciones Correctivas');
      case '/training':
        return const Text('Entrenamiento');
      case '/leaderboard':
        return const Text('Clasificación');
      case '/badges':
        return const Text('Insignias');
      default:
        return const Text('Plexo');
    }
  }

  void _navigateToAnnouncements(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AnnouncementsPage(),
      ),
    );
  }

  void _openAnnouncementDetail(announcement) {
    // Mark as viewed when opening
    ref.read(announcementsProvider.notifier).markAsViewed(announcement.id);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AnnouncementDetailPage(
          announcement: announcement,
        ),
      ),
    );
  }
}
