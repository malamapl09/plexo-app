import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:plexo_ops/features/store_audits/data/models/audit_template_model.dart';
import 'package:plexo_ops/features/store_audits/data/models/store_audit_model.dart';

/// Callback signature when the user finishes answering a question.
typedef OnAnswerSubmitted = void Function({
  required String questionId,
  int? score,
  bool? booleanValue,
  String? textValue,
  List<String>? photoUrls,
  String? notes,
});

/// Renders a single [AuditQuestion] with the appropriate input control
/// depending on the question type (SCORE, YES_NO, TEXT). Also shows a
/// photo capture button when the question requires a photo.
class QuestionWidget extends StatefulWidget {
  final AuditQuestion question;
  final AuditAnswer? existingAnswer;
  final OnAnswerSubmitted onAnswerSubmitted;
  final int questionIndex;

  const QuestionWidget({
    super.key,
    required this.question,
    this.existingAnswer,
    required this.onAnswerSubmitted,
    required this.questionIndex,
  });

  @override
  State<QuestionWidget> createState() => _QuestionWidgetState();
}

class _QuestionWidgetState extends State<QuestionWidget> {
  late int _scoreValue;
  late bool _booleanValue;
  late TextEditingController _textController;
  late TextEditingController _notesController;
  final List<File> _photos = [];
  final _imagePicker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _scoreValue = widget.existingAnswer?.score ?? 0;
    _booleanValue = widget.existingAnswer?.booleanValue ?? true;
    _textController =
        TextEditingController(text: widget.existingAnswer?.textValue ?? '');
    _notesController =
        TextEditingController(text: widget.existingAnswer?.notes ?? '');
  }

  @override
  void didUpdateWidget(covariant QuestionWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.question.id != widget.question.id) {
      _scoreValue = widget.existingAnswer?.score ?? 0;
      _booleanValue = widget.existingAnswer?.booleanValue ?? true;
      _textController.text = widget.existingAnswer?.textValue ?? '';
      _notesController.text = widget.existingAnswer?.notes ?? '';
      _photos.clear();
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _submit() {
    widget.onAnswerSubmitted(
      questionId: widget.question.id,
      score: widget.question.questionType == QuestionType.score
          ? _scoreValue
          : null,
      booleanValue: widget.question.questionType == QuestionType.yesNo
          ? _booleanValue
          : null,
      textValue: widget.question.questionType == QuestionType.text
          ? _textController.text
          : null,
      notes: _notesController.text.isNotEmpty ? _notesController.text : null,
    );
  }

  Future<void> _pickPhoto(ImageSource source) async {
    try {
      final pickedFile = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        setState(() {
          _photos.add(File(pickedFile.path));
        });
      }
    } catch (e) {
      // ignore: avoid_print
      print('Error picking image: $e');
    }
  }

  void _showPhotoOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Tomar Foto'),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Seleccionar de Galeria'),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final q = widget.question;
    final hasExistingAnswer = widget.existingAnswer != null;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: hasExistingAnswer
            ? theme.colorScheme.primaryContainer.withOpacity(0.08)
            : theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: hasExistingAnswer
              ? theme.colorScheme.primary.withOpacity(0.3)
              : theme.dividerColor.withOpacity(0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Question header
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: hasExistingAnswer
                      ? theme.colorScheme.primary
                      : theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: hasExistingAnswer
                    ? const Icon(Icons.check, size: 16, color: Colors.white)
                    : Text(
                        '${widget.questionIndex + 1}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      q.text,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${q.questionTypeLabel} | Max: ${q.maxScore} pts',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.textTheme.bodySmall?.color
                            ?.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
              if (q.requiresPhoto)
                Tooltip(
                  message: 'Requiere foto',
                  child: Icon(
                    Icons.camera_alt_outlined,
                    size: 18,
                    color: theme.colorScheme.primary,
                  ),
                ),
            ],
          ),

          const SizedBox(height: 16),

          // Input control based on question type
          _buildInputControl(theme, q),

          // Notes field
          const SizedBox(height: 12),
          TextField(
            controller: _notesController,
            decoration: InputDecoration(
              hintText: 'Notas (opcional)',
              border: const OutlineInputBorder(),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              isDense: true,
              hintStyle: theme.textTheme.bodySmall?.copyWith(
                color: theme.hintColor,
              ),
            ),
            style: theme.textTheme.bodySmall,
            maxLines: 2,
          ),

          // Photo capture
          if (q.requiresPhoto) ...[
            const SizedBox(height: 12),
            _buildPhotoSection(theme),
          ],

          // Submit button
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.tonal(
              onPressed: _submit,
              child: Text(
                hasExistingAnswer ? 'Actualizar Respuesta' : 'Guardar Respuesta',
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputControl(ThemeData theme, AuditQuestion q) {
    switch (q.questionType) {
      case QuestionType.score:
        return _buildScoreInput(theme, q);
      case QuestionType.yesNo:
        return _buildYesNoInput(theme);
      case QuestionType.text:
        return _buildTextInput(theme);
    }
  }

  // -----------------------------------------------------------------------
  // SCORE Input
  // -----------------------------------------------------------------------
  Widget _buildScoreInput(ThemeData theme, AuditQuestion q) {
    final fraction = q.maxScore > 0 ? _scoreValue / q.maxScore : 0.0;
    final Color sliderColor;
    if (fraction >= 0.8) {
      sliderColor = Colors.green;
    } else if (fraction >= 0.5) {
      sliderColor = Colors.amber.shade700;
    } else {
      sliderColor = Colors.red;
    }

    return Column(
      children: [
        Row(
          children: [
            Text(
              '0',
              style: theme.textTheme.bodySmall,
            ),
            Expanded(
              child: SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: sliderColor,
                  thumbColor: sliderColor,
                  overlayColor: sliderColor.withOpacity(0.12),
                  inactiveTrackColor: sliderColor.withOpacity(0.2),
                ),
                child: Slider(
                  value: _scoreValue.toDouble(),
                  min: 0,
                  max: q.maxScore.toDouble(),
                  divisions: q.maxScore > 0 ? q.maxScore : 1,
                  label: '$_scoreValue',
                  onChanged: (value) {
                    setState(() {
                      _scoreValue = value.round();
                    });
                  },
                ),
              ),
            ),
            Text(
              '${q.maxScore}',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
        Text(
          '$_scoreValue / ${q.maxScore}',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: sliderColor,
          ),
        ),
      ],
    );
  }

  // -----------------------------------------------------------------------
  // YES/NO Input
  // -----------------------------------------------------------------------
  Widget _buildYesNoInput(ThemeData theme) {
    return Row(
      children: [
        Expanded(
          child: _ToggleOption(
            label: 'Si',
            icon: Icons.check_circle_outline,
            isSelected: _booleanValue,
            selectedColor: Colors.green,
            onTap: () => setState(() => _booleanValue = true),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _ToggleOption(
            label: 'No',
            icon: Icons.cancel_outlined,
            isSelected: !_booleanValue,
            selectedColor: Colors.red,
            onTap: () => setState(() => _booleanValue = false),
          ),
        ),
      ],
    );
  }

  // -----------------------------------------------------------------------
  // TEXT Input
  // -----------------------------------------------------------------------
  Widget _buildTextInput(ThemeData theme) {
    return TextField(
      controller: _textController,
      decoration: const InputDecoration(
        hintText: 'Escribe tu respuesta...',
        border: OutlineInputBorder(),
      ),
      maxLines: 3,
      maxLength: 1000,
    );
  }

  // -----------------------------------------------------------------------
  // Photo section
  // -----------------------------------------------------------------------
  Widget _buildPhotoSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.camera_alt, size: 16, color: theme.colorScheme.primary),
            const SizedBox(width: 6),
            Text(
              'Foto requerida',
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.primary,
              ),
            ),
            const Spacer(),
            TextButton.icon(
              onPressed: _showPhotoOptions,
              icon: const Icon(Icons.add_a_photo, size: 16),
              label: const Text('Agregar'),
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
              ),
            ),
          ],
        ),
        if (_photos.isNotEmpty) ...[
          const SizedBox(height: 8),
          SizedBox(
            height: 70,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _photos.length,
              itemBuilder: (context, index) {
                return Stack(
                  children: [
                    Container(
                      width: 70,
                      height: 70,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        image: DecorationImage(
                          image: FileImage(_photos[index]),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    Positioned(
                      top: 2,
                      right: 10,
                      child: GestureDetector(
                        onTap: () {
                          setState(() => _photos.removeAt(index));
                        },
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close,
                              size: 12, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
        // Show existing server photos
        if (widget.existingAnswer != null &&
            widget.existingAnswer!.photoUrls.isNotEmpty) ...[
          const SizedBox(height: 8),
          SizedBox(
            height: 70,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: widget.existingAnswer!.photoUrls.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      widget.existingAnswer!.photoUrls[index],
                      width: 70,
                      height: 70,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 70,
                        height: 70,
                        color: Colors.grey[300],
                        child: const Icon(Icons.broken_image, size: 20),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ],
    );
  }
}

/// A toggleable option chip used for the YES/NO question type.
class _ToggleOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final Color selectedColor;
  final VoidCallback onTap;

  const _ToggleOption({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.selectedColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color:
              isSelected ? selectedColor.withOpacity(0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? selectedColor : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? selectedColor : Colors.grey.shade500,
              size: 22,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? selectedColor : Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
