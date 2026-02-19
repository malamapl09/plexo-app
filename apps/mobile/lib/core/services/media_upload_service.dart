import 'dart:io';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';
import 'package:plexo_ops/core/config/app_config.dart';

/// Result of a media upload operation
class MediaUploadResult {
  final bool success;
  final String? url;
  final String? error;

  const MediaUploadResult({
    required this.success,
    this.url,
    this.error,
  });

  factory MediaUploadResult.success(String url) => MediaUploadResult(
        success: true,
        url: url,
      );

  factory MediaUploadResult.failure(String error) => MediaUploadResult(
        success: false,
        error: error,
      );
}

/// Service for uploading media files (photos, videos, signatures) to the server
class MediaUploadService {
  final Dio _dio;
  final String _baseUrl;
  final Ref _ref;

  MediaUploadService({
    required Dio dio,
    required String baseUrl,
    required Ref ref,
  })  : _dio = dio,
        _baseUrl = baseUrl,
        _ref = ref;

  /// Get authorization headers
  Map<String, String> _getAuthHeaders() {
    final token = _ref.read(accessTokenProvider);
    return {
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Upload a photo file
  /// Returns the URL of the uploaded file
  Future<MediaUploadResult> uploadPhoto(File file) async {
    try {
      final fileName = path.basename(file.path);
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
        'type': 'photo',
      });

      final response = await _dio.post(
        '$_baseUrl/uploads/photo',
        data: formData,
        options: Options(
          headers: _getAuthHeaders(),
          contentType: 'multipart/form-data',
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final url = response.data['url'] as String?;
        if (url != null) {
          return MediaUploadResult.success(url);
        }
        return MediaUploadResult.failure('No URL returned from server');
      }

      return MediaUploadResult.failure(
        'Upload failed with status ${response.statusCode}',
      );
    } on DioException catch (e) {
      debugPrint('Photo upload error: ${e.message}');
      return MediaUploadResult.failure(
        e.response?.data?['message'] ?? 'Error al subir la foto',
      );
    } catch (e) {
      debugPrint('Photo upload error: $e');
      return MediaUploadResult.failure('Error inesperado al subir la foto');
    }
  }

  /// Upload multiple photos
  /// Returns a list of URLs for successfully uploaded files
  Future<List<String>> uploadPhotos(List<File> files) async {
    final urls = <String>[];

    for (final file in files) {
      final result = await uploadPhoto(file);
      if (result.success && result.url != null) {
        urls.add(result.url!);
      }
    }

    return urls;
  }

  /// Upload a video file
  /// Returns the URL of the uploaded file
  Future<MediaUploadResult> uploadVideo(File file) async {
    try {
      final fileName = path.basename(file.path);

      // Check file size (max 50MB for videos)
      final fileSize = await file.length();
      if (fileSize > 50 * 1024 * 1024) {
        return MediaUploadResult.failure(
          'El video excede el tamaño máximo de 50MB',
        );
      }

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
        'type': 'video',
      });

      final response = await _dio.post(
        '$_baseUrl/uploads/video',
        data: formData,
        options: Options(
          headers: _getAuthHeaders(),
          contentType: 'multipart/form-data',
          sendTimeout: const Duration(minutes: 5),
          receiveTimeout: const Duration(minutes: 5),
        ),
        onSendProgress: (sent, total) {
          final progress = (sent / total * 100).toStringAsFixed(1);
          debugPrint('Video upload progress: $progress%');
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final url = response.data['url'] as String?;
        if (url != null) {
          return MediaUploadResult.success(url);
        }
        return MediaUploadResult.failure('No URL returned from server');
      }

      return MediaUploadResult.failure(
        'Upload failed with status ${response.statusCode}',
      );
    } on DioException catch (e) {
      debugPrint('Video upload error: ${e.message}');
      return MediaUploadResult.failure(
        e.response?.data?['message'] ?? 'Error al subir el video',
      );
    } catch (e) {
      debugPrint('Video upload error: $e');
      return MediaUploadResult.failure('Error inesperado al subir el video');
    }
  }

  /// Upload a signature as PNG bytes
  /// Returns the URL of the uploaded signature
  Future<MediaUploadResult> uploadSignature(
    Uint8List signatureBytes, {
    String? fileName,
  }) async {
    try {
      // Save bytes to temporary file
      final tempDir = await getTemporaryDirectory();
      final tempFile = File(
        '${tempDir.path}/${fileName ?? 'signature_${DateTime.now().millisecondsSinceEpoch}.png'}',
      );
      await tempFile.writeAsBytes(signatureBytes);

      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          tempFile.path,
          filename: path.basename(tempFile.path),
        ),
        'type': 'signature',
      });

      final response = await _dio.post(
        '$_baseUrl/uploads/signature',
        data: formData,
        options: Options(
          headers: _getAuthHeaders(),
          contentType: 'multipart/form-data',
        ),
      );

      // Clean up temp file
      try {
        await tempFile.delete();
      } catch (_) {}

      if (response.statusCode == 200 || response.statusCode == 201) {
        final url = response.data['url'] as String?;
        if (url != null) {
          return MediaUploadResult.success(url);
        }
        return MediaUploadResult.failure('No URL returned from server');
      }

      return MediaUploadResult.failure(
        'Upload failed with status ${response.statusCode}',
      );
    } on DioException catch (e) {
      debugPrint('Signature upload error: ${e.message}');
      return MediaUploadResult.failure(
        e.response?.data?['message'] ?? 'Error al subir la firma',
      );
    } catch (e) {
      debugPrint('Signature upload error: $e');
      return MediaUploadResult.failure('Error inesperado al subir la firma');
    }
  }

  /// Upload a generic file (for attachments)
  Future<MediaUploadResult> uploadFile(File file, String type) async {
    try {
      final fileName = path.basename(file.path);
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
        'type': type,
      });

      final response = await _dio.post(
        '$_baseUrl/uploads/file',
        data: formData,
        options: Options(
          headers: _getAuthHeaders(),
          contentType: 'multipart/form-data',
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final url = response.data['url'] as String?;
        if (url != null) {
          return MediaUploadResult.success(url);
        }
        return MediaUploadResult.failure('No URL returned from server');
      }

      return MediaUploadResult.failure(
        'Upload failed with status ${response.statusCode}',
      );
    } on DioException catch (e) {
      debugPrint('File upload error: ${e.message}');
      return MediaUploadResult.failure(
        e.response?.data?['message'] ?? 'Error al subir el archivo',
      );
    } catch (e) {
      debugPrint('File upload error: $e');
      return MediaUploadResult.failure('Error inesperado al subir el archivo');
    }
  }
}

/// Provider for Dio instance
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    sendTimeout: const Duration(seconds: 60),
  ));

  // Add logging interceptor in debug mode
  if (kDebugMode) {
    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  return dio;
});

/// Provider for API base URL
final apiBaseUrlProvider = Provider<String>((ref) {
  return AppConfig.apiBaseUrl;
});

/// Provider for MediaUploadService
final mediaUploadServiceProvider = Provider<MediaUploadService>((ref) {
  return MediaUploadService(
    dio: ref.watch(dioProvider),
    baseUrl: ref.watch(apiBaseUrlProvider),
    ref: ref,
  );
});
