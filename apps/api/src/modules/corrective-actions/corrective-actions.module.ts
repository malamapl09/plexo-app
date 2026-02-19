import { Module, forwardRef } from '@nestjs/common';
import { CorrectiveActionsController } from './corrective-actions.controller';
import { CorrectiveActionsService } from './corrective-actions.service';
import { CorrectiveActionsScheduler } from './corrective-actions.scheduler';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { AuditModule } from '../audit/audit.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [PrismaModule, EventsModule, AuditModule, GamificationModule],
  controllers: [CorrectiveActionsController],
  providers: [CorrectiveActionsService, CorrectiveActionsScheduler],
  exports: [CorrectiveActionsService],
})
export class CorrectiveActionsModule {}
