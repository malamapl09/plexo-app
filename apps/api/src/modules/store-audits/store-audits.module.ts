import { Module } from '@nestjs/common';
import { StoreAuditsService } from './store-audits.service';
import { StoreAuditsController } from './store-audits.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { AuditModule } from '../audit/audit.module';
import { CorrectiveActionsModule } from '../corrective-actions/corrective-actions.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [PrismaModule, EventsModule, AuditModule, CorrectiveActionsModule, GamificationModule],
  controllers: [StoreAuditsController],
  providers: [StoreAuditsService],
  exports: [StoreAuditsService],
})
export class StoreAuditsModule {}
