import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TaskTemplatesModule } from './modules/task-templates/task-templates.module';
import { ReceivingModule } from './modules/receiving/receiving.module';
import { IssuesModule } from './modules/issues/issues.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthModule } from './modules/health/health.module';
import { EventsModule } from './modules/events/events.module';
import { AuditModule } from './modules/audit/audit.module';
import { VerificationModule } from './modules/verification/verification.module';
import { StorageModule } from './modules/storage/storage.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ChecklistsModule } from './modules/checklists/checklists.module';
import { StoreAuditsModule } from './modules/store-audits/store-audits.module';
import { PlanogramsModule } from './modules/planograms/planograms.module';
import { CorrectiveActionsModule } from './modules/corrective-actions/corrective-actions.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ModuleAccessModule } from './modules/module-access/module-access.module';
import { RolesModule } from './modules/roles/roles.module';
import { TrainingModule } from './modules/training/training.module';
import { EmailModule } from './modules/email/email.module';
import { PlatformModule } from './modules/platform/platform.module';
import { InvitationsModule } from './modules/invitations/invitations.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Scheduling (cron jobs)
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Storage
    StorageModule,

    // Email
    EmailModule,

    // Feature modules
    AuthModule,
    UsersModule,
    StoresModule,
    TasksModule,
    TaskTemplatesModule,
    ReceivingModule,
    IssuesModule,
    AnnouncementsModule,
    ReportsModule,
    HealthModule,
    EventsModule,
    AuditModule,
    VerificationModule,
    UploadsModule,
    ChecklistsModule,
    StoreAuditsModule,
    PlanogramsModule,
    CorrectiveActionsModule,
    CampaignsModule,
    GamificationModule,
    ModuleAccessModule,
    RolesModule,
    TrainingModule,
    PlatformModule,
    InvitationsModule,
  ],
})
export class AppModule {}
