import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/campaigns/data/models/campaign_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

// ==================== State ====================

class CampaignsState {
  final List<Campaign> pendingCampaigns;
  final List<CampaignSubmission> mySubmissions;
  final bool isLoading;
  final String? error;

  const CampaignsState({
    this.pendingCampaigns = const [],
    this.mySubmissions = const [],
    this.isLoading = false,
    this.error,
  });

  CampaignsState copyWith({
    List<Campaign>? pendingCampaigns,
    List<CampaignSubmission>? mySubmissions,
    bool? isLoading,
    String? error,
  }) {
    return CampaignsState(
      pendingCampaigns: pendingCampaigns ?? this.pendingCampaigns,
      mySubmissions: mySubmissions ?? this.mySubmissions,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  int get totalPending => pendingCampaigns.length;
  int get overdueCount =>
      pendingCampaigns.where((c) => c.isOverdue).length;
}

// ==================== Notifier ====================

class CampaignsNotifier extends StateNotifier<CampaignsState> {
  final Ref _ref;
  final ApiClient _apiClient;

  CampaignsNotifier(this._ref, this._apiClient)
      : super(const CampaignsState());

  Future<void> loadPendingCampaigns() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.get('/campaigns/my-pending');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['data'] ?? []);

        final campaigns = data
            .map((json) =>
                Campaign.fromJson(json as Map<String, dynamic>))
            .toList();

        state = state.copyWith(
          pendingCampaigns: campaigns,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException loading pending campaigns: $e');
      String errorMsg = 'Error de conexion';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada. Por favor inicie sesion nuevamente.';
        _ref.read(authStateProvider.notifier).logout();
      } else {
        errorMsg = 'Error de conexion: ${e.message}';
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
    } catch (e) {
      _debugPrint('Error loading pending campaigns: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar campañas: $e',
      );
    }
  }

  Future<void> loadMySubmissions() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.get('/campaigns/my-submissions');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['data'] ?? []);

        final submissions = data
            .map((json) =>
                CampaignSubmission.fromJson(json as Map<String, dynamic>))
            .toList();

        state = state.copyWith(
          mySubmissions: submissions,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException loading submissions: $e');
      String errorMsg = 'Error de conexion';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada.';
        _ref.read(authStateProvider.notifier).logout();
      } else {
        errorMsg = 'Error de conexion: ${e.message}';
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
    } catch (e) {
      _debugPrint('Error loading submissions: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar envios: $e',
      );
    }
  }

  Future<bool> submitExecution(
    String campaignId,
    List<String> photoUrls,
    String? notes,
  ) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final user = _ref.read(authStateProvider).user;
      if (user?.storeId == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'No se encontro la tienda del usuario',
        );
        return false;
      }

      final response = await _apiClient.post(
        '/campaigns/$campaignId/submit',
        data: {
          'storeId': user!.storeId,
          'photoUrls': photoUrls,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(isLoading: false);

        await loadPendingCampaigns();
        await loadMySubmissions();

        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException submitting campaign: $e');
      String errorMsg = 'Error al enviar ejecucion';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada.';
        _ref.read(authStateProvider.notifier).logout();
      } else if (e.response?.data?['message'] != null) {
        errorMsg = e.response!.data['message'] as String;
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    } catch (e) {
      _debugPrint('Error submitting campaign: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al enviar ejecucion: $e',
      );
      return false;
    }
  }

  Future<bool> resubmitExecution(
    String campaignId,
    String submissionId,
    List<String> photoUrls,
    String? notes,
  ) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final user = _ref.read(authStateProvider).user;
      if (user?.storeId == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'No se encontro la tienda del usuario',
        );
        return false;
      }

      final response = await _apiClient.put(
        '/campaigns/$campaignId/submissions/$submissionId/resubmit',
        data: {
          'storeId': user!.storeId,
          'photoUrls': photoUrls,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(isLoading: false);

        await loadMySubmissions();

        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException resubmitting campaign: $e');
      String errorMsg = 'Error al reenviar ejecucion';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada.';
        _ref.read(authStateProvider.notifier).logout();
      } else if (e.response?.data?['message'] != null) {
        errorMsg = e.response!.data['message'] as String;
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    } catch (e) {
      _debugPrint('Error resubmitting campaign: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al reenviar ejecucion: $e',
      );
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  void _debugPrint(String message) {
    // ignore: avoid_print
    print(message);
  }
}

// ==================== Provider ====================

final campaignsProvider =
    StateNotifierProvider<CampaignsNotifier, CampaignsState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return CampaignsNotifier(ref, apiClient);
});
