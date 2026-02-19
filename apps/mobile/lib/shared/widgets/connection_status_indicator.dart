import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/core/services/socket_service.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';

/// A small indicator that shows the WebSocket connection status
class ConnectionStatusIndicator extends ConsumerWidget {
  final bool showLabel;

  const ConnectionStatusIndicator({
    super.key,
    this.showLabel = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectionState = ref.watch(socketConnectionStateProvider);

    return connectionState.when(
      data: (state) => _buildIndicator(context, state),
      loading: () => _buildIndicator(context, SocketConnectionState.connecting),
      error: (_, __) => _buildIndicator(context, SocketConnectionState.error),
    );
  }

  Widget _buildIndicator(BuildContext context, SocketConnectionState state) {
    Color color;
    String label;
    IconData icon;

    switch (state) {
      case SocketConnectionState.connected:
        color = Colors.green;
        label = 'Conectado';
        icon = Icons.wifi;
        break;
      case SocketConnectionState.connecting:
        color = Colors.orange;
        label = 'Conectando...';
        icon = Icons.wifi_find;
        break;
      case SocketConnectionState.disconnected:
        color = Colors.grey;
        label = 'Desconectado';
        icon = Icons.wifi_off;
        break;
      case SocketConnectionState.error:
        color = Colors.red;
        label = 'Error de conexión';
        icon = Icons.wifi_off;
        break;
    }

    if (showLabel) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
            ),
          ),
        ],
      );
    }

    return Tooltip(
      message: label,
      child: Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.4),
              blurRadius: 4,
              spreadRadius: 1,
            ),
          ],
        ),
      ),
    );
  }
}

/// A chip that shows connection status with more details
class ConnectionStatusChip extends ConsumerWidget {
  const ConnectionStatusChip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectionState = ref.watch(socketConnectionStateProvider);

    return connectionState.when(
      data: (state) => _buildChip(context, state),
      loading: () => _buildChip(context, SocketConnectionState.connecting),
      error: (_, __) => _buildChip(context, SocketConnectionState.error),
    );
  }

  Widget _buildChip(BuildContext context, SocketConnectionState state) {
    Color backgroundColor;
    Color textColor;
    String label;
    IconData icon;

    switch (state) {
      case SocketConnectionState.connected:
        backgroundColor = Colors.green.shade50;
        textColor = Colors.green.shade700;
        label = 'Tiempo real';
        icon = Icons.sync;
        break;
      case SocketConnectionState.connecting:
        backgroundColor = Colors.orange.shade50;
        textColor = Colors.orange.shade700;
        label = 'Conectando';
        icon = Icons.sync;
        break;
      case SocketConnectionState.disconnected:
        backgroundColor = Colors.grey.shade100;
        textColor = Colors.grey.shade600;
        label = 'Offline';
        icon = Icons.sync_disabled;
        break;
      case SocketConnectionState.error:
        backgroundColor = Colors.red.shade50;
        textColor = Colors.red.shade700;
        label = 'Error';
        icon = Icons.sync_problem;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: textColor),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
