import { Module } from '@nestjs/common';
import { PlanogramsService } from './planograms.service';
import { PlanogramsController } from './planograms.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { AuditModule } from '../audit/audit.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [PrismaModule, EventsModule, AuditModule, GamificationModule],
  controllers: [PlanogramsController],
  providers: [PlanogramsService],
  exports: [PlanogramsService],
})
export class PlanogramsModule {}
