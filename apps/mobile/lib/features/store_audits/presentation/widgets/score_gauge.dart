import 'package:flutter/material.dart';

/// Circular progress gauge that displays an audit score as a percentage.
///
/// The ring colour transitions from red (low scores) through amber to green
/// (high scores) based on the [score] value (0-100).
class ScoreGauge extends StatelessWidget {
  /// Score value from 0 to 100.
  final double score;

  /// Diameter of the gauge.
  final double size;

  /// Thickness of the progress arc.
  final double strokeWidth;

  /// Optional label shown below the score text.
  final String? label;

  const ScoreGauge({
    super.key,
    required this.score,
    this.size = 120,
    this.strokeWidth = 10,
    this.label,
  });

  @override
  Widget build(BuildContext context) {
    final clampedScore = score.clamp(0.0, 100.0);
    final color = _colorForScore(clampedScore);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background ring
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              value: 1.0,
              strokeWidth: strokeWidth,
              color: Theme.of(context).dividerColor.withOpacity(0.2),
              strokeCap: StrokeCap.round,
            ),
          ),
          // Foreground arc
          SizedBox(
            width: size,
            height: size,
            child: TweenAnimationBuilder<double>(
              tween: Tween<double>(begin: 0, end: clampedScore / 100),
              duration: const Duration(milliseconds: 800),
              curve: Curves.easeOutCubic,
              builder: (context, value, _) {
                return CircularProgressIndicator(
                  value: value,
                  strokeWidth: strokeWidth,
                  color: color,
                  strokeCap: StrokeCap.round,
                );
              },
            ),
          ),
          // Center text
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${clampedScore.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: size * 0.22,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              if (label != null)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    label!,
                    style: TextStyle(
                      fontSize: size * 0.1,
                      color: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.color
                          ?.withOpacity(0.7),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Color _colorForScore(double s) {
    if (s >= 80) return Colors.green;
    if (s >= 60) return Colors.amber.shade700;
    if (s >= 40) return Colors.orange;
    return Colors.red;
  }
}
