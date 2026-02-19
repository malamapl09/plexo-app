import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:plexo_ops/features/training/data/models/training_model.dart';
import 'package:plexo_ops/features/training/presentation/providers/training_provider.dart';

class TrainingQuizPage extends ConsumerStatefulWidget {
  final String enrollmentId;
  final String lessonId;
  final TrainingEnrollment? enrollment;
  final TrainingLesson? lesson;

  const TrainingQuizPage({
    super.key,
    required this.enrollmentId,
    required this.lessonId,
    this.enrollment,
    this.lesson,
  });

  @override
  ConsumerState<TrainingQuizPage> createState() => _TrainingQuizPageState();
}

class _TrainingQuizPageState extends ConsumerState<TrainingQuizPage> {
  int _currentIndex = 0;
  final Map<String, int> _selectedAnswers = {};
  Map<String, dynamic>? _results;

  List<TrainingQuizQuestion> get questions =>
      widget.lesson?.questions ?? [];

  bool get _hasAnsweredCurrent {
    if (questions.isEmpty) return false;
    return _selectedAnswers.containsKey(questions[_currentIndex].id);
  }

  bool get _allAnswered =>
      questions.every((q) => _selectedAnswers.containsKey(q.id));

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final state = ref.watch(trainingProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.lesson?.title ?? 'Evaluacion'),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
      ),
      body: questions.isEmpty
          ? const Center(child: Text('No hay preguntas disponibles'))
          : _results != null
              ? _buildResultsView(theme, colorScheme)
              : _buildQuizView(theme, colorScheme, state),
    );
  }

  Widget _buildQuizView(
      ThemeData theme, ColorScheme colorScheme, TrainingState state) {
    final question = questions[_currentIndex];

    return Column(
      children: [
        // Progress header
        Container(
          padding: const EdgeInsets.all(16),
          color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
          child: Row(
            children: [
              Text(
                'Pregunta ${_currentIndex + 1} de ${questions.length}',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Text(
                '${_selectedAnswers.length}/${questions.length} respondidas',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        // Progress bar
        LinearProgressIndicator(
          value: (_currentIndex + 1) / questions.length,
          minHeight: 3,
          backgroundColor: colorScheme.surfaceContainerHighest,
          valueColor: AlwaysStoppedAnimation<Color>(colorScheme.primary),
        ),

        // Question content
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  question.questionText,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),
                ...question.options.asMap().entries.map((entry) {
                  final index = entry.key;
                  final option = entry.value;
                  final isSelected =
                      _selectedAnswers[question.id] == index;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Material(
                      color: isSelected
                          ? colorScheme.primary.withValues(alpha: 0.1)
                          : colorScheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      child: InkWell(
                        onTap: () {
                          setState(() {
                            _selectedAnswers[question.id] = index;
                          });
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: isSelected
                                  ? colorScheme.primary
                                  : colorScheme.outline.withValues(alpha: 0.3),
                              width: isSelected ? 2 : 1,
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isSelected
                                      ? colorScheme.primary
                                      : Colors.transparent,
                                  border: Border.all(
                                    color: isSelected
                                        ? colorScheme.primary
                                        : colorScheme.outline,
                                    width: 2,
                                  ),
                                ),
                                child: isSelected
                                    ? Icon(Icons.check,
                                        size: 16,
                                        color: colorScheme.onPrimary)
                                    : null,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  option.text,
                                  style: theme.textTheme.bodyLarge?.copyWith(
                                    fontWeight: isSelected
                                        ? FontWeight.w600
                                        : FontWeight.normal,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),

        // Navigation buttons
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (_currentIndex > 0)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        setState(() => _currentIndex--);
                      },
                      icon: const Icon(Icons.arrow_back),
                      label: const Text('Anterior'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                if (_currentIndex > 0) const SizedBox(width: 12),
                Expanded(
                  child: _currentIndex < questions.length - 1
                      ? ElevatedButton.icon(
                          onPressed: _hasAnsweredCurrent
                              ? () {
                                  setState(() => _currentIndex++);
                                }
                              : null,
                          icon: const Icon(Icons.arrow_forward),
                          label: const Text('Siguiente'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: colorScheme.primary,
                            foregroundColor: colorScheme.onPrimary,
                            padding:
                                const EdgeInsets.symmetric(vertical: 14),
                          ),
                        )
                      : ElevatedButton.icon(
                          onPressed:
                              _allAnswered && !state.isSubmitting
                                  ? _submitQuiz
                                  : null,
                          icon: state.isSubmitting
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2),
                                )
                              : const Icon(Icons.send),
                          label: Text(state.isSubmitting
                              ? 'Enviando...'
                              : 'Enviar Respuestas'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            foregroundColor: Colors.white,
                            padding:
                                const EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _submitQuiz() async {
    final answers = questions.map((q) {
      return {
        'questionId': q.id,
        'selectedOptionIndex': _selectedAnswers[q.id] ?? 0,
      };
    }).toList();

    final results = await ref.read(trainingProvider.notifier).submitQuiz(
          widget.enrollmentId,
          widget.lessonId,
          answers,
        );

    if (results != null && mounted) {
      setState(() => _results = results);
    }
  }

  Widget _buildResultsView(ThemeData theme, ColorScheme colorScheme) {
    final score = (_results?['score'] as num?)?.toInt() ?? 0;
    final passingScore = widget.enrollment?.course?.passingScore ?? 70;
    final passed = score >= passingScore;
    final questionResults =
        (_results?['results'] as List<dynamic>?) ?? [];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Score card
        Card(
          color: passed
              ? Colors.green.withValues(alpha: 0.1)
              : Colors.red.withValues(alpha: 0.1),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(
              color: passed ? Colors.green : Colors.red,
              width: 2,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Icon(
                  passed ? Icons.emoji_events : Icons.refresh,
                  size: 56,
                  color: passed ? Colors.green : Colors.red,
                ),
                const SizedBox(height: 12),
                Text(
                  passed ? 'Aprobado!' : 'No Aprobado',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: passed ? Colors.green : Colors.red,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Puntuacion: $score%',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        Text(
          'Resultados por pregunta',
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),

        // Question results
        ...questionResults.asMap().entries.map((entry) {
          final i = entry.key;
          final result = entry.value as Map<String, dynamic>;
          final isCorrect = result['isCorrect'] as bool? ?? false;
          final explanation = result['explanation'] as String?;

          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
              side: BorderSide(
                color: isCorrect ? Colors.green : Colors.red,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        isCorrect
                            ? Icons.check_circle
                            : Icons.cancel,
                        color: isCorrect ? Colors.green : Colors.red,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Pregunta ${i + 1}',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Text(
                        isCorrect ? 'Correcta' : 'Incorrecta',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isCorrect ? Colors.green : Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  if (explanation != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: colorScheme.surfaceContainerHighest
                            .withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline,
                              size: 16,
                              color: colorScheme.onSurfaceVariant),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              explanation,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          );
        }),

        const SizedBox(height: 16),
        if (!passed)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _results = null;
                  _selectedAnswers.clear();
                  _currentIndex = 0;
                });
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        if (!passed) const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: colorScheme.primary,
              foregroundColor: colorScheme.onPrimary,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            child: const Text('Volver al Curso'),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }
}
