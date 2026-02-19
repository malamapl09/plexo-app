import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/checklists/data/models/checklist_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

// ==================== State ====================

class ChecklistsState {
  final List<ChecklistTemplate> templates;
  final ChecklistSubmission? currentSubmission;
  final bool isLoading;
  final bool isSubmitting;
  final String? error;

  const ChecklistsState({
    this.templates = const [],
    this.currentSubmission,
    this.isLoading = false,
    this.isSubmitting = false,
    this.error,
  });

  ChecklistsState copyWith({
    List<ChecklistTemplate>? templates,
    ChecklistSubmission? currentSubmission,
    bool? isLoading,
    bool? isSubmitting,
    String? error,
    bool clearSubmission = false,
  }) {
    return ChecklistsState(
      templates: templates ?? this.templates,
      currentSubmission:
          clearSubmission ? null : (currentSubmission ?? this.currentSubmission),
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
    );
  }

  /// Summary counts for display.
  int get totalChecklists => templates.length;
  int get completedToday =>
      templates.where((t) => t.isCompletedToday).length;
  int get pendingToday =>
      templates.where((t) => !t.isCompletedToday).length;
}

// ==================== Notifier ====================

class ChecklistsNotifier extends StateNotifier<ChecklistsState> {
  final Ref _ref;
  final ApiClient _apiClient;

  ChecklistsNotifier(this._ref, this._apiClient)
      : super(const ChecklistsState());

  /// Load all checklists assigned to the given store.
  /// Endpoint: GET /checklists/store/:storeId
  Future<void> loadStoreChecklists(String storeId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.get('/checklists/store/$storeId');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['templates'] ?? []);

        final templates = data
            .map((json) =>
                ChecklistTemplate.fromJson(json as Map<String, dynamic>))
            .toList();

        state = state.copyWith(
          templates: templates,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException loading checklists: $e');
      String errorMsg = 'Error de conexion';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada. Por favor inicie sesion nuevamente.';
        _ref.read(authStateProvider.notifier).logout();
      } else {
        errorMsg = 'Error de conexion: ${e.message}';
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
    } catch (e) {
      _debugPrint('Error loading checklists: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar checklists: $e',
      );
    }
  }

  /// Start (or resume) a submission for a template.
  /// Endpoint: POST /checklists/:id/submit
  /// The server returns the existing submission if one already exists for today.
  Future<ChecklistSubmission?> startSubmission(String templateId) async {
    state = state.copyWith(isSubmitting: true, error: null, clearSubmission: true);

    try {
      final response = await _apiClient.post('/checklists/$templateId/submit');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final submission = ChecklistSubmission.fromJson(
          response.data as Map<String, dynamic>,
        );

        state = state.copyWith(
          currentSubmission: submission,
          isSubmitting: false,
        );

        return submission;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException starting submission: $e');
      String errorMsg = 'Error al iniciar el checklist';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada.';
        _ref.read(authStateProvider.notifier).logout();
      } else if (e.response?.data?['message'] != null) {
        errorMsg = e.response!.data['message'] as String;
      }
      state = state.copyWith(isSubmitting: false, error: errorMsg);
      return null;
    } catch (e) {
      _debugPrint('Error starting submission: $e');
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al iniciar el checklist: $e',
      );
      return null;
    }
  }

  /// Respond to a single checklist item.
  /// Endpoint: POST /checklists/submissions/:id/respond
  Future<bool> respondToItem(
    String submissionId,
    String itemId,
    bool isCompleted, {
    List<String>? photoUrls,
    String? notes,
  }) async {
    try {
      final response = await _apiClient.post(
        '/checklists/submissions/$submissionId/respond',
        data: {
          'itemId': itemId,
          'isCompleted': isCompleted,
          if (photoUrls != null && photoUrls.isNotEmpty) 'photoUrls': photoUrls,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );

      // 204 No Content on success
      if (response.statusCode == 204 ||
          response.statusCode == 200 ||
          response.statusCode == 201) {
        // Update local submission state optimistically
        if (state.currentSubmission != null) {
          final current = state.currentSubmission!;
          final existingResponses =
              List<ChecklistResponse>.from(current.responses);

          // Find or create response for this item
          final existingIndex =
              existingResponses.indexWhere((r) => r.itemId == itemId);

          final updatedResponse = ChecklistResponse(
            id: existingIndex >= 0
                ? existingResponses[existingIndex].id
                : 'local_${DateTime.now().millisecondsSinceEpoch}',
            itemId: itemId,
            isCompleted: isCompleted,
            completedAt: isCompleted ? DateTime.now() : null,
            photoUrls: photoUrls ?? [],
            notes: notes,
          );

          if (existingIndex >= 0) {
            existingResponses[existingIndex] = updatedResponse;
          } else {
            existingResponses.add(updatedResponse);
          }

          final completedCount =
              existingResponses.where((r) => r.isCompleted).length;

          final updatedSubmission = ChecklistSubmission(
            id: current.id,
            templateId: current.templateId,
            templateTitle: current.templateTitle,
            storeId: current.storeId,
            storeName: current.storeName,
            date: current.date,
            status: completedCount > 0 ? 'IN_PROGRESS' : 'PENDING',
            submittedBy: current.submittedBy,
            completedAt: current.completedAt,
            score: current.score,
            completedItems: completedCount,
            totalItems: current.totalItems,
            responses: existingResponses,
            createdAt: current.createdAt,
          );

          state = state.copyWith(currentSubmission: updatedSubmission);

          // Also update the corresponding template in the list
          _updateTemplateProgress(
            current.templateId,
            current.id,
            completedCount,
            current.totalItems,
          );
        }
        return true;
      }
      return false;
    } on DioException catch (e) {
      _debugPrint('DioException responding to item: $e');
      state = state.copyWith(
        error: 'Error al guardar respuesta: ${e.message}',
      );
      return false;
    } catch (e) {
      _debugPrint('Error responding to item: $e');
      state = state.copyWith(error: 'Error al guardar respuesta: $e');
      return false;
    }
  }

  /// Complete a submission.
  /// Endpoint: POST /checklists/submissions/:id/complete
  Future<bool> completeSubmission(String submissionId) async {
    state = state.copyWith(isSubmitting: true, error: null);

    try {
      final response = await _apiClient.post(
        '/checklists/submissions/$submissionId/complete',
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final submission = ChecklistSubmission.fromJson(
          response.data as Map<String, dynamic>,
        );

        state = state.copyWith(
          currentSubmission: submission,
          isSubmitting: false,
        );

        // Update the template's todaySubmission in the list
        _updateTemplateProgress(
          submission.templateId,
          submission.id,
          submission.completedItems,
          submission.totalItems,
          status: 'COMPLETED',
        );

        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException completing submission: $e');
      String errorMsg = 'Error al completar el checklist';
      if (e.response?.data?['message'] != null) {
        errorMsg = e.response!.data['message'] as String;
      }
      state = state.copyWith(isSubmitting: false, error: errorMsg);
      return false;
    } catch (e) {
      _debugPrint('Error completing submission: $e');
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al completar el checklist: $e',
      );
      return false;
    }
  }

  /// Update template's todaySubmission progress in the local list.
  void _updateTemplateProgress(
    String templateId,
    String submissionId,
    int completedItems,
    int totalItems, {
    String? status,
  }) {
    final updatedTemplates = state.templates.map((t) {
      if (t.id == templateId) {
        return ChecklistTemplate(
          id: t.id,
          title: t.title,
          description: t.description,
          frequency: t.frequency,
          scope: t.scope,
          isActive: t.isActive,
          items: t.items,
          createdBy: t.createdBy,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          todaySubmission: TodaySubmission(
            id: submissionId,
            status: status ?? 'IN_PROGRESS',
            completedItems: completedItems,
            totalItems: totalItems,
          ),
        );
      }
      return t;
    }).toList();

    state = state.copyWith(templates: updatedTemplates);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  void clearCurrentSubmission() {
    state = state.copyWith(clearSubmission: true);
  }

  void _debugPrint(String message) {
    // ignore: avoid_print
    print(message);
  }
}

// ==================== Provider ====================

final checklistsProvider =
    StateNotifierProvider<ChecklistsNotifier, ChecklistsState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ChecklistsNotifier(ref, apiClient);
});
