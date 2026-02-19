import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:plexo_ops/core/config/app_config.dart';

/// API Client with automatic token refresh on 401 errors and offline response cache
class ApiClient {
  final Dio _dio;
  final FlutterSecureStorage _storage;
  final void Function()? onAuthExpired;
  SharedPreferences? _prefs;

  static const _cachePrefix = 'api_cache_';
  static const _cacheTsPrefix = 'api_cache_ts_';
  static const _maxCacheAge = Duration(hours: 24);

  bool _isRefreshing = false;
  final List<_RetryRequest> _pendingRequests = [];

  ApiClient({
    required FlutterSecureStorage storage,
    this.onAuthExpired,
  })  : _storage = storage,
        _dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
          headers: {
            'Content-Type': 'application/json',
          },
        )) {
    _setupInterceptors();
    _initPrefs();
  }

  Future<void> _initPrefs() async {
    _prefs = await SharedPreferences.getInstance();
  }

  String _cacheKey(String path, Map<String, dynamic>? params) {
    final sortedParams = params != null
        ? (Map.fromEntries(params.entries.toList()..sort((a, b) => a.key.compareTo(b.key))))
        : {};
    return '$_cachePrefix$path${sortedParams.isNotEmpty ? '?${sortedParams.entries.map((e) => '${e.key}=${e.value}').join('&')}' : ''}';
  }

  Future<void> _cacheResponse(String key, dynamic data) async {
    final prefs = _prefs ?? await SharedPreferences.getInstance();
    try {
      final jsonStr = jsonEncode(data);
      await prefs.setString(key, jsonStr);
      await prefs.setInt('$_cacheTsPrefix$key', DateTime.now().millisecondsSinceEpoch);
    } catch (_) {
      // Silently fail if data can't be serialized
    }
  }

  dynamic _getCachedResponse(String key) {
    final prefs = _prefs;
    if (prefs == null) return null;
    final ts = prefs.getInt('$_cacheTsPrefix$key');
    if (ts == null) return null;
    final age = DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(ts));
    if (age > _maxCacheAge) return null;
    final jsonStr = prefs.getString(key);
    if (jsonStr == null) return null;
    try {
      return jsonDecode(jsonStr);
    } catch (_) {
      return null;
    }
  }

  Dio get dio => _dio;

  void _setupInterceptors() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token to all requests
        final token = await _storage.read(key: 'accessToken');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 Unauthorized errors
        if (error.response?.statusCode == 401) {
          final requestOptions = error.requestOptions;

          // Don't retry auth endpoints
          if (requestOptions.path.contains('/auth/')) {
            return handler.next(error);
          }

          // If already refreshing, queue this request
          if (_isRefreshing) {
            _pendingRequests.add(_RetryRequest(
              requestOptions: requestOptions,
              handler: handler,
            ));
            return;
          }

          _isRefreshing = true;

          try {
            final refreshed = await _refreshToken();

            if (refreshed) {
              // Get the new token
              final newToken = await _storage.read(key: 'accessToken');

              // Retry the original request
              final response = await _retryRequest(requestOptions, newToken);

              // Process any queued requests
              await _processQueuedRequests(newToken);

              _isRefreshing = false;
              return handler.resolve(response);
            } else {
              // Refresh failed, clear pending and notify logout
              _clearPendingRequests(error);
              _isRefreshing = false;

              // Trigger logout
              onAuthExpired?.call();

              return handler.next(error);
            }
          } catch (e) {
            _clearPendingRequests(error);
            _isRefreshing = false;
            onAuthExpired?.call();
            return handler.next(error);
          }
        }

        return handler.next(error);
      },
    ));

    // Response cache interceptor: cache GET successes, serve cached on network failure
    _dio.interceptors.add(InterceptorsWrapper(
      onResponse: (response, handler) async {
        if (response.requestOptions.method == 'GET' && response.statusCode != null && response.statusCode! < 300) {
          final key = _cacheKey(response.requestOptions.path, response.requestOptions.queryParameters);
          _cacheResponse(key, response.data);
        }
        return handler.next(response);
      },
      onError: (error, handler) async {
        final isNetworkError = error.type == DioExceptionType.connectionTimeout ||
            error.type == DioExceptionType.receiveTimeout ||
            error.type == DioExceptionType.connectionError ||
            error.type == DioExceptionType.unknown;

        if (isNetworkError && error.requestOptions.method == 'GET') {
          final key = _cacheKey(error.requestOptions.path, error.requestOptions.queryParameters);
          final cached = _getCachedResponse(key);
          if (cached != null) {
            return handler.resolve(Response(
              requestOptions: error.requestOptions,
              data: cached,
              statusCode: 200,
              statusMessage: 'OK (cached)',
            ));
          }
        }
        return handler.next(error);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refreshToken');
      if (refreshToken == null) return false;

      // Create a separate Dio instance for refresh to avoid interceptor loop
      final refreshDio = Dio(BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      ));

      final response = await refreshDio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final newAccessToken = response.data['accessToken'] as String;
        await _storage.write(key: 'accessToken', value: newAccessToken);

        // Some APIs also return a new refresh token
        if (response.data['refreshToken'] != null) {
          await _storage.write(
            key: 'refreshToken',
            value: response.data['refreshToken'] as String,
          );
        }

        return true;
      }
      return false;
    } catch (e) {
      // ignore: avoid_print
      print('Token refresh failed: $e');
      return false;
    }
  }

  Future<Response> _retryRequest(RequestOptions requestOptions, String? token) async {
    final options = Options(
      method: requestOptions.method,
      headers: {
        ...requestOptions.headers,
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    return _dio.request(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }

  Future<void> _processQueuedRequests(String? token) async {
    for (final request in _pendingRequests) {
      try {
        final response = await _retryRequest(request.requestOptions, token);
        request.handler.resolve(response);
      } catch (e) {
        request.handler.reject(DioException(
          requestOptions: request.requestOptions,
          error: e,
        ));
      }
    }
    _pendingRequests.clear();
  }

  void _clearPendingRequests(DioException error) {
    for (final request in _pendingRequests) {
      request.handler.reject(error);
    }
    _pendingRequests.clear();
  }

  // Convenience methods for common HTTP operations
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.patch<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) {
    return _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
}

class _RetryRequest {
  final RequestOptions requestOptions;
  final ErrorInterceptorHandler handler;

  _RetryRequest({
    required this.requestOptions,
    required this.handler,
  });
}

/// Provider for secure storage
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

/// Provider for the API client with automatic token refresh
final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);

  return ApiClient(
    storage: storage,
    onAuthExpired: () {
      // This will be called when token refresh fails
      // The auth state will be updated in the providers that use this
      // ignore: avoid_print
      print('Session expired, please log in again');
    },
  );
});
