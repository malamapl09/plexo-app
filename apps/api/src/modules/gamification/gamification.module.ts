import { Module } from '@nestjs/common';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';
import { GamificationScheduler } from './gamification.scheduler';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { StoresModule } from '../stores/stores.module';

@Module({
  imports: [PrismaModule, AuditModule, StoresModule],
  controllers: [GamificationController],
  providers: [GamificationService, GamificationScheduler],
  exports: [GamificationService],
})
export class GamificationModule {}
