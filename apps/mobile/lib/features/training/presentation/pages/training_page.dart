import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plexo_ops/features/training/data/models/training_model.dart';
import 'package:plexo_ops/features/training/presentation/providers/training_provider.dart';
import 'package:plexo_ops/features/training/presentation/widgets/enrollment_card.dart';

class TrainingPage extends ConsumerStatefulWidget {
  const TrainingPage({super.key});

  @override
  ConsumerState<TrainingPage> createState() => _TrainingPageState();
}

class _TrainingPageState extends ConsumerState<TrainingPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    await ref.read(trainingProvider.notifier).loadMyCourses();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(trainingProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: [
        Material(
          color: colorScheme.primary,
          child: TabBar(
            controller: _tabController,
            indicatorColor: colorScheme.onPrimary,
            labelColor: colorScheme.onPrimary,
            unselectedLabelColor:
                colorScheme.onPrimary.withValues(alpha: 0.6),
            tabs: [
              Tab(
                text: 'Pendientes',
                icon: state.pendingEnrollments.isNotEmpty
                    ? Badge(
                        label:
                            Text('${state.pendingEnrollments.length}'),
                        child: const Icon(Icons.assignment_outlined),
                      )
                    : const Icon(Icons.assignment_outlined),
              ),
              Tab(
                text: 'En Progreso',
                icon: state.inProgressEnrollments.isNotEmpty
                    ? Badge(
                        label: Text(
                            '${state.inProgressEnrollments.length}'),
                        child: const Icon(Icons.play_circle_outline),
                      )
                    : const Icon(Icons.play_circle_outline),
              ),
              Tab(
                text: 'Completados',
                icon: state.completedEnrollments.isNotEmpty
                    ? Badge(
                        label: Text(
                            '${state.completedEnrollments.length}'),
                        child: const Icon(Icons.check_circle_outline),
                      )
                    : const Icon(Icons.check_circle_outline),
              ),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _EnrollmentTab(
                enrollments: state.pendingEnrollments,
                state: state,
                onRefresh: _loadData,
                emptyIcon: Icons.school_outlined,
                emptyTitle: 'No hay cursos pendientes',
                emptySubtitle: 'Los cursos asignados apareceran aqui',
              ),
              _EnrollmentTab(
                enrollments: state.inProgressEnrollments,
                state: state,
                onRefresh: _loadData,
                emptyIcon: Icons.play_circle_outline,
                emptyTitle: 'Sin cursos en progreso',
                emptySubtitle: 'Inicia un curso para verlo aqui',
              ),
              _EnrollmentTab(
                enrollments: state.completedEnrollments,
                state: state,
                onRefresh: _loadData,
                emptyIcon: Icons.check_circle_outline,
                emptyTitle: 'Sin cursos completados',
                emptySubtitle: 'Los cursos completados apareceran aqui',
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _EnrollmentTab extends StatelessWidget {
  final List<TrainingEnrollment> enrollments;
  final TrainingState state;
  final Future<void> Function() onRefresh;
  final IconData emptyIcon;
  final String emptyTitle;
  final String emptySubtitle;

  const _EnrollmentTab({
    required this.enrollments,
    required this.state,
    required this.onRefresh,
    required this.emptyIcon,
    required this.emptyTitle,
    required this.emptySubtitle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: state.isLoading && enrollments.isEmpty
          ? ListView(
              children: [
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.5,
                  child: const Center(child: CircularProgressIndicator()),
                ),
              ],
            )
          : state.error != null && enrollments.isEmpty
              ? _buildErrorState(context, theme)
              : enrollments.isEmpty
                  ? ListView(
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.5,
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  emptyIcon,
                                  size: 64,
                                  color: colorScheme.onSurfaceVariant
                                      .withValues(alpha: 0.4),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  emptyTitle,
                                  style:
                                      theme.textTheme.titleMedium?.copyWith(
                                    color: colorScheme.onSurfaceVariant,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  emptySubtitle,
                                  style:
                                      theme.textTheme.bodyMedium?.copyWith(
                                    color: colorScheme.onSurfaceVariant
                                        .withValues(alpha: 0.7),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: enrollments.length,
                      itemBuilder: (context, index) {
                        final enrollment = enrollments[index];
                        return EnrollmentCard(
                          enrollment: enrollment,
                          onTap: () {
                            context.push(
                              '/training/course/${enrollment.id}',
                              extra: enrollment,
                            );
                          },
                        );
                      },
                    ),
    );
  }

  Widget _buildErrorState(BuildContext context, ThemeData theme) {
    return ListView(
      children: [
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.5,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline,
                      size: 48, color: theme.colorScheme.error),
                  const SizedBox(height: 16),
                  Text(
                    state.error!,
                    style: TextStyle(color: theme.colorScheme.error),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: onRefresh,
                    child: const Text('Reintentar'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
