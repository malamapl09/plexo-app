import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/api_client.dart';

class RoleInfo {
  final String id;
  final String key;
  final String label;
  final String color;
  final int level;
  final int sortOrder;

  const RoleInfo({
    required this.id,
    required this.key,
    required this.label,
    required this.color,
    required this.level,
    required this.sortOrder,
  });

  factory RoleInfo.fromJson(Map<String, dynamic> json) {
    return RoleInfo(
      id: json['id'] as String,
      key: json['key'] as String,
      label: json['label'] as String,
      color: json['color'] as String? ?? 'gray',
      level: json['level'] as int? ?? 0,
      sortOrder: json['sortOrder'] as int? ?? 0,
    );
  }
}

/// Fetches and caches active roles from the API.
final rolesProvider = FutureProvider<List<RoleInfo>>((ref) async {
  final apiClient = ref.read(apiClientProvider);
  final response = await apiClient.get('/roles/active');
  final data = response.data;
  if (data is List) {
    return data
        .map((e) => RoleInfo.fromJson(e as Map<String, dynamic>))
        .toList();
  }
  return [];
});

/// Helper provider that returns a label lookup map (key -> label).
final roleLabelMapProvider = Provider<Map<String, String>>((ref) {
  final rolesAsync = ref.watch(rolesProvider);
  return rolesAsync.maybeWhen(
    data: (roles) {
      final map = <String, String>{};
      for (final r in roles) {
        map[r.key] = r.label;
      }
      return map;
    },
    orElse: () => {},
  );
});

/// Convenience: get the label for a role key, falling back to the key itself.
String getRoleLabelFromMap(Map<String, String> map, String key) {
  return map[key] ?? key;
}
