import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:signature/signature.dart';

/// A widget for capturing digital signatures
class SignatureCaptureWidget extends StatefulWidget {
  final void Function(Uint8List signatureBytes)? onSignatureCaptured;
  final VoidCallback? onClear;
  final Uint8List? initialSignature;
  final double height;
  final Color backgroundColor;
  final Color penColor;
  final double penStrokeWidth;
  final bool readOnly;
  final String label;

  const SignatureCaptureWidget({
    super.key,
    this.onSignatureCaptured,
    this.onClear,
    this.initialSignature,
    this.height = 200,
    this.backgroundColor = Colors.white,
    this.penColor = Colors.black,
    this.penStrokeWidth = 2.0,
    this.readOnly = false,
    this.label = 'Firma',
  });

  @override
  State<SignatureCaptureWidget> createState() => _SignatureCaptureWidgetState();
}

class _SignatureCaptureWidgetState extends State<SignatureCaptureWidget> {
  late final SignatureController _controller;
  bool _hasSignature = false;
  bool _isExporting = false;

  @override
  void initState() {
    super.initState();
    _hasSignature = widget.initialSignature != null;
    _controller = SignatureController(
      penStrokeWidth: widget.penStrokeWidth,
      penColor: widget.penColor,
      exportBackgroundColor: widget.backgroundColor,
    );
    _controller.addListener(_onSignatureChanged);
  }

  @override
  void dispose() {
    _controller.removeListener(_onSignatureChanged);
    _controller.dispose();
    super.dispose();
  }

  void _onSignatureChanged() {
    final isNotEmpty = _controller.isNotEmpty;
    if (isNotEmpty != _hasSignature) {
      setState(() => _hasSignature = isNotEmpty);
    }
  }

  Future<void> _exportSignature() async {
    if (_isExporting || _controller.isEmpty) return;

    setState(() => _isExporting = true);

    try {
      final bytes = await _controller.toPngBytes();
      if (bytes != null && widget.onSignatureCaptured != null) {
        widget.onSignatureCaptured!(bytes);
      }
    } catch (e) {
      debugPrint('Error exporting signature: $e');
    } finally {
      if (mounted) {
        setState(() => _isExporting = false);
      }
    }
  }

  void _clearSignature() {
    _controller.clear();
    setState(() => _hasSignature = false);
    widget.onClear?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(
            widget.label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Colors.grey[700],
            ),
          ),
        ),
        Container(
          height: widget.height,
          decoration: BoxDecoration(
            color: widget.backgroundColor,
            border: Border.all(color: Colors.grey[300]!, width: 1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Stack(
            children: [
              if (!widget.readOnly)
                ClipRRect(
                  borderRadius: BorderRadius.circular(7),
                  child: GestureDetector(
                    onPanEnd: (_) => _exportSignature(),
                    child: Signature(
                      controller: _controller,
                      backgroundColor: widget.backgroundColor,
                    ),
                  ),
                ),
              if (widget.readOnly && widget.initialSignature != null)
                Center(
                  child: Image.memory(
                    widget.initialSignature!,
                    fit: BoxFit.contain,
                  ),
                ),
              if (!_hasSignature && widget.initialSignature == null)
                IgnorePointer(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.draw_outlined, size: 48, color: Colors.grey[400]),
                        const SizedBox(height: 8),
                        Text(
                          widget.readOnly ? 'Sin firma' : 'Toque para firmar',
                          style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                        ),
                      ],
                    ),
                  ),
                ),
              if (!widget.readOnly && _hasSignature)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _clearSignature,
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.clear, size: 20, color: Colors.grey),
                      ),
                    ),
                  ),
                ),
              if (_isExporting)
                Container(
                  color: Colors.white.withValues(alpha: 0.7),
                  child: const Center(child: CircularProgressIndicator()),
                ),
            ],
          ),
        ),
        if (!widget.readOnly)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Firme con el dedo en el recuadro',
              style: TextStyle(fontSize: 12, color: Colors.grey[500]),
            ),
          ),
      ],
    );
  }
}

/// A modal dialog for capturing signatures
class SignatureCaptureDialog extends StatefulWidget {
  final String title;
  final String confirmButtonText;
  final String cancelButtonText;

  const SignatureCaptureDialog({
    super.key,
    this.title = 'Capturar Firma',
    this.confirmButtonText = 'Confirmar',
    this.cancelButtonText = 'Cancelar',
  });

  static Future<Uint8List?> show(
    BuildContext context, {
    String title = 'Capturar Firma',
    String confirmButtonText = 'Confirmar',
    String cancelButtonText = 'Cancelar',
  }) async {
    return showDialog<Uint8List>(
      context: context,
      builder: (context) => SignatureCaptureDialog(
        title: title,
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
      ),
    );
  }

  @override
  State<SignatureCaptureDialog> createState() => _SignatureCaptureDialogState();
}

class _SignatureCaptureDialogState extends State<SignatureCaptureDialog> {
  Uint8List? _signatureBytes;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: SizedBox(
        width: MediaQuery.of(context).size.width * 0.9,
        child: SignatureCaptureWidget(
          height: 250,
          onSignatureCaptured: (bytes) {
            setState(() => _signatureBytes = bytes);
          },
          onClear: () {
            setState(() => _signatureBytes = null);
          },
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(widget.cancelButtonText),
        ),
        ElevatedButton(
          onPressed: _signatureBytes != null
              ? () => Navigator.of(context).pop(_signatureBytes)
              : null,
          child: Text(widget.confirmButtonText),
        ),
      ],
    );
  }
}
