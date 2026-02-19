import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';
import 'package:plexo_ops/features/receiving/data/models/receiving_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

class ReceivingState {
  final List<ReceivingModel> receivings;
  final ReceivingStats? stats;
  final bool isLoading;
  final String? error;
  final ReceivingStatus? statusFilter;

  ReceivingState({
    this.receivings = const [],
    this.stats,
    this.isLoading = false,
    this.error,
    this.statusFilter,
  });

  ReceivingState copyWith({
    List<ReceivingModel>? receivings,
    ReceivingStats? stats,
    bool? isLoading,
    String? error,
    ReceivingStatus? statusFilter,
    bool clearStatusFilter = false,
  }) {
    return ReceivingState(
      receivings: receivings ?? this.receivings,
      stats: stats ?? this.stats,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      statusFilter: clearStatusFilter ? null : statusFilter ?? this.statusFilter,
    );
  }

  List<ReceivingModel> get filteredReceivings {
    if (statusFilter == null) return receivings;
    return receivings.where((r) => r.status == statusFilter).toList();
  }

  List<ReceivingModel> get pendingReceivings =>
      receivings.where((r) => r.status == ReceivingStatus.pending).toList();

  List<ReceivingModel> get inProgressReceivings =>
      receivings.where((r) => r.status == ReceivingStatus.inProgress).toList();

  List<ReceivingModel> get completedReceivings => receivings
      .where((r) =>
          r.status == ReceivingStatus.completed ||
          r.status == ReceivingStatus.withIssue)
      .toList();
}

class ReceivingNotifier extends StateNotifier<ReceivingState> {
  final Ref _ref;
  final ApiClient _apiClient;

  ReceivingNotifier(this._ref, this._apiClient) : super(ReceivingState());

  Future<void> loadReceivings({String? storeId, String? date}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final queryParams = <String, dynamic>{};
      if (storeId != null) queryParams['storeId'] = storeId;
      if (date != null) queryParams['date'] = date;

      final response = await _apiClient.get(
        '/receiving',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data is List
            ? response.data
            : (response.data['data'] ?? response.data['receivings'] ?? []);

        final receivings = data
            .map((json) => ReceivingModel.fromJson(json as Map<String, dynamic>))
            .toList();

        final stats = ReceivingStats(
          total: receivings.length,
          pending: receivings
              .where((r) => r.status == ReceivingStatus.pending)
              .length,
          inProgress: receivings
              .where((r) => r.status == ReceivingStatus.inProgress)
              .length,
          completed: receivings
              .where((r) => r.status == ReceivingStatus.completed)
              .length,
          withIssue: receivings
              .where((r) => r.status == ReceivingStatus.withIssue)
              .length,
          didNotArrive: receivings
              .where((r) => r.status == ReceivingStatus.didNotArrive)
              .length,
          totalDiscrepancies: receivings.fold(
              0, (sum, r) => sum + r.discrepancyCount),
        );

        state = state.copyWith(
          receivings: receivings,
          stats: stats,
          isLoading: false,
        );
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException loading receivings: $e');
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
      debugPrint('Error loading receivings: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Error al cargar recepciones: $e',
      );
    }
  }

  Future<bool> startReceiving(String id) async {
    try {
      final response = await _apiClient.patch(
        '/receiving/$id',
        data: {
          'status': 'IN_PROGRESS',
          'arrivalTime': DateTime.now().toIso8601String(),
        },
      );

      if (response.statusCode == 200) {
        final updatedReceivings = state.receivings.map((r) {
          if (r.id == id) {
            return ReceivingModel(
              id: r.id,
              storeId: r.storeId,
              store: r.store,
              supplierType: r.supplierType,
              supplierName: r.supplierName,
              poNumber: r.poNumber,
              scheduledTime: r.scheduledTime,
              arrivalTime: DateTime.now(),
              status: ReceivingStatus.inProgress,
              verifiedBy: r.verifiedBy,
              notes: r.notes,
              photoUrls: r.photoUrls,
              signatureUrl: r.signatureUrl,
              driverName: r.driverName,
              truckPlate: r.truckPlate,
              itemCount: r.itemCount,
              discrepancies: r.discrepancies,
              discrepancyCount: r.discrepancyCount,
              createdAt: r.createdAt,
              updatedAt: DateTime.now(),
            );
          }
          return r;
        }).toList();

        state = state.copyWith(receivings: updatedReceivings);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException starting receiving: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error starting receiving: $e');
      state = state.copyWith(error: 'Error al iniciar recepción: $e');
      return false;
    }
  }

  Future<bool> completeReceiving(
    String id, {
    int? itemCount,
    String? notes,
    List<String>? photoUrls,
    required String signatureUrl,
  }) async {
    try {
      // Get current receiving to check for discrepancies
      final currentReceiving = state.receivings.firstWhere((r) => r.id == id);
      final hasIssues = currentReceiving.discrepancyCount > 0;

      final response = await _apiClient.patch(
        '/receiving/$id',
        data: {
          'status': hasIssues ? 'WITH_ISSUE' : 'COMPLETED',
          if (itemCount != null) 'itemCount': itemCount,
          if (notes != null) 'notes': notes,
          if (photoUrls != null && photoUrls.isNotEmpty) 'photoUrls': photoUrls,
          'signatureUrl': signatureUrl,
        },
      );

      if (response.statusCode == 200) {
        final updatedReceivings = state.receivings.map((r) {
          if (r.id == id) {
            return ReceivingModel(
              id: r.id,
              storeId: r.storeId,
              store: r.store,
              supplierType: r.supplierType,
              supplierName: r.supplierName,
              poNumber: r.poNumber,
              scheduledTime: r.scheduledTime,
              arrivalTime: r.arrivalTime ?? DateTime.now(),
              status: hasIssues
                  ? ReceivingStatus.withIssue
                  : ReceivingStatus.completed,
              verifiedBy: r.verifiedBy,
              notes: notes ?? r.notes,
              photoUrls: photoUrls ?? r.photoUrls,
              signatureUrl: signatureUrl,
              driverName: r.driverName,
              truckPlate: r.truckPlate,
              itemCount: itemCount ?? r.itemCount,
              discrepancies: r.discrepancies,
              discrepancyCount: r.discrepancyCount,
              createdAt: r.createdAt,
              updatedAt: DateTime.now(),
            );
          }
          return r;
        }).toList();

        state = state.copyWith(receivings: updatedReceivings);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException completing receiving: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error completing receiving: $e');
      state = state.copyWith(error: 'Error al completar recepción: $e');
      return false;
    }
  }

  Future<bool> markDidNotArrive(String id, String notes) async {
    try {
      final response = await _apiClient.patch(
        '/receiving/$id',
        data: {
          'status': 'DID_NOT_ARRIVE',
          'notes': notes,
        },
      );

      if (response.statusCode == 200) {
        final updatedReceivings = state.receivings.map((r) {
          if (r.id == id) {
            return ReceivingModel(
              id: r.id,
              storeId: r.storeId,
              store: r.store,
              supplierType: r.supplierType,
              supplierName: r.supplierName,
              poNumber: r.poNumber,
              scheduledTime: r.scheduledTime,
              arrivalTime: null,
              status: ReceivingStatus.didNotArrive,
              verifiedBy: r.verifiedBy,
              notes: notes,
              photoUrls: r.photoUrls,
              signatureUrl: r.signatureUrl,
              driverName: r.driverName,
              truckPlate: r.truckPlate,
              itemCount: r.itemCount,
              discrepancies: r.discrepancies,
              discrepancyCount: r.discrepancyCount,
              createdAt: r.createdAt,
              updatedAt: DateTime.now(),
            );
          }
          return r;
        }).toList();

        state = state.copyWith(receivings: updatedReceivings);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException marking did not arrive: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error marking did not arrive: $e');
      state = state.copyWith(error: 'Error al marcar como no llegó: $e');
      return false;
    }
  }

  void setStatusFilter(ReceivingStatus? status) {
    if (status == null) {
      state = state.copyWith(clearStatusFilter: true);
    } else {
      state = state.copyWith(statusFilter: status);
    }
  }

  Future<bool> createReceiving({
    required String storeId,
    required String supplierType,
    required String supplierName,
    String? poNumber,
    String? driverName,
    String? truckPlate,
    int? itemCount,
    DateTime? scheduledTime,
    String? notes,
  }) async {
    try {
      final response = await _apiClient.post(
        '/receiving',
        data: {
          'storeId': storeId,
          'supplierType': supplierType,
          'supplierName': supplierName,
          if (poNumber != null && poNumber.isNotEmpty) 'poNumber': poNumber,
          if (driverName != null && driverName.isNotEmpty) 'driverName': driverName,
          if (truckPlate != null && truckPlate.isNotEmpty) 'truckPlate': truckPlate,
          if (itemCount != null) 'itemCount': itemCount,
          if (scheduledTime != null) 'scheduledTime': scheduledTime.toIso8601String(),
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Reload receivings to get the new one
        await loadReceivings(storeId: storeId);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException creating receiving: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error creating receiving: $e');
      state = state.copyWith(error: 'Error al crear recepción: $e');
      return false;
    }
  }

  Future<bool> addDiscrepancy(
    String receivingId, {
    required String type,
    required String productInfo,
    int? quantity,
    String? notes,
    List<String>? photoUrls,
  }) async {
    try {
      final response = await _apiClient.post(
        '/receiving/$receivingId/discrepancy',
        data: {
          'type': type,
          'productInfo': productInfo,
          if (quantity != null) 'quantity': quantity,
          if (notes != null) 'notes': notes,
          if (photoUrls != null && photoUrls.isNotEmpty) 'photoUrls': photoUrls,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Reload receivings to get updated discrepancy count
        final storeId = state.receivings.isNotEmpty
            ? state.receivings.first.storeId
            : null;
        await loadReceivings(storeId: storeId);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException adding discrepancy: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error adding discrepancy: $e');
      state = state.copyWith(error: 'Error al reportar discrepancia: $e');
      return false;
    }
  }

  Future<bool> completeWithIssues(
    String id, {
    int? itemCount,
    String? notes,
    List<String>? photoUrls,
    String? signatureUrl,
  }) async {
    try {
      final response = await _apiClient.patch(
        '/receiving/$id',
        data: {
          'status': 'WITH_ISSUE',
          if (itemCount != null) 'itemCount': itemCount,
          if (notes != null) 'notes': notes,
          if (photoUrls != null && photoUrls.isNotEmpty) 'photoUrls': photoUrls,
          if (signatureUrl != null) 'signatureUrl': signatureUrl,
        },
      );

      if (response.statusCode == 200) {
        final updatedReceivings = state.receivings.map((r) {
          if (r.id == id) {
            return ReceivingModel(
              id: r.id,
              storeId: r.storeId,
              store: r.store,
              supplierType: r.supplierType,
              supplierName: r.supplierName,
              poNumber: r.poNumber,
              scheduledTime: r.scheduledTime,
              arrivalTime: r.arrivalTime ?? DateTime.now(),
              status: ReceivingStatus.withIssue,
              verifiedBy: r.verifiedBy,
              notes: notes ?? r.notes,
              photoUrls: photoUrls ?? r.photoUrls,
              signatureUrl: signatureUrl ?? r.signatureUrl,
              driverName: r.driverName,
              truckPlate: r.truckPlate,
              itemCount: itemCount ?? r.itemCount,
              discrepancies: r.discrepancies,
              discrepancyCount: r.discrepancyCount,
              createdAt: r.createdAt,
              updatedAt: DateTime.now(),
            );
          }
          return r;
        }).toList();

        state = state.copyWith(receivings: updatedReceivings);
        return true;
      } else {
        throw Exception('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      debugPrint('DioException completing with issues: $e');
      state = state.copyWith(error: 'Error de conexión: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('Error completing with issues: $e');
      state = state.copyWith(error: 'Error al completar recepción: $e');
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

void debugPrint(String message) {
  // ignore: avoid_print
  print(message);
}

final receivingProvider =
    StateNotifierProvider<ReceivingNotifier, ReceivingState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ReceivingNotifier(ref, apiClient);
});
