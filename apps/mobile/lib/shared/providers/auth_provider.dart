import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:plexo_ops/core/config/app_config.dart';
import 'package:plexo_ops/core/services/socket_service.dart';

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;
  final UserInfo? user;
  final String? accessToken;
  final String? refreshToken;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
    this.user,
    this.accessToken,
    this.refreshToken,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
    UserInfo? user,
    String? accessToken,
    String? refreshToken,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      user: user ?? this.user,
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
    );
  }
}

class UserInfo {
  final String id;
  final String email;
  final String name;
  final String role;
  final bool isSuperAdmin;
  final String? storeId;
  final String? storeName;
  final String? departmentId;
  final String? departmentName;
  final List<String> moduleAccess;

  const UserInfo({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.isSuperAdmin = false,
    this.storeId,
    this.storeName,
    this.departmentId,
    this.departmentName,
    this.moduleAccess = const [],
  });

  bool hasModuleAccess(String module) {
    if (isSuperAdmin) return true;
    return moduleAccess.contains(module);
  }

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      role: json['role'] as String,
      isSuperAdmin: json['isSuperAdmin'] as bool? ?? false,
      storeId: json['storeId'] as String?,
      storeName: json['storeName'] as String?,
      departmentId: json['departmentId'] as String?,
      departmentName: json['departmentName'] as String?,
      moduleAccess: (json['moduleAccess'] as List<dynamic>?)?.cast<String>() ?? [],
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final SocketService _socketService;
  final Dio _dio;
  final FlutterSecureStorage _storage;

  AuthNotifier({
    required SocketService socketService,
    required Dio dio,
    required FlutterSecureStorage storage,
  })  : _socketService = socketService,
        _dio = dio,
        _storage = storage,
        super(const AuthState());

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      final data = response.data;
      final accessToken = data['accessToken'] as String;
      final refreshToken = data['refreshToken'] as String;
      final userData = data['user'] as Map<String, dynamic>;

      // Store tokens securely
      await _storage.write(key: 'accessToken', value: accessToken);
      await _storage.write(key: 'refreshToken', value: refreshToken);

      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: UserInfo.fromJson(userData),
      );

      // Connect to WebSocket after successful login
      _socketService.connect(accessToken);
    } on DioException catch (e) {
      String errorMessage = 'Error al iniciar sesión';

      if (e.response?.statusCode == 401) {
        errorMessage = 'Credenciales incorrectas';
      } else if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Tiempo de espera agotado. Verifique su conexión.';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'No se pudo conectar al servidor';
      } else if (e.response?.data?['message'] != null) {
        errorMessage = e.response!.data['message'];
      }

      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Error inesperado: ${e.toString()}',
      );
    }
  }

  Future<void> logout() async {
    // Disconnect WebSocket
    _socketService.disconnect();

    // Clear stored tokens
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'refreshToken');

    state = const AuthState();
  }

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true);

    try {
      final accessToken = await _storage.read(key: 'accessToken');
      final refreshToken = await _storage.read(key: 'refreshToken');

      if (accessToken == null || refreshToken == null) {
        state = state.copyWith(isLoading: false);
        return;
      }

      // Validate token by calling profile endpoint
      _dio.options.headers['Authorization'] = 'Bearer $accessToken';

      final response = await _dio.get('${AppConfig.apiBaseUrl}/auth/profile');
      final userData = response.data as Map<String, dynamic>;

      state = state.copyWith(
        isAuthenticated: true,
        isLoading: false,
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: UserInfo.fromJson(userData),
      );

      // Connect to WebSocket
      _socketService.connect(accessToken);
    } catch (e) {
      // Token invalid or expired, clear storage
      await _storage.delete(key: 'accessToken');
      await _storage.delete(key: 'refreshToken');
      state = state.copyWith(isLoading: false);
    }
  }

  Future<bool> refreshAccessToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refreshToken');
      if (refreshToken == null) return false;

      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      final newAccessToken = response.data['accessToken'] as String;
      await _storage.write(key: 'accessToken', value: newAccessToken);

      state = state.copyWith(accessToken: newAccessToken);
      return true;
    } catch (e) {
      return false;
    }
  }
}

// Dio provider
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
    },
  ));

  // Add interceptor for logging (debug only)
  if (kDebugMode) {
    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  return dio;
});

// Secure storage provider
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final socketService = ref.watch(socketServiceProvider);
  final dio = ref.watch(dioProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthNotifier(
    socketService: socketService,
    dio: dio,
    storage: storage,
  );
});

/// Provider for access token (used by WebSocket and API calls)
final accessTokenProvider = Provider<String?>((ref) {
  return ref.watch(authStateProvider).accessToken;
});

/// Provider that manages WebSocket connection based on auth state
final webSocketConnectionProvider = Provider<void>((ref) {
  final authState = ref.watch(authStateProvider);
  final socketService = ref.watch(socketServiceProvider);

  if (authState.isAuthenticated && authState.accessToken != null) {
    socketService.connect(authState.accessToken!);
  } else {
    socketService.disconnect();
  }
});
