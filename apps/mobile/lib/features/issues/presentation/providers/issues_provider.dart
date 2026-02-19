import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/core/services/socket_service.dart';
import 'package:plexo_ops/features/issues/data/models/issue_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

enum IssueViewMode { all, myReports, assignedToMe }

class IssuesState {
  final List<IssueModel> issues;
  final List<IssueModel> assignedIssues;
  final IssueStats? stats;
  final bool isLoading;
  final String? error;
  final IssueStatus? statusFilter;
  final IssueCategory? categoryFilter;
  final bool showMyIssuesOnly;
  final IssueViewMode viewMode;

  IssuesState({
    this.issues = const [],
    this.assignedIssues = const [],
    this.stats,
    this.isLoading = false,
    this.error,
    this.statusFilter,
    this.categoryFilter,
    this.showMyIssuesOnly = false,
    this.viewMode = IssueViewMode.all,
  });

  IssuesState copyWith({
    List<IssueModel>? issues,
    List<IssueModel>? assignedIssues,
    IssueStats? stats,
    bool? isLoading,
    String? error,
    IssueStatus? statusFilter,
    IssueCategory? categoryFilter,
    bool? showMyIssuesOnly,
    IssueViewMode? viewMode,
    bool clearStatusFilter = false,
    bool clearCategoryFilter = false,
  }) {
    return IssuesState(
      issues: issues ?? this.issues,
      assignedIssues: assignedIssues ?? this.assignedIssues,
      stats: stats ?? this.stats,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      statusFilter: clearStatusFilter ? null : statusFilter ?? this.statusFilter,
      categoryFilter:
          clearCategoryFilter ? null : categoryFilter ?? this.categoryFilter,
      showMyIssuesOnly: showMyIssuesOnly ?? this.showMyIssuesOnly,
      viewMode: viewMode ?? this.viewMode,
    );
  }

  List<IssueModel> get filteredIssues {
    var result = viewMode == IssueViewMode.assignedToMe ? assignedIssues : issues;
    if (statusFilter != null) {
      result = result.where((i) => i.status == statusFilter).toList();
    }
    if (categoryFilter != null) {
      result = result.where((i) => i.category == categoryFilter).toList();
    }
    return result;
  }

  List<IssueModel> get openIssues =>
      issues.where((i) => i.status != IssueStatus.resolved).toList();

  List<IssueModel> get escalatedIssues =>
      issues.where((i) => i.isEscalated && i.status != IssueStatus.resolved).toList();

  List<IssueModel> get highPriorityIssues =>
      issues.where((i) => i.priority == Priority.high && i.isOpen).toList();
}

class IssuesNotifier extends StateNotifier<IssuesState> {
  final Ref _ref;
  final ApiClient _apiClient;
  StreamSubscription<SocketEventData>? _socketSubscription;

  IssuesNotifier(this._ref, this._apiClient) : super(IssuesState()) {
    _listenToSocketEvents();
  }

  void _listenToSocketEvents() {
    final socketService = _ref.read(socketServiceProvider);
    _socketSubscription = socketService.events
        .where((e) => e.event == SocketEvent.issueAssignedToMe)
        .listen((_) {
      if (state.viewMode == IssueViewMode.assignedToMe) {
        loadAssignedIssues();
      }
    });
  }

  @override
  void dispose() {
    _socketSubscription?.cancel();
    super.dispose();
  }

  Future<void> loadIssues({String? storeId}) async {
    state = state.copyWith(isLoading: true, error: null, viewMode: IssueViewMode.all);

    try {
      final queryParams = <String, dynamic>{};
      if (storeId != null) queryParams['storeId'] = storeId;

      final response = await _apiClient.get(
        '/issues',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['data'] ?? response.data['issues'] ?? []);

        final issues = data
            .map((json) => IssueModel.fromJson(json as Map<String, dynamic>))
            .toList();

        final stats = IssueStats(
          total: issues.length,
          reported:
              issues.where((i) => i.status == IssueStatus.reported).length,
          assigned:
              issues.where((i) => i.status == IssueStatus.assigned).length,
          inProgress:
              issues.where((i) => i.status == IssueStatus.inProgress).length,
          resolved:
              issues.where((i) => i.status == IssueStatus.resolved).length,
          escalated: issues.where((i) => i.isEscalated).length,
          avgResolutionTimeHours: 0,
        );

        state = state.copyWith(
          issues: issues,
          stats: stats,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException loading issues: $e');
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
      debugPrint('Error loading issues: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar incidencias: $e',
      );
    }
  }

  Future<void> loadMyIssues() async {
    state = state.copyWith(isLoading: true, error: null, showMyIssuesOnly: true, viewMode: IssueViewMode.myReports);

    try {
      final response = await _apiClient.get('/issues/my-issues');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['data'] ?? response.data['issues'] ?? []);

        final myIssues = data
            .map((json) => IssueModel.fromJson(json as Map<String, dynamic>))
            .toList();

        state = state.copyWith(
          issues: myIssues,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException loading my issues: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error de conexión: ${e.message}',
      );
    } catch (e) {
      debugPrint('Error loading my issues: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar mis incidencias: $e',
      );
    }
  }

  Future<void> loadAssignedIssues() async {
    state = state.copyWith(isLoading: true, error: null, viewMode: IssueViewMode.assignedToMe);

    try {
      final response = await _apiClient.get('/issues/assigned');

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['data'] ?? response.data['issues'] ?? []);

        final assignedIssues = data
            .map((json) => IssueModel.fromJson(json as Map<String, dynamic>))
            .toList();

        state = state.copyWith(
          assignedIssues: assignedIssues,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException loading assigned issues: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error de conexión: ${e.message}',
      );
    } catch (e) {
      debugPrint('Error loading assigned issues: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar incidencias asignadas: $e',
      );
    }
  }

  Future<bool> createIssue(CreateIssueRequest request) async {
    try {
      final response = await _apiClient.post(
        '/issues',
        data: {
          'storeId': request.storeId,
          'category': request.category.name.toUpperCase(),
          'priority': request.priority.name.toUpperCase(),
          'title': request.title,
          'description': request.description,
          if (request.photoUrls.isNotEmpty) 'photoUrls': request.photoUrls,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final newIssue = IssueModel.fromJson(response.data);
        state = state.copyWith(
          issues: [newIssue, ...state.issues],
        );
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException creating issue: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error creating issue: $e');
      state = state.copyWith(error: 'Error al crear incidencia: $e');
      return false;
    }
  }

  Future<bool> startProgress(String issueId) async {
    try {
      final response = await _apiClient.patch(
        '/issues/$issueId',
        data: {'status': 'IN_PROGRESS'},
      );

      if (response.statusCode == 200) {
        final updatedIssues = state.issues.map((issue) {
          if (issue.id == issueId) {
            return IssueModel(
              id: issue.id,
              storeId: issue.storeId,
              store: issue.store,
              category: issue.category,
              priority: issue.priority,
              title: issue.title,
              description: issue.description,
              status: IssueStatus.inProgress,
              reportedBy: issue.reportedBy,
              assignedTo: issue.assignedTo,
              photoUrls: issue.photoUrls,
              resolutionNotes: issue.resolutionNotes,
              resolvedAt: issue.resolvedAt,
              escalatedAt: issue.escalatedAt,
              isEscalated: issue.isEscalated,
              createdAt: issue.createdAt,
              updatedAt: DateTime.now(),
            );
          }
          return issue;
        }).toList();

        state = state.copyWith(issues: updatedIssues);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException starting progress: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error starting progress: $e');
      state = state.copyWith(error: 'Error al iniciar trabajo: $e');
      return false;
    }
  }

  Future<bool> resolveIssue(String issueId, String resolutionNotes) async {
    try {
      final response = await _apiClient.post(
        '/issues/$issueId/resolve',
        data: {'resolutionNotes': resolutionNotes},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final updatedIssues = state.issues.map((issue) {
          if (issue.id == issueId) {
            return IssueModel(
              id: issue.id,
              storeId: issue.storeId,
              store: issue.store,
              category: issue.category,
              priority: issue.priority,
              title: issue.title,
              description: issue.description,
              status: IssueStatus.resolved,
              reportedBy: issue.reportedBy,
              assignedTo: issue.assignedTo,
              photoUrls: issue.photoUrls,
              resolutionNotes: resolutionNotes,
              resolvedAt: DateTime.now(),
              escalatedAt: issue.escalatedAt,
              isEscalated: issue.isEscalated,
              createdAt: issue.createdAt,
              updatedAt: DateTime.now(),
            );
          }
          return issue;
        }).toList();

        state = state.copyWith(issues: updatedIssues);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException resolving issue: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error resolving issue: $e');
      state = state.copyWith(error: 'Error al resolver incidencia: $e');
      return false;
    }
  }

  Future<bool> recategorizeIssue(String issueId, IssueCategory newCategory) async {
    try {
      final response = await _apiClient.post(
        '/issues/$issueId/recategorize',
        data: {'category': IssueModel.categoryToString(newCategory)},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final updatedIssue = IssueModel.fromJson(response.data);
        final updatedIssues = state.issues.map((issue) {
          if (issue.id == issueId) return updatedIssue;
          return issue;
        }).toList();

        final updatedAssigned = state.assignedIssues.map((issue) {
          if (issue.id == issueId) return updatedIssue;
          return issue;
        }).toList();

        state = state.copyWith(issues: updatedIssues, assignedIssues: updatedAssigned);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException recategorizing issue: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error recategorizing issue: $e');
      state = state.copyWith(error: 'Error al recategorizar incidencia: $e');
      return false;
    }
  }

  void setStatusFilter(IssueStatus? status) {
    if (status == null) {
      state = state.copyWith(clearStatusFilter: true);
    } else {
      state = state.copyWith(statusFilter: status);
    }
  }

  void setCategoryFilter(IssueCategory? category) {
    if (category == null) {
      state = state.copyWith(clearCategoryFilter: true);
    } else {
      state = state.copyWith(categoryFilter: category);
    }
  }

  void clearFilters() {
    state = state.copyWith(
      clearStatusFilter: true,
      clearCategoryFilter: true,
    );
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

void debugPrint(String message) {
  // ignore: avoid_print
  print(message);
}

final issuesProvider =
    StateNotifierProvider<IssuesNotifier, IssuesState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return IssuesNotifier(ref, apiClient);
});

// Convenience providers for specific issue views
final openIssuesProvider = Provider<List<IssueModel>>((ref) {
  return ref.watch(issuesProvider).openIssues;
});

final escalatedIssuesProvider = Provider<List<IssueModel>>((ref) {
  return ref.watch(issuesProvider).escalatedIssues;
});

final highPriorityIssuesProvider = Provider<List<IssueModel>>((ref) {
  return ref.watch(issuesProvider).highPriorityIssues;
});
