import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/store_audits/data/models/audit_template_model.dart';
import 'package:plexo_ops/features/store_audits/data/models/store_audit_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class StoreAuditsState {
  final List<StoreAudit> audits;
  final StoreAudit? currentAudit;
  final AuditTemplate? currentTemplate;

  /// Local answers map keyed by questionId. Updated optimistically before the
  /// server roundtrip completes so the UI feels instant.
  final Map<String, AuditAnswer> answers;

  final bool isLoading;
  final bool isSubmitting;
  final String? error;

  const StoreAuditsState({
    this.audits = const [],
    this.currentAudit,
    this.currentTemplate,
    this.answers = const {},
    this.isLoading = false,
    this.isSubmitting = false,
    this.error,
  });

  StoreAuditsState copyWith({
    List<StoreAudit>? audits,
    StoreAudit? currentAudit,
    AuditTemplate? currentTemplate,
    Map<String, AuditAnswer>? answers,
    bool? isLoading,
    bool? isSubmitting,
    String? error,
    bool clearCurrentAudit = false,
    bool clearCurrentTemplate = false,
    bool clearError = false,
  }) {
    return StoreAuditsState(
      audits: audits ?? this.audits,
      currentAudit:
          clearCurrentAudit ? null : currentAudit ?? this.currentAudit,
      currentTemplate:
          clearCurrentTemplate ? null : currentTemplate ?? this.currentTemplate,
      answers: answers ?? this.answers,
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: clearError ? null : error,
    );
  }

  /// Scheduled or in-progress audits (excludes completed).
  List<StoreAudit> get pendingAudits =>
      audits.where((a) => !a.isCompleted).toList();

  /// Completed audits only.
  List<StoreAudit> get completedAudits =>
      audits.where((a) => a.isCompleted).toList();
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class StoreAuditsNotifier extends StateNotifier<StoreAuditsState> {
  final Ref _ref;
  final ApiClient _apiClient;

  StoreAuditsNotifier(this._ref, this._apiClient)
      : super(const StoreAuditsState());

  // -----------------------------------------------------------------------
  // Load audits list
  // -----------------------------------------------------------------------

  Future<void> loadAudits() async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _apiClient.get('/store-audits');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['data'] ?? []);

        final audits = data
            .map((json) => StoreAudit.fromJson(json as Map<String, dynamic>))
            .toList();

        state = state.copyWith(audits: audits, isLoading: false);
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'cargar auditorias');
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar auditorias: $e',
      );
    }
  }

  // -----------------------------------------------------------------------
  // Load single audit detail (with template for conducting)
  // -----------------------------------------------------------------------

  Future<void> loadAuditDetail(String auditId) async {
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await _apiClient.get('/store-audits/$auditId');

      if (response.statusCode == 200) {
        final audit =
            StoreAudit.fromJson(response.data as Map<String, dynamic>);

        // Build local answers map from existing answers on the audit.
        final answersMap = <String, AuditAnswer>{};
        for (final answer in audit.answers) {
          answersMap[answer.questionId] = answer;
        }

        state = state.copyWith(
          currentAudit: audit,
          answers: answersMap,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'cargar detalle de auditoria');
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar detalle: $e',
      );
    }
  }

  // -----------------------------------------------------------------------
  // Load template (needed to render sections/questions during conduct)
  // -----------------------------------------------------------------------

  Future<void> loadTemplate(String templateId) async {
    try {
      final response =
          await _apiClient.get('/store-audits/templates/$templateId');

      if (response.statusCode == 200) {
        final template =
            AuditTemplate.fromJson(response.data as Map<String, dynamic>);
        state = state.copyWith(currentTemplate: template);
      }
    } on DioException catch (e) {
      debugPrint('Error loading template: $e');
    } catch (e) {
      debugPrint('Error loading template: $e');
    }
  }

  // -----------------------------------------------------------------------
  // Start audit
  // -----------------------------------------------------------------------

  Future<bool> startAudit(String auditId) async {
    state = state.copyWith(isSubmitting: true, clearError: true);

    try {
      final response = await _apiClient.post('/store-audits/$auditId/start');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final audit =
            StoreAudit.fromJson(response.data as Map<String, dynamic>);

        // Update the audit in the list.
        final updatedList = state.audits.map((a) {
          return a.id == auditId ? audit : a;
        }).toList();

        state = state.copyWith(
          currentAudit: audit,
          audits: updatedList,
          isSubmitting: false,
        );
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'iniciar auditoria');
      return false;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al iniciar auditoria: $e',
      );
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Submit answer
  // -----------------------------------------------------------------------

  Future<bool> submitAnswer({
    required String auditId,
    required String questionId,
    int? score,
    bool? booleanValue,
    String? textValue,
    List<String>? photoUrls,
    String? notes,
  }) async {
    try {
      final body = <String, dynamic>{
        'questionId': questionId,
        if (score != null) 'score': score,
        if (booleanValue != null) 'booleanValue': booleanValue,
        if (textValue != null) 'textValue': textValue,
        if (photoUrls != null && photoUrls.isNotEmpty) 'photoUrls': photoUrls,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      };

      final response = await _apiClient.post(
        '/store-audits/$auditId/answer',
        data: body,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final updatedAudit =
            StoreAudit.fromJson(response.data as Map<String, dynamic>);

        // Rebuild local answers map from the server response.
        final answersMap = <String, AuditAnswer>{};
        for (final answer in updatedAudit.answers) {
          answersMap[answer.questionId] = answer;
        }

        state = state.copyWith(
          currentAudit: updatedAudit,
          answers: answersMap,
        );
        return true;
      }
      return false;
    } on DioException catch (e) {
      debugPrint('DioException submitting answer: $e');
      return false;
    } catch (e) {
      debugPrint('Error submitting answer: $e');
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Report finding
  // -----------------------------------------------------------------------

  Future<bool> reportFinding({
    required String auditId,
    required String severity,
    required String title,
    required String description,
    String? sectionId,
    List<String>? photoUrls,
  }) async {
    state = state.copyWith(isSubmitting: true, clearError: true);

    try {
      final body = <String, dynamic>{
        'severity': severity,
        'title': title,
        'description': description,
        if (sectionId != null) 'sectionId': sectionId,
        if (photoUrls != null && photoUrls.isNotEmpty) 'photoUrls': photoUrls,
      };

      final response = await _apiClient.post(
        '/store-audits/$auditId/finding',
        data: body,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Reload the audit detail to get the updated findings list.
        await loadAuditDetail(auditId);
        state = state.copyWith(isSubmitting: false);
        return true;
      }
      state = state.copyWith(isSubmitting: false);
      return false;
    } on DioException catch (e) {
      debugPrint('DioException reporting finding: $e');
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al reportar hallazgo: ${e.message}',
      );
      return false;
    } catch (e) {
      debugPrint('Error reporting finding: $e');
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al reportar hallazgo: $e',
      );
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Complete audit
  // -----------------------------------------------------------------------

  Future<bool> completeAudit(String auditId) async {
    state = state.copyWith(isSubmitting: true, clearError: true);

    try {
      final response =
          await _apiClient.post('/store-audits/$auditId/complete');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final completedAudit =
            StoreAudit.fromJson(response.data as Map<String, dynamic>);

        final updatedList = state.audits.map((a) {
          return a.id == auditId ? completedAudit : a;
        }).toList();

        state = state.copyWith(
          currentAudit: completedAudit,
          audits: updatedList,
          isSubmitting: false,
        );
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'completar auditoria');
      return false;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al completar auditoria: $e',
      );
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  void clearCurrentAudit() {
    state = state.copyWith(
      clearCurrentAudit: true,
      clearCurrentTemplate: true,
      answers: const {},
    );
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void _handleDioError(DioException e, String action) {
    debugPrint('DioException during $action: $e');
    String errorMsg = 'Error de conexion';
    if (e.response?.statusCode == 401) {
      errorMsg = 'Sesion expirada. Por favor inicie sesion nuevamente.';
      _ref.read(authStateProvider.notifier).logout();
    } else if (e.response?.statusCode == 403) {
      errorMsg = 'No tienes permisos para esta accion.';
    } else if (e.response?.data?['message'] != null) {
      errorMsg = e.response!.data['message'] as String;
    } else {
      errorMsg = 'Error de conexion: ${e.message}';
    }
    state = state.copyWith(
      isLoading: false,
      isSubmitting: false,
      error: errorMsg,
    );
  }
}

void debugPrint(String message) {
  // ignore: avoid_print
  print(message);
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

final storeAuditsProvider =
    StateNotifierProvider<StoreAuditsNotifier, StoreAuditsState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return StoreAuditsNotifier(ref, apiClient);
});

/// Convenience provider for pending audits.
final pendingAuditsProvider = Provider<List<StoreAudit>>((ref) {
  return ref.watch(storeAuditsProvider).pendingAudits;
});

/// Convenience provider for completed audits.
final completedAuditsProvider = Provider<List<StoreAudit>>((ref) {
  return ref.watch(storeAuditsProvider).completedAudits;
});
