import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/gamification/data/models/gamification_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

// ==================== State ====================

class GamificationState {
  final GamificationProfile? profile;
  final List<LeaderboardEntry> individualLeaderboard;
  final List<StoreLeaderboardEntry> storeLeaderboard;
  final List<DepartmentLeaderboardEntry> departmentLeaderboard;
  final List<BadgeModel> allBadges;
  final String activeTab; // 'individual' | 'store' | 'department'
  final String currentPeriod; // 'weekly' | 'monthly' | 'allTime'
  final String? roleFilter;
  final String? tierFilter;
  final bool isLoading;
  final String? error;

  const GamificationState({
    this.profile,
    this.individualLeaderboard = const [],
    this.storeLeaderboard = const [],
    this.departmentLeaderboard = const [],
    this.allBadges = const [],
    this.activeTab = 'individual',
    this.currentPeriod = 'weekly',
    this.roleFilter,
    this.tierFilter,
    this.isLoading = false,
    this.error,
  });

  GamificationState copyWith({
    GamificationProfile? profile,
    List<LeaderboardEntry>? individualLeaderboard,
    List<StoreLeaderboardEntry>? storeLeaderboard,
    List<DepartmentLeaderboardEntry>? departmentLeaderboard,
    List<BadgeModel>? allBadges,
    String? activeTab,
    String? currentPeriod,
    String? roleFilter,
    String? tierFilter,
    bool? isLoading,
    String? error,
    bool clearRoleFilter = false,
    bool clearTierFilter = false,
  }) {
    return GamificationState(
      profile: profile ?? this.profile,
      individualLeaderboard:
          individualLeaderboard ?? this.individualLeaderboard,
      storeLeaderboard: storeLeaderboard ?? this.storeLeaderboard,
      departmentLeaderboard:
          departmentLeaderboard ?? this.departmentLeaderboard,
      allBadges: allBadges ?? this.allBadges,
      activeTab: activeTab ?? this.activeTab,
      currentPeriod: currentPeriod ?? this.currentPeriod,
      roleFilter: clearRoleFilter ? null : (roleFilter ?? this.roleFilter),
      tierFilter: clearTierFilter ? null : (tierFilter ?? this.tierFilter),
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  /// Top 3 for podium (works for any leaderboard type via dynamic entries).
  bool get hasEntries {
    switch (activeTab) {
      case 'store':
        return storeLeaderboard.isNotEmpty;
      case 'department':
        return departmentLeaderboard.isNotEmpty;
      default:
        return individualLeaderboard.isNotEmpty;
    }
  }

  int get earnedBadgesCount => allBadges.where((b) => b.isEarned).length;
  int get lockedBadgesCount => allBadges.where((b) => !b.isEarned).length;
}

// ==================== Notifier ====================

class GamificationNotifier extends StateNotifier<GamificationState> {
  final Ref _ref;
  final ApiClient _apiClient;

  GamificationNotifier(this._ref, this._apiClient)
      : super(const GamificationState());

  /// Load user's gamification profile.
  Future<void> loadProfile() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.get('/gamification/my-profile');

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final profile = GamificationProfile.fromJson(data);

        state = state.copyWith(
          profile: profile,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'perfil');
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar perfil: $e',
      );
    }
  }

  /// Load leaderboard for the given type using the new /:type endpoint.
  Future<void> loadLeaderboard({
    String? type,
    String? period,
    String? role,
    String? tier,
  }) async {
    final leaderboardType = type ?? state.activeTab;
    final leaderboardPeriod = period ?? state.currentPeriod;

    state = state.copyWith(
      isLoading: true,
      error: null,
      activeTab: leaderboardType,
      currentPeriod: leaderboardPeriod,
    );

    try {
      final queryParams = <String, String>{
        'period': leaderboardPeriod,
      };

      // Add type-specific filters
      if (leaderboardType == 'individual') {
        final roleVal = role ?? state.roleFilter;
        if (roleVal != null && roleVal.isNotEmpty) {
          queryParams['role'] = roleVal;
        }
      } else if (leaderboardType == 'store') {
        final tierVal = tier ?? state.tierFilter;
        if (tierVal != null && tierVal.isNotEmpty) {
          queryParams['tier'] = tierVal;
        }
      }

      final response = await _apiClient.get(
        '/gamification/leaderboard/$leaderboardType',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final entriesJson = data['entries'] as List<dynamic>? ?? [];

        switch (leaderboardType) {
          case 'store':
            final entries = entriesJson
                .map((j) => StoreLeaderboardEntry.fromJson(
                    j as Map<String, dynamic>))
                .toList();
            state = state.copyWith(
              storeLeaderboard: entries,
              isLoading: false,
            );
            break;
          case 'department':
            final entries = entriesJson
                .map((j) => DepartmentLeaderboardEntry.fromJson(
                    j as Map<String, dynamic>))
                .toList();
            state = state.copyWith(
              departmentLeaderboard: entries,
              isLoading: false,
            );
            break;
          default:
            final entries = entriesJson
                .map((j) =>
                    LeaderboardEntry.fromJson(j as Map<String, dynamic>))
                .toList();
            state = state.copyWith(
              individualLeaderboard: entries,
              isLoading: false,
            );
        }
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'ranking');
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar ranking: $e',
      );
    }
  }

  /// Set role filter and reload individual leaderboard.
  void setRoleFilter(String? role) {
    if (role == state.roleFilter) return;
    state = state.copyWith(
      roleFilter: role,
      clearRoleFilter: role == null,
    );
    loadLeaderboard(type: 'individual', role: role ?? '');
  }

  /// Set tier filter and reload store leaderboard.
  void setTierFilter(String? tier) {
    if (tier == state.tierFilter) return;
    state = state.copyWith(
      tierFilter: tier,
      clearTierFilter: tier == null,
    );
    loadLeaderboard(type: 'store', tier: tier ?? '');
  }

  /// Load all available badges.
  Future<void> loadBadges() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.get('/gamification/badges');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['badges'] ?? []);

        final badges = data
            .map((json) => BadgeModel.fromJson(json as Map<String, dynamic>))
            .toList();

        state = state.copyWith(
          allBadges: badges,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'insignias');
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar insignias: $e',
      );
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  void _handleDioError(DioException e, String context) {
    String errorMsg = 'Error de conexion';
    if (e.response?.statusCode == 401) {
      errorMsg = 'Sesion expirada.';
      _ref.read(authStateProvider.notifier).logout();
    } else {
      errorMsg = 'Error de conexion: ${e.message}';
    }
    state = state.copyWith(isLoading: false, error: errorMsg);
  }
}

// ==================== Provider ====================

final gamificationProvider =
    StateNotifierProvider<GamificationNotifier, GamificationState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return GamificationNotifier(ref, apiClient);
});
