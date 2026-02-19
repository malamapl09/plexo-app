import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/planograms/data/models/planogram_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

// ==================== State ====================

class PlanogramsState {
  final List<PlanogramTemplate> pendingTemplates;
  final List<PlanogramSubmission> mySubmissions;
  final bool isLoading;
  final String? error;

  const PlanogramsState({
    this.pendingTemplates = const [],
    this.mySubmissions = const [],
    this.isLoading = false,
    this.error,
  });

  PlanogramsState copyWith({
    List<PlanogramTemplate>? pendingTemplates,
    List<PlanogramSubmission>? mySubmissions,
    bool? isLoading,
    String? error,
  }) {
    return PlanogramsState(
      pendingTemplates: pendingTemplates ?? this.pendingTemplates,
      mySubmissions: mySubmissions ?? this.mySubmissions,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  /// Summary counts for display
  int get totalPending => pendingTemplates.length;
  int get overdueCount =>
      pendingTemplates.where((p) => p.isOverdue).length;
}

// ==================== Notifier ====================

class PlanogramsNotifier extends StateNotifier<PlanogramsState> {
  final Ref _ref;
  final ApiClient _apiClient;

  PlanogramsNotifier(this._ref, this._apiClient)
      : super(const PlanogramsState());

  /// Load pending planograms for the current user.
  /// Endpoint: GET /planograms/my-pending
  Future<void> loadPendingPlanograms() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.get('/planograms/my-pending');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['templates'] ?? []);

        final planograms = data
            .map((json) =>
                PlanogramTemplate.fromJson(json as Map<String, dynamic>))
            .toList();

        state = state.copyWith(
          pendingTemplates: planograms,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException loading pending planograms: $e');
      String errorMsg = 'Error de conexion';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada. Por favor inicie sesion nuevamente.';
        _ref.read(authStateProvider.notifier).logout();
      } else {
        errorMsg = 'Error de conexion: ${e.message}';
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
    } catch (e) {
      _debugPrint('Error loading pending planograms: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar planogramas: $e',
      );
    }
  }

  /// Load the current user's submissions.
  /// Endpoint: GET /planograms/submissions?mine=true
  Future<void> loadMySubmissions() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.get(
        '/planograms/submissions',
        queryParameters: {'mine': 'true'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['submissions'] ?? []);

        final submissions = data
            .map((json) =>
                PlanogramSubmission.fromJson(json as Map<String, dynamic>))
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

  /// Submit photos for a planogram template.
  /// Endpoint: POST /planograms/templates/:templateId/submit
  Future<bool> submitPlanogram(
    String templateId,
    List<String> photoUrls,
    String? notes,
  ) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.post(
        '/planograms/templates/$templateId/submit',
        data: {
          'photoUrls': photoUrls,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(isLoading: false);

        // Reload both lists to reflect the new submission
        await loadPendingPlanograms();
        await loadMySubmissions();

        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException submitting planogram: $e');
      String errorMsg = 'Error al enviar planograma';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada.';
        _ref.read(authStateProvider.notifier).logout();
      } else if (e.response?.data?['message'] != null) {
        errorMsg = e.response!.data['message'] as String;
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    } catch (e) {
      _debugPrint('Error submitting planogram: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al enviar planograma: $e',
      );
      return false;
    }
  }

  /// Resubmit photos for a planogram that needs revision.
  /// Endpoint: POST /planograms/submissions/:submissionId/resubmit
  Future<bool> resubmitPlanogram(
    String submissionId,
    List<String> photoUrls,
    String? notes,
  ) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.post(
        '/planograms/submissions/$submissionId/resubmit',
        data: {
          'photoUrls': photoUrls,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(isLoading: false);

        // Reload submissions to reflect the update
        await loadMySubmissions();

        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException resubmitting planogram: $e');
      String errorMsg = 'Error al reenviar planograma';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada.';
        _ref.read(authStateProvider.notifier).logout();
      } else if (e.response?.data?['message'] != null) {
        errorMsg = e.response!.data['message'] as String;
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    } catch (e) {
      _debugPrint('Error resubmitting planogram: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al reenviar planograma: $e',
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

final planogramsProvider =
    StateNotifierProvider<PlanogramsNotifier, PlanogramsState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PlanogramsNotifier(ref, apiClient);
});
