/// App configuration for API and services
///
/// Environment is set at build time via --dart-define:
///   flutter build ios --release --dart-define=ENV=production --dart-define=API_HOST=https://api.plexoapp.com
///   flutter run --dart-define=ENV=development
///
/// Defaults to "development" if not specified.
class AppConfig {
  // For physical device testing, use your computer's local IP (ipconfig getifaddr en0)
  // Phone and Mac must be on the same WiFi network
  static const String _devHost = 'http://192.170.6.24:3001';
  static const String _prodHost = String.fromEnvironment('API_HOST', defaultValue: 'https://api.plexoapp.com');

  /// Set at build time: --dart-define=ENV=production
  static const String _env = String.fromEnvironment('ENV', defaultValue: 'development');

  static bool get isProduction => _env == 'production';

  /// Base host (without API prefix)
  static String get host => isProduction ? _prodHost : _devHost;

  /// Full API base URL with /api/v1 prefix
  static String get apiBaseUrl => '$host/api/v1';

  /// WebSocket base URL (no prefix, uses /events namespace)
  static String get wsBaseUrl => host;
}
