import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/announcements/data/models/announcement_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

class AnnouncementsState {
  final List<AnnouncementModel> announcements;
  final AnnouncementStats? stats;
  final bool isLoading;
  final String? error;
  final AnnouncementType? typeFilter;
  final bool showUnreadOnly;

  AnnouncementsState({
    this.announcements = const [],
    this.stats,
    this.isLoading = false,
    this.error,
    this.typeFilter,
    this.showUnreadOnly = false,
  });

  AnnouncementsState copyWith({
    List<AnnouncementModel>? announcements,
    AnnouncementStats? stats,
    bool? isLoading,
    String? error,
    AnnouncementType? typeFilter,
    bool? showUnreadOnly,
    bool clearTypeFilter = false,
    bool clearError = false,
  }) {
    return AnnouncementsState(
      announcements: announcements ?? this.announcements,
      stats: stats ?? this.stats,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : error ?? this.error,
      typeFilter: clearTypeFilter ? null : typeFilter ?? this.typeFilter,
      showUnreadOnly: showUnreadOnly ?? this.showUnreadOnly,
    );
  }

  List<AnnouncementModel> get filteredAnnouncements {
    var result = announcements;

    if (showUnreadOnly) {
      result = result.where((a) => !a.isViewed).toList();
    }

    if (typeFilter != null) {
      result = result.where((a) => a.type == typeFilter).toList();
    }

    return result;
  }

  List<AnnouncementModel> get unreadAnnouncements =>
      announcements.where((a) => !a.isViewed).toList();

  List<AnnouncementModel> get urgentAnnouncements =>
      announcements.where((a) => a.isUrgent && !a.isAcknowledged).toList();

  List<AnnouncementModel> get pendingAcknowledgments =>
      announcements.where((a) => a.needsAcknowledgment).toList();

  AnnouncementModel? get latestUrgent {
    final urgent = urgentAnnouncements;
    return urgent.isNotEmpty ? urgent.first : null;
  }
}

class AnnouncementsNotifier extends StateNotifier<AnnouncementsState> {
  final Ref _ref;
  final ApiClient _apiClient;

  AnnouncementsNotifier(this._ref, this._apiClient) : super(AnnouncementsState());

  Future<void> loadAnnouncements() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _apiClient.get('/announcements/feed');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['announcements'] ?? []);

        final announcements = data
            .map((json) => AnnouncementModel.fromJson(json as Map<String, dynamic>))
            .toList();

        final stats = AnnouncementStats(
          total: announcements.length,
          unread: announcements.where((a) => !a.isViewed).length,
          unacknowledged: announcements.where((a) => a.needsAcknowledgment).length,
          urgent: announcements.where((a) => a.isUrgent).length,
        );

        state = state.copyWith(
          announcements: announcements,
          stats: stats,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException loading announcements: $e');
      String errorMsg = 'Error de conexión';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesión expirada. Por favor inicie sesión nuevamente.';
        _ref.read(authStateProvider.notifier).logout();
      } else {
        errorMsg = 'Error de conexión: ${e.message}';
      }
      state = state.copyWith(
        isLoading: false,
        error: errorMsg,
      );
    } catch (e) {
      debugPrint('Error loading announcements: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar anuncios: $e',
      );
    }
  }

  Future<void> refreshAnnouncements() async {
    await loadAnnouncements();
  }

  Future<void> markAsViewed(String announcementId) async {
    try {
      await _apiClient.post('/announcements/$announcementId/view');

      final updatedAnnouncements = state.announcements.map((a) {
        if (a.id == announcementId) {
          return a.copyWith(isViewed: true);
        }
        return a;
      }).toList();

      final newUnread =
          updatedAnnouncements.where((a) => !a.isViewed).length;

      state = state.copyWith(
        announcements: updatedAnnouncements,
        stats: state.stats != null
            ? AnnouncementStats(
                total: state.stats!.total,
                unread: newUnread,
                unacknowledged: state.stats!.unacknowledged,
                urgent: state.stats!.urgent,
              )
            : null,
      );
    } catch (e) {
      // Silently fail for view tracking
      debugPrint('Error marking announcement as viewed: $e');
    }
  }

  Future<bool> acknowledgeAnnouncement(String announcementId) async {
    try {
      await _apiClient.post('/announcements/$announcementId/acknowledge');

      final updatedAnnouncements = state.announcements.map((a) {
        if (a.id == announcementId) {
          return a.copyWith(isViewed: true, isAcknowledged: true);
        }
        return a;
      }).toList();

      final newUnacknowledged =
          updatedAnnouncements.where((a) => a.needsAcknowledgment).length;

      state = state.copyWith(
        announcements: updatedAnnouncements,
        stats: state.stats != null
            ? AnnouncementStats(
                total: state.stats!.total,
                unread: updatedAnnouncements.where((a) => !a.isViewed).length,
                unacknowledged: newUnacknowledged,
                urgent: state.stats!.urgent,
              )
            : null,
      );

      return true;
    } catch (e) {
      state = state.copyWith(error: 'Error al confirmar lectura: $e');
      return false;
    }
  }

  void setTypeFilter(AnnouncementType? type) {
    if (type == null) {
      state = state.copyWith(clearTypeFilter: true);
    } else {
      state = state.copyWith(typeFilter: type);
    }
  }

  void setShowUnreadOnly(bool value) {
    state = state.copyWith(showUnreadOnly: value);
  }

  void clearFilters() {
    state = state.copyWith(
      clearTypeFilter: true,
      showUnreadOnly: false,
    );
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

void debugPrint(String message) {
  // ignore: avoid_print
  print(message);
}

final announcementsProvider =
    StateNotifierProvider<AnnouncementsNotifier, AnnouncementsState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AnnouncementsNotifier(ref, apiClient);
});

// Convenience providers
final unreadAnnouncementsProvider = Provider<List<AnnouncementModel>>((ref) {
  return ref.watch(announcementsProvider).unreadAnnouncements;
});

final urgentAnnouncementsProvider = Provider<List<AnnouncementModel>>((ref) {
  return ref.watch(announcementsProvider).urgentAnnouncements;
});

final announcementStatsProvider = Provider<AnnouncementStats?>((ref) {
  return ref.watch(announcementsProvider).stats;
});

final unreadCountProvider = Provider<int>((ref) {
  return ref.watch(announcementsProvider).stats?.unread ?? 0;
});

final latestUrgentAnnouncementProvider = Provider<AnnouncementModel?>((ref) {
  return ref.watch(announcementsProvider).latestUrgent;
});
