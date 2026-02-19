import 'package:flutter/material.dart';

import 'package:plexo_ops/core/theme/app_theme.dart';

class PhotoComparisonWidget extends StatelessWidget {
  final List<String> referencePhotos;
  final List<String> submittedPhotos;

  const PhotoComparisonWidget({
    super.key,
    this.referencePhotos = const [],
    required this.submittedPhotos,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasReferencePhotos = referencePhotos.isNotEmpty;
    final submittedBorderColor = context.isDark
        ? theme.colorScheme.primary.withValues(alpha: 0.5)
        : theme.colorScheme.primary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (hasReferencePhotos) ...[
          // Side-by-side comparison
          SizedBox(
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: referencePhotos.length > submittedPhotos.length
                  ? referencePhotos.length
                  : submittedPhotos.length,
              itemBuilder: (context, index) {
                final hasReference = index < referencePhotos.length;
                final hasSubmitted = index < submittedPhotos.length;

                return Container(
                  width: MediaQuery.of(context).size.width * 0.85,
                  margin: const EdgeInsets.only(right: 16),
                  child: Column(
                    children: [
                      // Reference photo
                      if (hasReference) ...[
                        Text(
                          'Referencia ${index + 1}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color:
                                theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color:
                                    theme.colorScheme.outline.withValues(alpha: 0.3),
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                referencePhotos[index],
                                fit: BoxFit.cover,
                                width: double.infinity,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    color: theme.colorScheme.surfaceContainerHighest,
                                    child:
                                        const Icon(Icons.image_not_supported),
                                  );
                                },
                              ),
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      const Icon(Icons.compare_arrows, size: 20),
                      const SizedBox(height: 8),

                      // Submitted photo
                      if (hasSubmitted) ...[
                        Text(
                          'Enviada ${index + 1}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color:
                                theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: submittedBorderColor,
                                width: 2,
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.network(
                                submittedPhotos[index],
                                fit: BoxFit.cover,
                                width: double.infinity,
                                errorBuilder: (context, error, stackTrace) {
                                  return Container(
                                    color: theme.colorScheme.surfaceContainerHighest,
                                    child:
                                        const Icon(Icons.image_not_supported),
                                  );
                                },
                              ),
                            ),
                          ),
                        ),
                      ] else
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Center(
                              child: Text('Sin foto enviada'),
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ] else ...[
          // Just show submitted photos in a grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.2,
            ),
            itemCount: submittedPhotos.length,
            itemBuilder: (context, index) {
              return Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: submittedBorderColor,
                    width: 2,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    submittedPhotos[index],
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: theme.colorScheme.surfaceContainerHighest,
                        child: const Icon(Icons.image_not_supported),
                      );
                    },
                  ),
                ),
              );
            },
          ),
        ],
      ],
    );
  }
}
