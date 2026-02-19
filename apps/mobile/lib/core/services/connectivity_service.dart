import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum ConnectionStatus {
  online,
  offline,
  unknown,
}

class ConnectivityState {
  final ConnectionStatus status;
  final DateTime? lastOnlineAt;
  final bool isInitialized;

  const ConnectivityState({
    this.status = ConnectionStatus.unknown,
    this.lastOnlineAt,
    this.isInitialized = false,
  });

  bool get isOnline => status == ConnectionStatus.online;
  bool get isOffline => status == ConnectionStatus.offline;

  ConnectivityState copyWith({
    ConnectionStatus? status,
    DateTime? lastOnlineAt,
    bool? isInitialized,
  }) {
    return ConnectivityState(
      status: status ?? this.status,
      lastOnlineAt: lastOnlineAt ?? this.lastOnlineAt,
      isInitialized: isInitialized ?? this.isInitialized,
    );
  }
}

class ConnectivityNotifier extends StateNotifier<ConnectivityState> {
  final Connectivity _connectivity;
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  ConnectivityNotifier({Connectivity? connectivity})
      : _connectivity = connectivity ?? Connectivity(),
        super(const ConnectivityState()) {
    _init();
  }

  Future<void> _init() async {
    // Check initial connectivity
    final results = await _connectivity.checkConnectivity();
    _updateStatus(results);

    // Listen for changes
    _subscription = _connectivity.onConnectivityChanged.listen(_updateStatus);

    state = state.copyWith(isInitialized: true);
  }

  void _updateStatus(List<ConnectivityResult> results) {
    final hasConnection = results.any((result) =>
        result == ConnectivityResult.wifi ||
        result == ConnectivityResult.mobile ||
        result == ConnectivityResult.ethernet);

    final newStatus =
        hasConnection ? ConnectionStatus.online : ConnectionStatus.offline;

    // Track when we were last online
    final lastOnlineAt = newStatus == ConnectionStatus.online
        ? DateTime.now()
        : state.lastOnlineAt;

    state = state.copyWith(
      status: newStatus,
      lastOnlineAt: lastOnlineAt,
    );
  }

  Future<bool> checkConnectivity() async {
    final results = await _connectivity.checkConnectivity();
    _updateStatus(results);
    return state.isOnline;
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

// Provider for connectivity state
final connectivityProvider =
    StateNotifierProvider<ConnectivityNotifier, ConnectivityState>((ref) {
  return ConnectivityNotifier();
});

// Convenience provider for quick online check
final isOnlineProvider = Provider<bool>((ref) {
  return ref.watch(connectivityProvider).isOnline;
});

// Provider that updates when connectivity changes
final connectivityStreamProvider = StreamProvider<ConnectionStatus>((ref) {
  final connectivity = Connectivity();

  return connectivity.onConnectivityChanged.map((results) {
    final hasConnection = results.any((result) =>
        result == ConnectivityResult.wifi ||
        result == ConnectivityResult.mobile ||
        result == ConnectivityResult.ethernet);

    return hasConnection ? ConnectionStatus.online : ConnectionStatus.offline;
  });
});
