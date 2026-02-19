/// Models for the Gamification feature.
/// Maps to the API response DTOs from the gamification module.

class GamificationProfile {
  final int totalPoints;
  final int weeklyPoints;
  final int monthlyPoints;
  final int rank;
  final List<BadgeModel> badges;

  const GamificationProfile({
    required this.totalPoints,
    required this.weeklyPoints,
    required this.monthlyPoints,
    required this.rank,
    this.badges = const [],
  });

  factory GamificationProfile.fromJson(Map<String, dynamic> json) {
    final badgesList = (json['badges'] as List<dynamic>?)
            ?.map((e) => BadgeModel.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [];

    return GamificationProfile(
      totalPoints: json['totalPoints'] as int? ?? 0,
      weeklyPoints: json['weeklyPoints'] as int? ?? 0,
      monthlyPoints: json['monthlyPoints'] as int? ?? 0,
      rank: json['rank'] as int? ?? 0,
      badges: badgesList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalPoints': totalPoints,
      'weeklyPoints': weeklyPoints,
      'monthlyPoints': monthlyPoints,
      'rank': rank,
      'badges': badges.map((b) => b.toJson()).toList(),
    };
  }
}

class BadgeModel {
  final String id;
  final String name;
  final String? description;
  final String? iconUrl;
  final Map<String, dynamic>? criteria;
  final int earnedCount;
  final bool isEarned;
  final DateTime? earnedAt;

  const BadgeModel({
    required this.id,
    required this.name,
    this.description,
    this.iconUrl,
    this.criteria,
    this.earnedCount = 0,
    this.isEarned = false,
    this.earnedAt,
  });

  factory BadgeModel.fromJson(Map<String, dynamic> json) {
    return BadgeModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      iconUrl: json['iconUrl'] as String?,
      criteria: json['criteria'] as Map<String, dynamic>?,
      earnedCount: json['earnedCount'] as int? ?? 0,
      isEarned: json['isEarned'] as bool? ?? false,
      earnedAt: json['earnedAt'] != null
          ? DateTime.tryParse(json['earnedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'iconUrl': iconUrl,
      'criteria': criteria,
      'earnedCount': earnedCount,
      'isEarned': isEarned,
      'earnedAt': earnedAt?.toIso8601String(),
    };
  }

  /// Get criteria description in Spanish.
  String get criteriaDescription {
    if (description != null && description!.isNotEmpty) return description!;
    if (criteria == null) return 'Insignia especial';

    final type = criteria!['type'] as String?;
    final value = criteria!['value'];

    switch (type) {
      case 'POINTS':
        return 'Alcanza $value puntos';
      case 'TASKS_COMPLETED':
        return 'Completa $value tareas';
      case 'STREAK_DAYS':
        return 'Manten una racha de $value dias';
      case 'CHECKLISTS_COMPLETED':
        return 'Completa $value checklists';
      case 'ISSUES_RESOLVED':
        return 'Resuelve $value incidencias';
      case 'AUDITS_PASSED':
        return 'Aprueba $value auditorias';
      default:
        return 'Insignia especial';
    }
  }

  /// Percentage of users who have earned this badge (for detail view).
  String get earnRateLabel {
    if (earnedCount <= 0) return 'Nadie la ha obtenido aun';
    if (earnedCount == 1) return '1 persona la ha obtenido';
    return '$earnedCount personas la han obtenido';
  }
}

// ==================== Individual Leaderboard ====================

class LeaderboardEntry {
  final String userId;
  final String userName;
  final String? role;
  final String? storeName;
  final String? departmentName;
  final int totalPoints;
  final int weeklyPoints;
  final int monthlyPoints;
  final int rank;

  const LeaderboardEntry({
    required this.userId,
    required this.userName,
    this.role,
    this.storeName,
    this.departmentName,
    required this.totalPoints,
    required this.weeklyPoints,
    required this.monthlyPoints,
    required this.rank,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      role: json['role'] as String?,
      storeName: json['storeName'] as String?,
      departmentName: json['departmentName'] as String?,
      totalPoints: json['totalPoints'] as int? ?? 0,
      weeklyPoints: json['weeklyPoints'] as int? ?? 0,
      monthlyPoints: json['monthlyPoints'] as int? ?? 0,
      rank: json['rank'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'userName': userName,
      'role': role,
      'storeName': storeName,
      'departmentName': departmentName,
      'totalPoints': totalPoints,
      'weeklyPoints': weeklyPoints,
      'monthlyPoints': monthlyPoints,
      'rank': rank,
    };
  }

  bool get isPodium => rank >= 1 && rank <= 3;

  int pointsForPeriod(String period) {
    switch (period) {
      case 'weekly':
        return weeklyPoints;
      case 'monthly':
        return monthlyPoints;
      case 'allTime':
        return totalPoints;
      default:
        return totalPoints;
    }
  }
}

// ==================== Store Leaderboard ====================

class StoreLeaderboardEntry {
  final String storeId;
  final String storeName;
  final String? storeCode;
  final String? tier;
  final String? regionName;
  final int weeklyPoints;
  final int monthlyPoints;
  final int totalPoints;
  final double perCapitaScore;
  final double? complianceRate;
  final int employeeCount;
  final int rank;

  const StoreLeaderboardEntry({
    required this.storeId,
    required this.storeName,
    this.storeCode,
    this.tier,
    this.regionName,
    required this.weeklyPoints,
    required this.monthlyPoints,
    required this.totalPoints,
    required this.perCapitaScore,
    this.complianceRate,
    required this.employeeCount,
    required this.rank,
  });

  factory StoreLeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return StoreLeaderboardEntry(
      storeId: json['storeId'] as String,
      storeName: json['storeName'] as String,
      storeCode: json['storeCode'] as String?,
      tier: json['tier'] as String?,
      regionName: json['regionName'] as String?,
      weeklyPoints: json['weeklyPoints'] as int? ?? 0,
      monthlyPoints: json['monthlyPoints'] as int? ?? 0,
      totalPoints: json['totalPoints'] as int? ?? 0,
      perCapitaScore: (json['perCapitaScore'] as num?)?.toDouble() ?? 0.0,
      complianceRate: (json['complianceRate'] as num?)?.toDouble(),
      employeeCount: json['employeeCount'] as int? ?? 0,
      rank: json['rank'] as int? ?? 0,
    );
  }

  bool get isPodium => rank >= 1 && rank <= 3;

  int pointsForPeriod(String period) {
    switch (period) {
      case 'weekly':
        return weeklyPoints;
      case 'monthly':
        return monthlyPoints;
      case 'allTime':
        return totalPoints;
      default:
        return totalPoints;
    }
  }

  String get tierLabel {
    switch (tier) {
      case 'SMALL':
        return 'Pequena';
      case 'MEDIUM':
        return 'Mediana';
      case 'LARGE':
        return 'Grande';
      default:
        return '';
    }
  }
}

// ==================== Department Leaderboard ====================

class DepartmentLeaderboardEntry {
  final String departmentId;
  final String departmentName;
  final String storeId;
  final String storeName;
  final int weeklyPoints;
  final int monthlyPoints;
  final int totalPoints;
  final double perCapitaScore;
  final int employeeCount;
  final int rank;

  const DepartmentLeaderboardEntry({
    required this.departmentId,
    required this.departmentName,
    required this.storeId,
    required this.storeName,
    required this.weeklyPoints,
    required this.monthlyPoints,
    required this.totalPoints,
    required this.perCapitaScore,
    required this.employeeCount,
    required this.rank,
  });

  factory DepartmentLeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return DepartmentLeaderboardEntry(
      departmentId: json['departmentId'] as String,
      departmentName: json['departmentName'] as String,
      storeId: json['storeId'] as String,
      storeName: json['storeName'] as String,
      weeklyPoints: json['weeklyPoints'] as int? ?? 0,
      monthlyPoints: json['monthlyPoints'] as int? ?? 0,
      totalPoints: json['totalPoints'] as int? ?? 0,
      perCapitaScore: (json['perCapitaScore'] as num?)?.toDouble() ?? 0.0,
      employeeCount: json['employeeCount'] as int? ?? 0,
      rank: json['rank'] as int? ?? 0,
    );
  }

  bool get isPodium => rank >= 1 && rank <= 3;

  int pointsForPeriod(String period) {
    switch (period) {
      case 'weekly':
        return weeklyPoints;
      case 'monthly':
        return monthlyPoints;
      case 'allTime':
        return totalPoints;
      default:
        return totalPoints;
    }
  }
}
