import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/tasks/data/models/task_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

// State for tasks list
class TasksState {
  final List<TaskModel> tasks;
  final TaskProgress? progress;
  final bool isLoading;
  final String? error;
  final String selectedDate;
  final String? selectedDepartmentId;
  final String? statusFilter;

  const TasksState({
    this.tasks = const [],
    this.progress,
    this.isLoading = false,
    this.error,
    required this.selectedDate,
    this.selectedDepartmentId,
    this.statusFilter,
  });

  TasksState copyWith({
    List<TaskModel>? tasks,
    TaskProgress? progress,
    bool? isLoading,
    String? error,
    String? selectedDate,
    String? selectedDepartmentId,
    String? statusFilter,
  }) {
    return TasksState(
      tasks: tasks ?? this.tasks,
      progress: progress ?? this.progress,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedDate: selectedDate ?? this.selectedDate,
      selectedDepartmentId: selectedDepartmentId ?? this.selectedDepartmentId,
      statusFilter: statusFilter ?? this.statusFilter,
    );
  }

  List<TaskModel> get filteredTasks {
    var filtered = tasks;

    if (selectedDepartmentId != null) {
      filtered = filtered
          .where((t) => t.department?.id == selectedDepartmentId)
          .toList();
    }

    if (statusFilter != null) {
      switch (statusFilter) {
        case 'PENDING':
          filtered = filtered.where((t) => t.isPending && !t.isOverdue).toList();
          break;
        case 'COMPLETED':
          filtered = filtered.where((t) => t.isCompleted).toList();
          break;
        case 'OVERDUE':
          filtered = filtered.where((t) => t.isOverdue).toList();
          break;
      }
    }

    return filtered;
  }
}

class TasksNotifier extends StateNotifier<TasksState> {
  final Ref _ref;
  final ApiClient _apiClient;

  TasksNotifier(this._ref, this._apiClient)
      : super(TasksState(
          selectedDate: _formatDate(DateTime.now()),
        ));

  static String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  Future<void> loadTasks(String storeId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final queryParams = <String, dynamic>{
        'date': state.selectedDate,
      };
      // Only filter by store if storeId is provided (not empty)
      if (storeId.isNotEmpty) {
        queryParams['storeId'] = storeId;
      }

      final response = await _apiClient.get(
        '/tasks',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['data'] ?? response.data['tasks'] ?? []);

        final tasks = data
            .map((json) => TaskModel.fromJson(json as Map<String, dynamic>))
            .toList();

        final progress = TaskProgress(
          total: tasks.length,
          completed: tasks.where((t) => t.isCompleted).length,
          pending: tasks.where((t) => t.isPending && !t.isOverdue).length,
          overdue: tasks.where((t) => t.isOverdue).length,
          completionRate: tasks.isEmpty
              ? 0
              : (tasks.where((t) => t.isCompleted).length /
                      tasks.length *
                      100)
                  .roundToDouble(),
        );

        state = state.copyWith(
          tasks: tasks,
          progress: progress,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException loading tasks: $e');
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
      debugPrint('Error loading tasks: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar tareas: $e',
      );
    }
  }

  Future<bool> completeTask(String taskId, {String? notes, List<String>? photoUrls}) async {
    try {
      final response = await _apiClient.post(
        '/tasks/$taskId/complete',
        data: {
          if (notes != null) 'notes': notes,
          if (photoUrls != null && photoUrls.isNotEmpty) 'photoUrls': photoUrls,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Update local state optimistically
        final updatedTasks = state.tasks.map((task) {
          if (task.id == taskId) {
            return TaskModel(
              id: task.id,
              title: task.title,
              description: task.description,
              department: task.department,
              priority: task.priority,
              scheduledTime: task.scheduledTime,
              dueTime: task.dueTime,
              createdBy: task.createdBy,
              isRecurring: task.isRecurring,
              createdAt: task.createdAt,
              assignment: TaskAssignment(
                id: task.assignment!.id,
                storeId: task.assignment!.storeId,
                store: task.assignment!.store,
                status: 'COMPLETED',
                assignedAt: task.assignment!.assignedAt,
                completedAt: DateTime.now(),
                completedBy: null,
                notes: notes,
                photoUrls: photoUrls ?? [],
              ),
            );
          }
          return task;
        }).toList();

        final completed = updatedTasks.where((t) => t.isCompleted).length;

        state = state.copyWith(
          tasks: updatedTasks,
          progress: TaskProgress(
            total: updatedTasks.length,
            completed: completed,
            pending:
                updatedTasks.where((t) => t.isPending && !t.isOverdue).length,
            overdue: updatedTasks.where((t) => t.isOverdue).length,
            completionRate: updatedTasks.isEmpty
                ? 0
                : (completed / updatedTasks.length * 100).roundToDouble(),
          ),
        );
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException completing task: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error completing task: $e');
      state = state.copyWith(error: 'Error al completar tarea: $e');
      return false;
    }
  }

  Future<void> setDateFilter(String date) async {
    state = state.copyWith(selectedDate: date);
    // Reload tasks for new date
    final user = _ref.read(authStateProvider).user;
    if (user != null) {
      await loadTasks(user.storeId ?? '');
    }
  }

  void setDepartmentFilter(String? departmentId) {
    state = state.copyWith(selectedDepartmentId: departmentId);
  }

  void setStatusFilter(String? status) {
    state = state.copyWith(statusFilter: status);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

void debugPrint(String message) {
  // ignore: avoid_print
  print(message);
}

final tasksProvider = StateNotifierProvider<TasksNotifier, TasksState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return TasksNotifier(ref, apiClient);
});
