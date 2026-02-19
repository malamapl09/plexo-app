import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/corrective_actions/data/models/corrective_action_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

// ==================== State ====================

class CorrectiveActionsState {
  final List<CorrectiveActionModel> myActions;
  final bool isLoading;
  final String? error;

  const CorrectiveActionsState({
    this.myActions = const [],
    this.isLoading = false,
    this.error,
  });

  CorrectiveActionsState copyWith({
    List<CorrectiveActionModel>? myActions,
    bool? isLoading,
    String? error,
  }) {
    return CorrectiveActionsState(
      myActions: myActions ?? this.myActions,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  // ---------------------------------------------------------------------------
  // Filtered lists for status tabs
  // ---------------------------------------------------------------------------

  List<CorrectiveActionModel> get pendingActions =>
      myActions.where((a) => a.status == 'PENDING' && !a.isOverdue).toList();

  List<CorrectiveActionModel> get inProgressActions =>
      myActions.where((a) => a.status == 'IN_PROGRESS' && !a.isOverdue).toList();

  List<CorrectiveActionModel> get overdueActions =>
      myActions.where((a) => a.isOverdue).toList();

  // ---------------------------------------------------------------------------
  // Summary counts
  // ---------------------------------------------------------------------------

  int get totalCount => myActions.length;
  int get pendingCount => pendingActions.length;
  int get inProgressCount => inProgressActions.length;
  int get overdueCount => overdueActions.length;
}

// ==================== Notifier ====================

class CorrectiveActionsNotifier extends StateNotifier<CorrectiveActionsState> {
  final Ref _ref;
  final ApiClient _apiClient;

  CorrectiveActionsNotifier(this._ref, this._apiClient)
      : super(const CorrectiveActionsState());

  /// Load corrective actions assigned to the current user.
  /// Endpoint: GET /corrective-actions/my-actions
  Future<void> loadMyActions() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.get('/corrective-actions/my-actions');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['actions'] ?? []);

        final actions = data
            .map((json) =>
                CorrectiveActionModel.fromJson(json as Map<String, dynamic>))
            .toList();

        // Sort by due date ascending (earliest deadlines first).
        actions.sort((a, b) => a.dueDate.compareTo(b.dueDate));

        state = state.copyWith(
          myActions: actions,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException loading my actions: $e');
      String errorMsg = 'Error de conexion';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada. Por favor inicie sesion nuevamente.';
        _ref.read(authStateProvider.notifier).logout();
      } else {
        errorMsg = 'Error de conexion: ${e.message}';
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
    } catch (e) {
      _debugPrint('Error loading my actions: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar acciones correctivas: $e',
      );
    }
  }

  /// Update a corrective action.
  /// Endpoint: PATCH /corrective-actions/:id
  ///
  /// Any of the fields [status], [completionNotes], and [completionPhotoUrls]
  /// can be provided. Only non-null values will be sent.
  Future<bool> updateAction(
    String id, {
    String? status,
    String? completionNotes,
    List<String>? completionPhotoUrls,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final body = <String, dynamic>{};
      if (status != null) body['status'] = status;
      if (completionNotes != null && completionNotes.isNotEmpty) {
        body['completionNotes'] = completionNotes;
      }
      if (completionPhotoUrls != null && completionPhotoUrls.isNotEmpty) {
        body['completionPhotoUrls'] = completionPhotoUrls;
      }

      final response = await _apiClient.patch(
        '/corrective-actions/$id',
        data: body,
      );

      if (response.statusCode == 200) {
        final updatedAction = CorrectiveActionModel.fromJson(
          response.data as Map<String, dynamic>,
        );

        // Replace the action in the local list.
        final updatedList = state.myActions.map((action) {
          return action.id == id ? updatedAction : action;
        }).toList();

        state = state.copyWith(
          myActions: updatedList,
          isLoading: false,
        );

        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _debugPrint('DioException updating action: $e');
      String errorMsg = 'Error al actualizar accion correctiva';
      if (e.response?.statusCode == 401) {
        errorMsg = 'Sesion expirada.';
        _ref.read(authStateProvider.notifier).logout();
      } else if (e.response?.data?['message'] != null) {
        errorMsg = e.response!.data['message'] as String;
      }
      state = state.copyWith(isLoading: false, error: errorMsg);
      return false;
    } catch (e) {
      _debugPrint('Error updating action: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al actualizar accion correctiva: $e',
      );
      return false;
    }
  }

  /// Find a specific action by id from the local list.
  CorrectiveActionModel? getActionById(String id) {
    try {
      return state.myActions.firstWhere((a) => a.id == id);
    } catch (_) {
      return null;
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

final correctiveActionsProvider =
    StateNotifierProvider<CorrectiveActionsNotifier, CorrectiveActionsState>(
        (ref) {
  final apiClient = ref.watch(apiClientProvider);
  return CorrectiveActionsNotifier(ref, apiClient);
});
