import { Module } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { ChecklistsController } from './checklists.controller';
import { AuditModule } from '../audit/audit.module';
import { CorrectiveActionsModule } from '../corrective-actions/corrective-actions.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [AuditModule, CorrectiveActionsModule, GamificationModule],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
