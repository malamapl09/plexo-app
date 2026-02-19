import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:plexo_ops/features/auth/presentation/pages/login_page.dart';
import 'package:plexo_ops/features/home/presentation/pages/home_page.dart';
import 'package:plexo_ops/features/tasks/presentation/pages/tasks_page.dart';
import 'package:plexo_ops/features/receiving/presentation/pages/receiving_page.dart';
import 'package:plexo_ops/features/issues/presentation/pages/issues_page.dart';
import 'package:plexo_ops/features/verification/presentation/pages/verification_queue_page.dart';
import 'package:plexo_ops/features/profile/presentation/pages/profile_page.dart';
import 'package:plexo_ops/features/checklists/presentation/pages/checklists_page.dart';
import 'package:plexo_ops/features/store_audits/presentation/pages/audits_page.dart';
import 'package:plexo_ops/features/planograms/presentation/pages/planograms_page.dart';
import 'package:plexo_ops/features/campaigns/presentation/pages/campaigns_page.dart';
import 'package:plexo_ops/features/campaigns/presentation/pages/campaign_submit_page.dart';
import 'package:plexo_ops/features/campaigns/presentation/pages/campaign_detail_page.dart';
import 'package:plexo_ops/features/campaigns/data/models/campaign_model.dart';
import 'package:plexo_ops/features/planograms/presentation/pages/planogram_submit_page.dart';
import 'package:plexo_ops/features/planograms/presentation/pages/planogram_detail_page.dart';
import 'package:plexo_ops/features/planograms/data/models/planogram_model.dart';
import 'package:plexo_ops/features/corrective_actions/presentation/pages/corrective_actions_page.dart';
import 'package:plexo_ops/features/gamification/presentation/pages/leaderboard_page.dart';
import 'package:plexo_ops/features/gamification/presentation/pages/badges_page.dart';
import 'package:plexo_ops/features/training/presentation/pages/training_page.dart';
import 'package:plexo_ops/features/training/presentation/pages/training_course_page.dart';
import 'package:plexo_ops/features/training/presentation/pages/training_lesson_page.dart';
import 'package:plexo_ops/features/training/presentation/pages/training_quiz_page.dart';
import 'package:plexo_ops/features/training/data/models/training_model.dart';
import 'package:plexo_ops/shared/providers/auth_provider.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/login',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isLoggingIn = state.matchedLocation == '/login';

      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }

      if (isLoggedIn && isLoggingIn) {
        return '/';
      }

      // Module-based route protection
      if (isLoggedIn && authState.user != null) {
        final user = authState.user!;
        const routeModuleMap = {
          '/receiving': 'receiving',
          '/issues': 'issues',
          '/verification': 'verification',
          '/checklists': 'checklists',
          '/audits': 'audits',
          '/corrective-actions': 'corrective_actions',
          '/planograms': 'planograms',
          '/campaigns': 'campaigns',
          '/training': 'training',
          '/leaderboard': 'gamification',
          '/badges': 'gamification',
        };

        final location = state.matchedLocation;
        for (final entry in routeModuleMap.entries) {
          if (location == entry.key || location.startsWith('${entry.key}/')) {
            if (!user.hasModuleAccess(entry.value)) {
              return '/';
            }
            break;
          }
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      ShellRoute(
        builder: (context, state, child) => HomePage(child: child),
        routes: [
          GoRoute(
            path: '/',
            name: 'tasks',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TasksPage(),
            ),
          ),
          GoRoute(
            path: '/receiving',
            name: 'receiving',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ReceivingPage(),
            ),
          ),
          GoRoute(
            path: '/issues',
            name: 'issues',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: IssuesPage(),
            ),
          ),
          GoRoute(
            path: '/verification',
            name: 'verification',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: VerificationQueuePage(),
            ),
          ),
          GoRoute(
            path: '/profile',
            name: 'profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfilePage(),
            ),
          ),
          GoRoute(
            path: '/checklists',
            name: 'checklists',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ChecklistsPage(),
            ),
          ),
          GoRoute(
            path: '/audits',
            name: 'audits',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: AuditsPage(),
            ),
          ),
          GoRoute(
            path: '/planograms',
            name: 'planograms',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: PlanogramsPage(),
            ),
          ),
          GoRoute(
            path: '/campaigns',
            name: 'campaigns',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: CampaignsPage(),
            ),
          ),
          GoRoute(
            path: '/corrective-actions',
            name: 'corrective-actions',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: CorrectiveActionsPage(),
            ),
          ),
          GoRoute(
            path: '/leaderboard',
            name: 'leaderboard',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: LeaderboardPage(),
            ),
          ),
          GoRoute(
            path: '/badges',
            name: 'badges',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: BadgesPage(),
            ),
          ),
          GoRoute(
            path: '/training',
            name: 'training',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: TrainingPage(),
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/campaigns/submit/:id',
        name: 'campaign-submit',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final campaign = state.extra as Campaign?;
          return CampaignSubmitPage(
            campaignId: id,
            campaign: campaign,
          );
        },
      ),
      GoRoute(
        path: '/campaigns/detail/:id',
        name: 'campaign-detail',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final submission = state.extra as CampaignSubmission?;
          return CampaignDetailPage(
            submissionId: id,
            submission: submission,
          );
        },
      ),
      GoRoute(
        path: '/planograms/submit/:id',
        name: 'planogram-submit',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final template = state.extra as PlanogramTemplate?;
          return PlanogramSubmitPage(
            templateId: id,
            template: template,
          );
        },
      ),
      GoRoute(
        path: '/planograms/detail/:id',
        name: 'planogram-detail',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final submission = state.extra as PlanogramSubmission?;
          return PlanogramDetailPage(
            submissionId: id,
            submission: submission,
          );
        },
      ),
      GoRoute(
        path: '/training/course/:id',
        name: 'training-course',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          final enrollment = state.extra as TrainingEnrollment?;
          return TrainingCoursePage(
            enrollmentId: id,
            enrollment: enrollment,
          );
        },
      ),
      GoRoute(
        path: '/training/lesson/:enrollmentId/:lessonId',
        name: 'training-lesson',
        builder: (context, state) {
          final enrollmentId = state.pathParameters['enrollmentId']!;
          final lessonId = state.pathParameters['lessonId']!;
          final extra = state.extra as Map<String, dynamic>?;
          return TrainingLessonPage(
            enrollmentId: enrollmentId,
            lessonId: lessonId,
            enrollment: extra?['enrollment'] as TrainingEnrollment?,
            lesson: extra?['lesson'] as TrainingLesson?,
            progress: extra?['progress'] as TrainingProgress?,
          );
        },
      ),
      GoRoute(
        path: '/training/quiz/:enrollmentId/:lessonId',
        name: 'training-quiz',
        builder: (context, state) {
          final enrollmentId = state.pathParameters['enrollmentId']!;
          final lessonId = state.pathParameters['lessonId']!;
          final extra = state.extra as Map<String, dynamic>?;
          return TrainingQuizPage(
            enrollmentId: enrollmentId,
            lessonId: lessonId,
            enrollment: extra?['enrollment'] as TrainingEnrollment?,
            lesson: extra?['lesson'] as TrainingLesson?,
          );
        },
      ),
    ],
  );
});

// Placeholder widgets (to be replaced with actual implementations)
class TasksPlaceholder extends StatelessWidget {
  const TasksPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Plan del Día - Tareas'),
    );
  }
}

class ReceivingPlaceholder extends StatelessWidget {
  const ReceivingPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Recepciones'),
    );
  }
}

class IssuesPlaceholder extends StatelessWidget {
  const IssuesPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Incidencias'),
    );
  }
}

class ProfilePlaceholder extends StatelessWidget {
  const ProfilePlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Mi Perfil'),
    );
  }
}
