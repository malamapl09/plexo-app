import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/verification/data/models/pending_verification_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

class VerificationState {
  final List<PendingVerificationItem> tasks;
  final List<PendingVerificationItem> issues;
  final int totalCount;
  final bool isLoading;
  final String? error;
  final VerificationEntityType? typeFilter;
  final bool isProcessing;

  VerificationState({
    this.tasks = const [],
    this.issues = const [],
    this.totalCount = 0,
    this.isLoading = false,
    this.error,
    this.typeFilter,
    this.isProcessing = false,
  });

  VerificationState copyWith({
    List<PendingVerificationItem>? tasks,
    List<PendingVerificationItem>? issues,
    int? totalCount,
    bool? isLoading,
    String? error,
    VerificationEntityType? typeFilter,
    bool clearTypeFilter = false,
    bool? isProcessing,
  }) {
    return VerificationState(
      tasks: tasks ?? this.tasks,
      issues: issues ?? this.issues,
      totalCount: totalCount ?? this.totalCount,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      typeFilter: clearTypeFilter ? null : typeFilter ?? this.typeFilter,
      isProcessing: isProcessing ?? this.isProcessing,
    );
  }

  List<PendingVerificationItem> get allItems => [...tasks, ...issues];

  List<PendingVerificationItem> get filteredItems {
    if (typeFilter == null) return allItems;
    return allItems.where((item) => item.entityType == typeFilter).toList();
  }
}

class VerificationNotifier extends StateNotifier<VerificationState> {
  final Ref _ref;
  final ApiClient _apiClient;

  VerificationNotifier(this._ref, this._apiClient) : super(VerificationState());

  Future<void> loadPendingVerifications({String? storeId}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final queryParams = <String, dynamic>{};
      if (storeId != null) queryParams['storeId'] = storeId;

      final response = await _apiClient.get(
        '/verification/pending',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final data = PendingVerificationsResponse.fromJson(response.data);

        state = state.copyWith(
          tasks: data.tasks,
          issues: data.issues,
          totalCount: data.totalCount,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: 'Error al cargar verificaciones pendientes',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  Future<bool> verifyTask(String assignmentId, {String? notes}) async {
    state = state.copyWith(isProcessing: true, error: null);

    try {
      final request = VerifyRequest(notes: notes);
      final response = await _apiClient.post(
        '/verification/tasks/$assignmentId/verify',
        data: request.toJson(),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Remove the verified item from the list
        final updatedTasks = state.tasks
            .where((t) => t.entityId != assignmentId)
            .toList();

        state = state.copyWith(
          tasks: updatedTasks,
          totalCount: state.totalCount - 1,
          isProcessing: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isProcessing: false,
          error: 'Error al verificar la tarea',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Error de conexión: ${e.toString()}',
      );
      return false;
    }
  }

  Future<bool> rejectTask(String assignmentId, String rejectionReason) async {
    state = state.copyWith(isProcessing: true, error: null);

    try {
      final request = RejectRequest(rejectionReason: rejectionReason);
      final response = await _apiClient.post(
        '/verification/tasks/$assignmentId/reject',
        data: request.toJson(),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Remove the rejected item from the list
        final updatedTasks = state.tasks
            .where((t) => t.entityId != assignmentId)
            .toList();

        state = state.copyWith(
          tasks: updatedTasks,
          totalCount: state.totalCount - 1,
          isProcessing: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isProcessing: false,
          error: 'Error al rechazar la tarea',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Error de conexión: ${e.toString()}',
      );
      return false;
    }
  }

  Future<bool> verifyIssue(String issueId, {String? notes}) async {
    state = state.copyWith(isProcessing: true, error: null);

    try {
      final request = VerifyRequest(notes: notes);
      final response = await _apiClient.post(
        '/verification/issues/$issueId/verify',
        data: request.toJson(),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Remove the verified item from the list
        final updatedIssues = state.issues
            .where((i) => i.entityId != issueId)
            .toList();

        state = state.copyWith(
          issues: updatedIssues,
          totalCount: state.totalCount - 1,
          isProcessing: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isProcessing: false,
          error: 'Error al verificar la incidencia',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Error de conexión: ${e.toString()}',
      );
      return false;
    }
  }

  Future<bool> rejectIssue(String issueId, String rejectionReason) async {
    state = state.copyWith(isProcessing: true, error: null);

    try {
      final request = RejectRequest(rejectionReason: rejectionReason);
      final response = await _apiClient.post(
        '/verification/issues/$issueId/reject',
        data: request.toJson(),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Remove the rejected item from the list
        final updatedIssues = state.issues
            .where((i) => i.entityId != issueId)
            .toList();

        state = state.copyWith(
          issues: updatedIssues,
          totalCount: state.totalCount - 1,
          isProcessing: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isProcessing: false,
          error: 'Error al rechazar la incidencia',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Error de conexión: ${e.toString()}',
      );
      return false;
    }
  }

  void setTypeFilter(VerificationEntityType? type) {
    state = state.copyWith(
      typeFilter: type,
      clearTypeFilter: type == null,
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Providers
final verificationProvider =
    StateNotifierProvider<VerificationNotifier, VerificationState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return VerificationNotifier(ref, apiClient);
});

final pendingVerificationCountProvider = Provider<int>((ref) {
  final state = ref.watch(verificationProvider);
  return state.totalCount;
});
