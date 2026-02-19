import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/training/data/models/training_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

// ==================== State ====================

class TrainingState {
  final List<TrainingEnrollment> enrollments;
  final TrainingEnrollment? currentEnrollment;
  final bool isLoading;
  final bool isSubmitting;
  final String? error;

  const TrainingState({
    this.enrollments = const [],
    this.currentEnrollment,
    this.isLoading = false,
    this.isSubmitting = false,
    this.error,
  });

  TrainingState copyWith({
    List<TrainingEnrollment>? enrollments,
    TrainingEnrollment? currentEnrollment,
    bool? isLoading,
    bool? isSubmitting,
    String? error,
    bool clearCurrentEnrollment = false,
  }) {
    return TrainingState(
      enrollments: enrollments ?? this.enrollments,
      currentEnrollment: clearCurrentEnrollment
          ? null
          : (currentEnrollment ?? this.currentEnrollment),
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
    );
  }

  List<TrainingEnrollment> get pendingEnrollments =>
      enrollments.where((e) => e.isAssigned).toList();

  List<TrainingEnrollment> get inProgressEnrollments =>
      enrollments.where((e) => e.isInProgress).toList();

  List<TrainingEnrollment> get completedEnrollments =>
      enrollments.where((e) => e.isCompleted || e.isExpired).toList();
}

// ==================== Notifier ====================

class TrainingNotifier extends StateNotifier<TrainingState> {
  final Ref _ref;
  final ApiClient _apiClient;

  TrainingNotifier(this._ref, this._apiClient) : super(const TrainingState());

  Future<void> loadMyCourses() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _apiClient.get('/training/my-courses');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['data'] ?? []);

        final enrollments = data
            .map((json) =>
                TrainingEnrollment.fromJson(json as Map<String, dynamic>))
            .toList();

        state = state.copyWith(
          enrollments: enrollments,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'cargar cursos');
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar cursos: $e',
      );
    }
  }

  Future<void> loadEnrollmentDetail(String enrollmentId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response =
          await _apiClient.get('/training/my-courses/$enrollmentId');

      if (response.statusCode == 200) {
        final enrollment = TrainingEnrollment.fromJson(
            response.data as Map<String, dynamic>);

        state = state.copyWith(
          currentEnrollment: enrollment,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'cargar detalle');
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar detalle: $e',
      );
    }
  }

  Future<bool> startCourse(String enrollmentId) async {
    state = state.copyWith(isSubmitting: true, error: null);

    try {
      final response =
          await _apiClient.post('/training/enrollments/$enrollmentId/start');

      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(isSubmitting: false);
        await loadEnrollmentDetail(enrollmentId);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'iniciar curso', isSubmitting: true);
      return false;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al iniciar curso: $e',
      );
      return false;
    }
  }

  Future<bool> completeLesson(
      String enrollmentId, String lessonId) async {
    state = state.copyWith(isSubmitting: true, error: null);

    try {
      final response = await _apiClient.post(
        '/training/progress/$enrollmentId/lessons/$lessonId/complete',
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(isSubmitting: false);
        await loadEnrollmentDetail(enrollmentId);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'completar leccion', isSubmitting: true);
      return false;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al completar leccion: $e',
      );
      return false;
    }
  }

  Future<Map<String, dynamic>?> submitQuiz(
    String enrollmentId,
    String lessonId,
    List<Map<String, dynamic>> answers,
  ) async {
    state = state.copyWith(isSubmitting: true, error: null);

    try {
      final response = await _apiClient.post(
        '/training/progress/$enrollmentId/lessons/$lessonId/quiz',
        data: {'answers': answers},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(isSubmitting: false);
        await loadEnrollmentDetail(enrollmentId);
        return response.data as Map<String, dynamic>;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'enviar evaluacion', isSubmitting: true);
      return null;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al enviar evaluacion: $e',
      );
      return null;
    }
  }

  Future<bool> completeCourse(String enrollmentId) async {
    state = state.copyWith(isSubmitting: true, error: null);

    try {
      final response = await _apiClient
          .post('/training/enrollments/$enrollmentId/complete');

      if (response.statusCode == 200 || response.statusCode == 201) {
        state = state.copyWith(isSubmitting: false, clearCurrentEnrollment: true);
        await loadMyCourses();
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      _handleDioError(e, 'completar curso', isSubmitting: true);
      return false;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Error al completar curso: $e',
      );
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  void _handleDioError(DioException e, String action,
      {bool isSubmitting = false}) {
    String errorMsg = 'Error de conexion';
    if (e.response?.statusCode == 401) {
      errorMsg = 'Sesion expirada. Por favor inicie sesion nuevamente.';
      _ref.read(authStateProvider.notifier).logout();
    } else if (e.response?.data?['message'] != null) {
      errorMsg = e.response!.data['message'] as String;
    } else {
      errorMsg = 'Error al $action: ${e.message}';
    }
    state = state.copyWith(
      isLoading: false,
      isSubmitting: false,
      error: errorMsg,
    );
  }
}

// ==================== Provider ====================

final trainingProvider =
    StateNotifierProvider<TrainingNotifier, TrainingState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return TrainingNotifier(ref, apiClient);
});
