import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:plexo_ops/core/theme/app_colors.dart';
import 'package:plexo_ops/features/tasks/data/models/task_model.dart';
import 'package:plexo_ops/features/tasks/presentation/providers/tasks_provider.dart';
import 'package:plexo_ops/features/tasks/presentation/widgets/task_card.dart';
import 'package:plexo_ops/features/tasks/presentation/widgets/progress_header.dart';
import 'package:plexo_ops/features/tasks/presentation/widgets/filter_chips.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

class TasksPage extends ConsumerStatefulWidget {
  const TasksPage({super.key});

  @override
  ConsumerState<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends ConsumerState<TasksPage> {
  @override
  void initState() {
    super.initState();
    // Load tasks on init
    Future.microtask(() {
      final storeId = ref.read(authStateProvider).user?.storeId;
      // Load tasks - pass storeId if available, otherwise load all (for HQ/admin users)
      ref.read(tasksProvider.notifier).loadTasks(storeId ?? '');
    });
  }

  void _showTaskDetail(BuildContext context, TaskModel task) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _TaskDetailSheet(task: task),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tasksState = ref.watch(tasksProvider);
    final storeId = ref.watch(authStateProvider).user?.storeId;

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(tasksProvider.notifier).loadTasks(storeId ?? '');
        },
        child: CustomScrollView(
          slivers: [
            // Progress header
            SliverToBoxAdapter(
              child: ProgressHeader(
                progress: tasksState.progress,
                isLoading: tasksState.isLoading,
              ),
            ),

            // Filter chips
            SliverToBoxAdapter(
              child: FilterChips(
                selectedStatus: tasksState.statusFilter,
                onStatusChanged: (status) {
                  ref.read(tasksProvider.notifier).setStatusFilter(status);
                },
              ),
            ),

            // Error message
            if (tasksState.error != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: AppColors.error),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            tasksState.error!,
                            style: const TextStyle(color: AppColors.error),
                          ),
                        ),
                        TextButton(
                          onPressed: () {
                            ref.read(tasksProvider.notifier).loadTasks(storeId ?? '');
                          },
                          child: const Text('Reintentar'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Loading indicator
            if (tasksState.isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(),
                ),
              )
            // Empty state
            else if (tasksState.filteredTasks.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        size: 64,
                        color: Theme.of(context).iconTheme.color?.withOpacity(0.5),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        tasksState.statusFilter == 'COMPLETED'
                            ? 'No hay tareas completadas'
                            : tasksState.statusFilter == 'PENDING'
                                ? 'No hay tareas pendientes'
                                : 'No hay tareas para hoy',
                        style: TextStyle(
                          fontSize: 16,
                          color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            // Task list
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final task = tasksState.filteredTasks[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: TaskCard(
                          task: task,
                          onComplete: () async {
                            await ref
                                .read(tasksProvider.notifier)
                                .completeTask(task.id);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Tarea "${task.title}" completada'),
                                  backgroundColor: AppColors.success,
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            }
                          },
                          onTap: () {
                            _showTaskDetail(context, task);
                          },
                        ),
                      );
                    },
                    childCount: tasksState.filteredTasks.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// Task Detail Sheet
class _TaskDetailSheet extends ConsumerStatefulWidget {
  final TaskModel task;

  const _TaskDetailSheet({required this.task});

  @override
  ConsumerState<_TaskDetailSheet> createState() => _TaskDetailSheetState();
}

class _TaskDetailSheetState extends ConsumerState<_TaskDetailSheet> {
  final _notesController = TextEditingController();
  bool _isCompleting = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _completeTask() async {
    setState(() => _isCompleting = true);

    final success = await ref.read(tasksProvider.notifier).completeTask(
          widget.task.id,
          notes: _notesController.text.isNotEmpty ? _notesController.text : null,
        );

    if (mounted) {
      setState(() => _isCompleting = false);

      if (success) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Tarea "${widget.task.title}" completada'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final task = widget.task;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) {
          return Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.outlineVariant,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(20),
                  children: [
                    // Header with priority badge
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: task.priority == 'HIGH'
                                ? AppColors.error.withOpacity(0.1)
                                : task.priority == 'MEDIUM'
                                    ? AppColors.warning.withOpacity(0.1)
                                    : AppColors.success.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            task.priority == 'HIGH'
                                ? 'Alta'
                                : task.priority == 'MEDIUM'
                                    ? 'Media'
                                    : 'Baja',
                            style: TextStyle(
                              color: task.priority == 'HIGH'
                                  ? AppColors.error
                                  : task.priority == 'MEDIUM'
                                      ? AppColors.warning
                                      : AppColors.success,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: task.isCompleted
                                ? AppColors.success.withOpacity(0.1)
                                : task.isOverdue
                                    ? AppColors.error.withOpacity(0.1)
                                    : AppColors.warning.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            task.isCompleted
                                ? 'Completada'
                                : task.isOverdue
                                    ? 'Atrasada'
                                    : 'Pendiente',
                            style: TextStyle(
                              color: task.isCompleted
                                  ? AppColors.success
                                  : task.isOverdue
                                      ? AppColors.error
                                      : AppColors.warning,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Title
                    Text(
                      task.title,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Description
                    if (task.description != null && task.description!.isNotEmpty)
                      Text(
                        task.description!,
                        style: TextStyle(
                          fontSize: 16,
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    const SizedBox(height: 24),

                    // Details section
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surfaceContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          if (task.department != null) ...[
                            _DetailRow(
                              icon: Icons.business,
                              label: 'Departamento',
                              value: task.department!.name,
                            ),
                            const Divider(height: 24),
                          ],
                          if (task.scheduledTime != null) ...[
                            _DetailRow(
                              icon: Icons.access_time,
                              label: 'Hora Programada',
                              value: DateFormat('HH:mm').format(task.scheduledTime!),
                            ),
                            const Divider(height: 24),
                          ],
                          if (task.dueTime != null) ...[
                            _DetailRow(
                              icon: Icons.flag,
                              label: 'Fecha Límite',
                              value: DateFormat('HH:mm').format(task.dueTime!),
                            ),
                            const Divider(height: 24),
                          ],
                          _DetailRow(
                            icon: Icons.person,
                            label: 'Creado por',
                            value: task.createdBy?.name ?? 'Sistema',
                          ),
                          const Divider(height: 24),
                          _DetailRow(
                            icon: Icons.calendar_today,
                            label: 'Fecha de creación',
                            value: DateFormat('dd/MM/yyyy HH:mm').format(task.createdAt),
                          ),
                          if (task.assignment?.completedAt != null) ...[
                            const Divider(height: 24),
                            _DetailRow(
                              icon: Icons.check_circle,
                              label: 'Completada',
                              value: DateFormat('dd/MM/yyyy HH:mm')
                                  .format(task.assignment!.completedAt!),
                            ),
                          ],
                        ],
                      ),
                    ),

                    // Notes section for completion
                    if (!task.isCompleted) ...[
                      const SizedBox(height: 24),
                      const Text(
                        'Notas (opcional)',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _notesController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText: 'Agregar notas sobre la tarea...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Complete button
              if (!task.isCompleted)
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isCompleting ? null : _completeTask,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isCompleting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle, color: Colors.white),
                                SizedBox(width: 8),
                                Text(
                                  'Marcar como Completada',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Row(
      children: [
        Icon(icon, size: 20, color: colorScheme.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
