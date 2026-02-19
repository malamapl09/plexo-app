enum SupplierType { distributionCenter, thirdParty }

enum ReceivingStatus { pending, inProgress, completed, withIssue, didNotArrive }

enum DiscrepancyType { missing, damaged, wrongProduct }

class ReceivingModel {
  final String id;
  final String storeId;
  final StoreInfo store;
  final SupplierType supplierType;
  final String supplierName;
  final String? poNumber;
  final DateTime? scheduledTime;
  final DateTime? arrivalTime;
  final ReceivingStatus status;
  final UserInfo? verifiedBy;
  final String? notes;
  final List<String> photoUrls;
  final String? signatureUrl;
  final String? driverName;
  final String? truckPlate;
  final int? itemCount;
  final List<DiscrepancyModel> discrepancies;
  final int discrepancyCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  ReceivingModel({
    required this.id,
    required this.storeId,
    required this.store,
    required this.supplierType,
    required this.supplierName,
    this.poNumber,
    this.scheduledTime,
    this.arrivalTime,
    required this.status,
    this.verifiedBy,
    this.notes,
    required this.photoUrls,
    this.signatureUrl,
    this.driverName,
    this.truckPlate,
    this.itemCount,
    required this.discrepancies,
    required this.discrepancyCount,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ReceivingModel.fromJson(Map<String, dynamic> json) {
    return ReceivingModel(
      id: json['id'],
      storeId: json['storeId'],
      store: StoreInfo.fromJson(json['store']),
      supplierType: _parseSupplierType(json['supplierType']),
      supplierName: json['supplierName'],
      poNumber: json['poNumber'],
      scheduledTime: json['scheduledTime'] != null
          ? DateTime.parse(json['scheduledTime'])
          : null,
      arrivalTime: json['arrivalTime'] != null
          ? DateTime.parse(json['arrivalTime'])
          : null,
      status: _parseReceivingStatus(json['status']),
      verifiedBy: json['verifiedBy'] != null
          ? UserInfo.fromJson(json['verifiedBy'])
          : null,
      notes: json['notes'],
      photoUrls: List<String>.from(json['photoUrls'] ?? []),
      signatureUrl: json['signatureUrl'],
      driverName: json['driverName'],
      truckPlate: json['truckPlate'],
      itemCount: json['itemCount'],
      discrepancies: (json['discrepancies'] as List?)
              ?.map((d) => DiscrepancyModel.fromJson(d))
              .toList() ??
          [],
      discrepancyCount: json['discrepancyCount'] ?? 0,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  bool get isPending => status == ReceivingStatus.pending;
  bool get isInProgress => status == ReceivingStatus.inProgress;
  bool get isCompleted =>
      status == ReceivingStatus.completed || status == ReceivingStatus.withIssue;
  bool get hasIssues =>
      status == ReceivingStatus.withIssue || discrepancyCount > 0;

  String get supplierTypeLabel {
    switch (supplierType) {
      case SupplierType.distributionCenter:
        return 'Centro de Distribución';
      case SupplierType.thirdParty:
        return 'Proveedor Externo';
    }
  }

  String get statusLabel {
    switch (status) {
      case ReceivingStatus.pending:
        return 'Pendiente';
      case ReceivingStatus.inProgress:
        return 'En Proceso';
      case ReceivingStatus.completed:
        return 'Completada';
      case ReceivingStatus.withIssue:
        return 'Con Incidencias';
      case ReceivingStatus.didNotArrive:
        return 'No Llegó';
    }
  }

  static SupplierType _parseSupplierType(String value) {
    switch (value) {
      case 'DISTRIBUTION_CENTER':
        return SupplierType.distributionCenter;
      case 'THIRD_PARTY':
        return SupplierType.thirdParty;
      default:
        return SupplierType.thirdParty;
    }
  }

  static ReceivingStatus _parseReceivingStatus(String value) {
    switch (value) {
      case 'PENDING':
        return ReceivingStatus.pending;
      case 'IN_PROGRESS':
        return ReceivingStatus.inProgress;
      case 'COMPLETED':
        return ReceivingStatus.completed;
      case 'WITH_ISSUE':
        return ReceivingStatus.withIssue;
      case 'DID_NOT_ARRIVE':
        return ReceivingStatus.didNotArrive;
      default:
        return ReceivingStatus.pending;
    }
  }
}

class DiscrepancyModel {
  final String id;
  final DiscrepancyType type;
  final String productInfo;
  final int? quantity;
  final String? notes;
  final List<String> photoUrls;
  final DateTime createdAt;

  DiscrepancyModel({
    required this.id,
    required this.type,
    required this.productInfo,
    this.quantity,
    this.notes,
    required this.photoUrls,
    required this.createdAt,
  });

  factory DiscrepancyModel.fromJson(Map<String, dynamic> json) {
    return DiscrepancyModel(
      id: json['id'],
      type: _parseDiscrepancyType(json['type']),
      productInfo: json['productInfo'],
      quantity: json['quantity'],
      notes: json['notes'],
      photoUrls: List<String>.from(json['photoUrls'] ?? []),
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  String get typeLabel {
    switch (type) {
      case DiscrepancyType.missing:
        return 'Faltante';
      case DiscrepancyType.damaged:
        return 'Dañado';
      case DiscrepancyType.wrongProduct:
        return 'Producto Incorrecto';
    }
  }

  static DiscrepancyType _parseDiscrepancyType(String value) {
    switch (value) {
      case 'MISSING':
        return DiscrepancyType.missing;
      case 'DAMAGED':
        return DiscrepancyType.damaged;
      case 'WRONG_PRODUCT':
        return DiscrepancyType.wrongProduct;
      default:
        return DiscrepancyType.missing;
    }
  }
}

class StoreInfo {
  final String id;
  final String name;
  final String code;

  StoreInfo({
    required this.id,
    required this.name,
    required this.code,
  });

  factory StoreInfo.fromJson(Map<String, dynamic> json) {
    return StoreInfo(
      id: json['id'],
      name: json['name'],
      code: json['code'],
    );
  }
}

class UserInfo {
  final String id;
  final String name;

  UserInfo({
    required this.id,
    required this.name,
  });

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'],
      name: json['name'],
    );
  }
}

class ReceivingStats {
  final int total;
  final int pending;
  final int inProgress;
  final int completed;
  final int withIssue;
  final int didNotArrive;
  final int totalDiscrepancies;

  ReceivingStats({
    required this.total,
    required this.pending,
    required this.inProgress,
    required this.completed,
    required this.withIssue,
    required this.didNotArrive,
    required this.totalDiscrepancies,
  });

  factory ReceivingStats.fromJson(Map<String, dynamic> json) {
    return ReceivingStats(
      total: json['total'] ?? 0,
      pending: json['pending'] ?? 0,
      inProgress: json['inProgress'] ?? 0,
      completed: json['completed'] ?? 0,
      withIssue: json['withIssue'] ?? 0,
      didNotArrive: json['didNotArrive'] ?? 0,
      totalDiscrepancies: json['totalDiscrepancies'] ?? 0,
    );
  }

  int get processed => completed + withIssue;
  double get completionRate => total > 0 ? (processed / total) * 100 : 0;
}
