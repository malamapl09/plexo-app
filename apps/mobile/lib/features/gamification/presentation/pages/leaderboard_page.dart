import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/gamification/data/models/gamification_model.dart';
import 'package:plexo_ops/features/gamification/presentation/providers/gamification_provider.dart';
import 'package:plexo_ops/features/gamification/presentation/widgets/leaderboard_row.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

class LeaderboardPage extends ConsumerStatefulWidget {
  const LeaderboardPage({super.key});

  @override
  ConsumerState<LeaderboardPage> createState() => _LeaderboardPageState();
}

class _LeaderboardPageState extends ConsumerState<LeaderboardPage>
    with SingleTickerProviderStateMixin {
  late TabController _typeTabController;

  static const _types = ['individual', 'store', 'department'];
  static const _typeLabels = ['Individual', 'Tiendas', 'Departamentos'];
  static const _periods = ['weekly', 'monthly', 'allTime'];
  static const _periodLabels = ['Semanal', 'Mensual', 'Total'];

  List<Map<String, dynamic>> _roles = [];

  @override
  void initState() {
    super.initState();
    _typeTabController = TabController(length: 3, vsync: this);
    _typeTabController.addListener(_onTypeTabChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCurrentTab();
      _loadRoles();
    });
  }

  Future<void> _loadRoles() async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.get('/roles/active');
      if (response.statusCode == 200 && response.data is List) {
        setState(() {
          _roles = (response.data as List)
              .map((r) => r as Map<String, dynamic>)
              .toList();
        });
      }
    } catch (_) {
      // Silently fail — role filter will show "Todos" only
    }
  }

  @override
  void dispose() {
    _typeTabController.removeListener(_onTypeTabChanged);
    _typeTabController.dispose();
    super.dispose();
  }

  void _onTypeTabChanged() {
    if (_typeTabController.indexIsChanging) return;
    final newType = _types[_typeTabController.index];
    final gamState = ref.read(gamificationProvider);
    if (newType != gamState.activeTab) {
      ref
          .read(gamificationProvider.notifier)
          .loadLeaderboard(type: newType);
    }
  }

  void _onPeriodChanged(String period) {
    ref
        .read(gamificationProvider.notifier)
        .loadLeaderboard(period: period);
  }

  void _loadCurrentTab() {
    ref.read(gamificationProvider.notifier).loadLeaderboard();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(gamificationProvider);
    final authState = ref.watch(authStateProvider);
    final currentUserId = authState.user?.id;
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Column(
      children: [
        Material(
          color: colorScheme.primary,
          child: TabBar(
            controller: _typeTabController,
            indicatorColor: colorScheme.onPrimary,
            labelColor: colorScheme.onPrimary,
            unselectedLabelColor:
                colorScheme.onPrimary.withValues(alpha: 0.6),
            tabs: _typeLabels.map((l) => Tab(text: l)).toList(),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async => _loadCurrentTab(),
            child: Column(
              children: [
                // Period chips + filter chips
                _buildFiltersRow(state, theme, colorScheme),

                // Content
                Expanded(
                  child: state.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : state.error != null
                          ? _buildErrorState(state.error!, theme, colorScheme)
                          : !state.hasEntries
                              ? _buildEmptyState(theme, colorScheme)
                              : _buildLeaderboardContent(
                                  state, currentUserId, theme, colorScheme),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ==================== Filters Row ====================

  Widget _buildFiltersRow(GamificationState state, ThemeData theme, ColorScheme colorScheme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Column(
        children: [
          // Period chips
          Row(
            children: List.generate(_periods.length, (i) {
              final isSelected = state.currentPeriod == _periods[i];
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(_periodLabels[i]),
                  selected: isSelected,
                  onSelected: (_) => _onPeriodChanged(_periods[i]),
                  selectedColor: colorScheme.primary,
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : colorScheme.onSurfaceVariant,
                    fontSize: 13,
                  ),
                ),
              );
            }),
          ),

          // Tab-specific filter
          if (state.activeTab == 'individual')
            _buildRoleFilter(state, theme, colorScheme),
          if (state.activeTab == 'store')
            _buildTierFilter(state, theme, colorScheme),
        ],
      ),
    );
  }

  Widget _buildRoleFilter(GamificationState state, ThemeData theme, ColorScheme colorScheme) {
    // Build role options from API data: [null/"Todos", ...dynamic roles]
    final roleOptions = <String?>[null];
    final roleLabels = <String>['Todos'];
    for (final r in _roles) {
      roleOptions.add(r['key'] as String?);
      roleLabels.add(r['label'] as String? ?? r['key'] as String? ?? '');
    }

    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: SizedBox(
        height: 32,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: roleOptions.length,
          itemBuilder: (context, i) {
            final isSelected = state.roleFilter == roleOptions[i];
            return Padding(
              padding: const EdgeInsets.only(right: 6),
              child: FilterChip(
                label: Text(roleLabels[i]),
                selected: isSelected,
                onSelected: (_) {
                  ref
                      .read(gamificationProvider.notifier)
                      .setRoleFilter(roleOptions[i]);
                },
                selectedColor: colorScheme.primaryContainer.withOpacity(0.5),
                labelStyle: TextStyle(
                  color:
                      isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                  fontSize: 12,
                ),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildTierFilter(GamificationState state, ThemeData theme, ColorScheme colorScheme) {
    final tiers = [null, 'SMALL', 'MEDIUM', 'LARGE'];
    final tierLabels = ['Todas', 'Pequenas', 'Medianas', 'Grandes'];

    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: SizedBox(
        height: 32,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: tiers.length,
          itemBuilder: (context, i) {
            final isSelected = state.tierFilter == tiers[i];
            return Padding(
              padding: const EdgeInsets.only(right: 6),
              child: FilterChip(
                label: Text(tierLabels[i]),
                selected: isSelected,
                onSelected: (_) {
                  ref
                      .read(gamificationProvider.notifier)
                      .setTierFilter(tiers[i]);
                },
                selectedColor: colorScheme.primaryContainer.withOpacity(0.5),
                labelStyle: TextStyle(
                  color:
                      isSelected ? colorScheme.primary : colorScheme.onSurfaceVariant,
                  fontSize: 12,
                ),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              ),
            );
          },
        ),
      ),
    );
  }

  // ==================== Error / Empty ====================

  Widget _buildErrorState(String error, ThemeData theme, ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 48, color: colorScheme.error),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              error,
              style: TextStyle(color: colorScheme.error),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadCurrentTab,
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme, ColorScheme colorScheme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.emoji_events,
            size: 64,
            color: colorScheme.primary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No hay datos de ranking disponibles',
            style: theme.textTheme.titleMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  // ==================== Content Dispatcher ====================

  Widget _buildLeaderboardContent(
    GamificationState state,
    String? currentUserId,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    switch (state.activeTab) {
      case 'store':
        return _buildStoreContent(state, theme, colorScheme);
      case 'department':
        return _buildDepartmentContent(state, theme, colorScheme);
      default:
        return _buildIndividualContent(state, currentUserId, theme, colorScheme);
    }
  }

  // ==================== Individual Tab ====================

  Widget _buildIndividualContent(
    GamificationState state,
    String? currentUserId,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    final entries = state.individualLeaderboard;
    final topThree = entries.take(3).toList();
    final rest = entries.skip(3).toList();

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Column(
        children: [
          if (topThree.isNotEmpty)
            _buildIndividualPodium(topThree, currentUserId, theme, colorScheme),
          if (rest.isNotEmpty)
            const Divider(height: 1, indent: 16, endIndent: 16),
          if (rest.isNotEmpty)
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: rest.length,
              itemBuilder: (context, index) {
                final entry = rest[index];
                return LeaderboardRow(
                  entry: entry,
                  period: state.currentPeriod,
                  isCurrentUser: entry.userId == currentUserId,
                );
              },
            ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildIndividualPodium(
    List<LeaderboardEntry> topThree,
    String? currentUserId,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    final first = topThree.isNotEmpty ? topThree[0] : null;
    final second = topThree.length > 1 ? topThree[1] : null;
    final third = topThree.length > 2 ? topThree[2] : null;

    return _buildPodiumContainer(
      theme: theme,
      colorScheme: colorScheme,
      children: [
        if (second != null)
          Expanded(
            child: _buildPodiumPlace(
              name: second.userName,
              subtitle: second.storeName,
              value: '${second.pointsForPeriod(ref.read(gamificationProvider).currentPeriod)} pts',
              rank: 2,
              podiumHeight: 100,
              color: const Color(0xFFC0C0C0),
              isHighlighted: second.userId == currentUserId,
              theme: theme,
              colorScheme: colorScheme,
            ),
          ),
        if (first != null)
          Expanded(
            child: _buildPodiumPlace(
              name: first.userName,
              subtitle: first.storeName,
              value: '${first.pointsForPeriod(ref.read(gamificationProvider).currentPeriod)} pts',
              rank: 1,
              podiumHeight: 140,
              color: const Color(0xFFFFD700),
              isHighlighted: first.userId == currentUserId,
              theme: theme,
              colorScheme: colorScheme,
            ),
          ),
        if (third != null)
          Expanded(
            child: _buildPodiumPlace(
              name: third.userName,
              subtitle: third.storeName,
              value: '${third.pointsForPeriod(ref.read(gamificationProvider).currentPeriod)} pts',
              rank: 3,
              podiumHeight: 80,
              color: const Color(0xFFCD7F32),
              isHighlighted: third.userId == currentUserId,
              theme: theme,
              colorScheme: colorScheme,
            ),
          ),
      ],
    );
  }

  // ==================== Store Tab ====================

  Widget _buildStoreContent(GamificationState state, ThemeData theme, ColorScheme colorScheme) {
    final entries = state.storeLeaderboard;
    final topThree = entries.take(3).toList();
    final rest = entries.skip(3).toList();
    final period = state.currentPeriod;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Column(
        children: [
          if (topThree.isNotEmpty)
            _buildStorePodium(topThree, theme, colorScheme),
          if (rest.isNotEmpty)
            const Divider(height: 1, indent: 16, endIndent: 16),
          if (rest.isNotEmpty)
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: rest.length,
              itemBuilder: (context, index) {
                final entry = rest[index];
                return _buildStoreRow(entry, period, theme, colorScheme);
              },
            ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildStorePodium(
    List<StoreLeaderboardEntry> topThree,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    final first = topThree.isNotEmpty ? topThree[0] : null;
    final second = topThree.length > 1 ? topThree[1] : null;
    final third = topThree.length > 2 ? topThree[2] : null;

    return _buildPodiumContainer(
      theme: theme,
      colorScheme: colorScheme,
      children: [
        if (second != null)
          Expanded(
            child: _buildPodiumPlace(
              name: second.storeName,
              subtitle: second.tierLabel,
              value: '${second.perCapitaScore.toStringAsFixed(1)} p/c',
              rank: 2,
              podiumHeight: 100,
              color: const Color(0xFFC0C0C0),
              isHighlighted: false,
              theme: theme,
              colorScheme: colorScheme,
            ),
          ),
        if (first != null)
          Expanded(
            child: _buildPodiumPlace(
              name: first.storeName,
              subtitle: first.tierLabel,
              value: '${first.perCapitaScore.toStringAsFixed(1)} p/c',
              rank: 1,
              podiumHeight: 140,
              color: const Color(0xFFFFD700),
              isHighlighted: false,
              theme: theme,
              colorScheme: colorScheme,
            ),
          ),
        if (third != null)
          Expanded(
            child: _buildPodiumPlace(
              name: third.storeName,
              subtitle: third.tierLabel,
              value: '${third.perCapitaScore.toStringAsFixed(1)} p/c',
              rank: 3,
              podiumHeight: 80,
              color: const Color(0xFFCD7F32),
              isHighlighted: false,
              theme: theme,
              colorScheme: colorScheme,
            ),
          ),
      ],
    );
  }

  Widget _buildStoreRow(
      StoreLeaderboardEntry entry, String period, ThemeData theme, ColorScheme colorScheme) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Rank
            _buildRankCircle(entry.rank, theme, colorScheme),
            const SizedBox(width: 12),

            // Store icon
            CircleAvatar(
              radius: 20,
              backgroundColor: colorScheme.primaryContainer.withOpacity(0.3),
              child: Icon(Icons.store, color: colorScheme.primary, size: 20),
            ),
            const SizedBox(width: 12),

            // Store info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.storeName,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      if (entry.tier != null) ...[
                        _buildTierBadge(entry.tier!, theme),
                        const SizedBox(width: 8),
                      ],
                      Icon(Icons.people, size: 12, color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
                      const SizedBox(width: 2),
                      Text(
                        '${entry.employeeCount}',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                  if (entry.complianceRate != null) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: entry.complianceRate! / 100,
                              backgroundColor: colorScheme.surfaceContainerHighest,
                              color: _complianceColor(entry.complianceRate!),
                              minHeight: 4,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${entry.complianceRate!.toStringAsFixed(0)}%',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: _complianceColor(entry.complianceRate!),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            // Per capita score
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer.withOpacity(0.3),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text(
                    entry.perCapitaScore.toStringAsFixed(1),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: colorScheme.primary,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    'p/c',
                    style: TextStyle(
                      color: colorScheme.primary.withOpacity(0.7),
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==================== Department Tab ====================

  Widget _buildDepartmentContent(
      GamificationState state, ThemeData theme, ColorScheme colorScheme) {
    final entries = state.departmentLeaderboard;
    final topThree = entries.take(3).toList();
    final rest = entries.skip(3).toList();
    final period = state.currentPeriod;

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Column(
        children: [
          if (topThree.isNotEmpty)
            _buildDepartmentPodium(topThree, theme, colorScheme),
          if (rest.isNotEmpty)
            const Divider(height: 1, indent: 16, endIndent: 16),
          if (rest.isNotEmpty)
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: rest.length,
              itemBuilder: (context, index) {
                final entry = rest[index];
                return _buildDepartmentRow(entry, period, theme, colorScheme);
              },
            ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildDepartmentPodium(
    List<DepartmentLeaderboardEntry> topThree,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    final first = topThree.isNotEmpty ? topThree[0] : null;
    final second = topThree.length > 1 ? topThree[1] : null;
    final third = topThree.length > 2 ? topThree[2] : null;

    return _buildPodiumContainer(
      theme: theme,
      colorScheme: colorScheme,
      children: [
        if (second != null)
          Expanded(
            child: _buildPodiumPlace(
              name: second.departmentName,
              subtitle: second.storeName,
              value: '${second.perCapitaScore.toStringAsFixed(1)} p/c',
              rank: 2,
              podiumHeight: 100,
              color: const Color(0xFFC0C0C0),
              isHighlighted: false,
              theme: theme,
              colorScheme: colorScheme,
            ),
          ),
        if (first != null)
          Expanded(
            child: _buildPodiumPlace(
              name: first.departmentName,
              subtitle: first.storeName,
              value: '${first.perCapitaScore.toStringAsFixed(1)} p/c',
              rank: 1,
              podiumHeight: 140,
              color: const Color(0xFFFFD700),
              isHighlighted: false,
              theme: theme,
              colorScheme: colorScheme,
            ),
          ),
        if (third != null)
          Expanded(
            child: _buildPodiumPlace(
              name: third.departmentName,
              subtitle: third.storeName,
              value: '${third.perCapitaScore.toStringAsFixed(1)} p/c',
              rank: 3,
              podiumHeight: 80,
              color: const Color(0xFFCD7F32),
              isHighlighted: false,
              theme: theme,
              colorScheme: colorScheme,
            ),
          ),
      ],
    );
  }

  Widget _buildDepartmentRow(
      DepartmentLeaderboardEntry entry, String period, ThemeData theme, ColorScheme colorScheme) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Rank
            _buildRankCircle(entry.rank, theme, colorScheme),
            const SizedBox(width: 12),

            // Department icon
            CircleAvatar(
              radius: 20,
              backgroundColor: colorScheme.primary.withOpacity(0.15),
              child: Icon(Icons.business, color: colorScheme.primary, size: 20),
            ),
            const SizedBox(width: 12),

            // Department info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.departmentName,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Icon(Icons.store, size: 12, color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          entry.storeName,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(Icons.people, size: 12, color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7)),
                      const SizedBox(width: 2),
                      Text(
                        '${entry.employeeCount}',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Per capita score
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: colorScheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text(
                    entry.perCapitaScore.toStringAsFixed(1),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: colorScheme.primary,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    'p/c',
                    style: TextStyle(
                      color: colorScheme.primary.withOpacity(0.7),
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==================== Shared Podium Widgets ====================

  Widget _buildPodiumContainer({
    required ThemeData theme,
    required ColorScheme colorScheme,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            colorScheme.primaryContainer.withOpacity(0.15),
            Colors.transparent,
          ],
        ),
      ),
      child: Column(
        children: [
          Icon(Icons.emoji_events, size: 48, color: Colors.amber[700]),
          const SizedBox(height: 8),
          Text(
            'Top 3',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: children,
          ),
        ],
      ),
    );
  }

  Widget _buildPodiumPlace({
    required String name,
    String? subtitle,
    required String value,
    required int rank,
    required double podiumHeight,
    required Color color,
    required bool isHighlighted,
    required ThemeData theme,
    required ColorScheme colorScheme,
  }) {
    final avatarRadius = rank == 1 ? 40.0 : 32.0;
    final fontSize = rank == 1 ? 32.0 : 24.0;
    final rankFontSize = rank == 1 ? 32.0 : 24.0;

    return Column(
      children: [
        // Avatar
        Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              decoration: isHighlighted
                  ? BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: colorScheme.primary, width: 3),
                    )
                  : null,
              child: CircleAvatar(
                radius: avatarRadius,
                backgroundColor: color,
                child: Text(
                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                  style: TextStyle(
                    fontSize: fontSize,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            Positioned(
              top: -8,
              right: -4,
              child: _buildRankBadge(rank),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Name
        Text(
          name,
          style: theme.textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: isHighlighted ? colorScheme.primary : colorScheme.onSurface,
          ),
          textAlign: TextAlign.center,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),

        // Subtitle (store name, tier, etc.)
        if (subtitle != null && subtitle.isNotEmpty)
          Text(
            subtitle,
            style: theme.textTheme.labelSmall?.copyWith(
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),

        // Value (points or per capita)
        Text(
          value,
          style: theme.textTheme.bodySmall?.copyWith(
            color: colorScheme.primary,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),

        // Podium base
        Container(
          height: podiumHeight,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(8)),
            border: Border.all(color: color, width: 2),
          ),
          child: Center(
            child: Text(
              '#$rank',
              style: TextStyle(
                fontSize: rankFontSize,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRankBadge(int rank) {
    IconData icon;
    Color bgColor;

    switch (rank) {
      case 1:
        icon = Icons.looks_one;
        bgColor = const Color(0xFFFFD700);
        break;
      case 2:
        icon = Icons.looks_two;
        bgColor = const Color(0xFFC0C0C0);
        break;
      case 3:
        icon = Icons.looks_3;
        bgColor = const Color(0xFFCD7F32);
        break;
      default:
        icon = Icons.circle;
        bgColor = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: bgColor,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: bgColor.withOpacity(0.4),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Icon(icon, size: rank == 1 ? 24 : 20, color: Colors.white),
    );
  }

  // ==================== Shared Utility Widgets ====================

  Widget _buildRankCircle(int rank, ThemeData theme, ColorScheme colorScheme) {
    if (rank >= 1 && rank <= 3) {
      Color rankColor;
      switch (rank) {
        case 1:
          rankColor = const Color(0xFFFFD700);
          break;
        case 2:
          rankColor = const Color(0xFFC0C0C0);
          break;
        case 3:
          rankColor = const Color(0xFFCD7F32);
          break;
        default:
          rankColor = colorScheme.onSurfaceVariant;
      }
      return Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: rankColor.withOpacity(0.15),
          shape: BoxShape.circle,
          border: Border.all(color: rankColor, width: 2),
        ),
        child: Center(
          child: Text(
            '#$rank',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: rankColor,
              fontSize: 14,
            ),
          ),
        ),
      );
    }

    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          '#$rank',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }

  Widget _buildTierBadge(String tier, ThemeData theme) {
    Color bgColor;
    String label;

    switch (tier) {
      case 'SMALL':
        bgColor = Colors.green;
        label = 'P';
        break;
      case 'MEDIUM':
        bgColor = Colors.orange;
        label = 'M';
        break;
      case 'LARGE':
        bgColor = Colors.red;
        label = 'G';
        break;
      default:
        bgColor = Colors.grey;
        label = '?';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(
        color: bgColor.withOpacity(0.15),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: bgColor.withOpacity(0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: bgColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Color _complianceColor(double rate) {
    if (rate >= 80) return Colors.green;
    if (rate >= 50) return Colors.orange;
    return Colors.red;
  }
}
