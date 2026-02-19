import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { GamificationService } from './gamification.service';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class GamificationScheduler {
  private readonly logger = new Logger(GamificationScheduler.name);
  private isComplianceRunning = false;
  private isSyncRunning = false;

  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
    private storesService: StoresService,
  ) {}

  // Reset weekly points every Monday at midnight
  @Cron('0 0 * * 1')
  async resetWeeklyPoints() {
    try {
      this.logger.log('Starting weekly points reset...');

      const [userResult, storeResult, deptResult] = await Promise.all([
        this.prisma.userPoints.updateMany({
          data: { weeklyPoints: 0 },
        }),
        this.prisma.storePoints.updateMany({
          data: {
            weeklyPoints: 0,
            perCapitaWeekly: 0,
            weeklyComplianceRate: null,
          },
        }),
        this.prisma.departmentPoints.updateMany({
          data: {
            weeklyPoints: 0,
            perCapitaWeekly: 0,
          },
        }),
      ]);

      this.logger.log(
        `Weekly points reset completed. Users: ${userResult.count}, Stores: ${storeResult.count}, Departments: ${deptResult.count}`,
      );
    } catch (error) {
      this.logger.error(
        `Error resetting weekly points: ${error.message}`,
        error.stack,
      );
    }
  }

  // Reset monthly points on the 1st of each month at midnight
  @Cron('0 0 1 * *')
  async resetMonthlyPoints() {
    try {
      this.logger.log('Starting monthly points reset...');

      const [userResult, storeResult, deptResult] = await Promise.all([
        this.prisma.userPoints.updateMany({
          data: { monthlyPoints: 0 },
        }),
        this.prisma.storePoints.updateMany({
          data: {
            monthlyPoints: 0,
            perCapitaMonthly: 0,
            monthlyComplianceRate: null,
          },
        }),
        this.prisma.departmentPoints.updateMany({
          data: {
            monthlyPoints: 0,
            perCapitaMonthly: 0,
          },
        }),
      ]);

      this.logger.log(
        `Monthly points reset completed. Users: ${userResult.count}, Stores: ${storeResult.count}, Departments: ${deptResult.count}`,
      );
    } catch (error) {
      this.logger.error(
        `Error resetting monthly points: ${error.message}`,
        error.stack,
      );
    }
  }

  // Daily compliance calculation at 2 AM
  @Cron('0 2 * * *')
  async calculateDailyCompliance() {
    if (this.isComplianceRunning) {
      this.logger.warn('Skipping daily compliance — previous run still active');
      return;
    }
    this.isComplianceRunning = true;
    try {
      this.logger.log('Starting daily compliance calculation...');

      const activeStores = await this.prisma.store.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      let updated = 0;
      for (const store of activeStores) {
        try {
          await this.gamificationService.updateStoreCompliance(store.id);
          updated++;
        } catch (err) {
          this.logger.error(
            `Failed to update compliance for store ${store.id}: ${err.message}`,
          );
        }
      }

      this.logger.log(
        `Daily compliance calculation completed. Updated ${updated}/${activeStores.length} stores.`,
      );
    } catch (error) {
      this.logger.error(
        `Error calculating daily compliance: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isComplianceRunning = false;
    }
  }

  // Daily employee count sync + tier auto-update at 3 AM
  @Cron('0 3 * * *')
  async syncEmployeeCountsAndTiers() {
    if (this.isSyncRunning) {
      this.logger.warn('Skipping employee count sync — previous run still active');
      return;
    }
    this.isSyncRunning = true;
    try {
      this.logger.log('Starting daily employee count sync...');

      const activeStores = await this.prisma.store.findMany({
        where: { isActive: true },
        select: { id: true, tierOverride: true },
      });

      let storesSynced = 0;
      let tiersUpdated = 0;

      for (const store of activeStores) {
        try {
          const employeeCount =
            await this.gamificationService.getActiveEmployeeCount(store.id);

          // Update StorePoints employee count
          await this.prisma.storePoints.upsert({
            where: { storeId: store.id },
            create: {
              storeId: store.id,
              activeEmployeeCount: employeeCount,
            },
            update: { activeEmployeeCount: employeeCount },
          });

          // Recalculate per capita for the store
          const sp = await this.prisma.storePoints.findUnique({
            where: { storeId: store.id },
          });
          if (sp && employeeCount > 0) {
            await this.prisma.storePoints.update({
              where: { storeId: store.id },
              data: {
                perCapitaTotal: sp.totalPoints / employeeCount,
                perCapitaWeekly: sp.weeklyPoints / employeeCount,
                perCapitaMonthly: sp.monthlyPoints / employeeCount,
              },
            });
          }

          // Auto-update tier if not overridden
          if (!store.tierOverride) {
            const newTier =
              this.storesService.calculateTierFromCount(employeeCount);
            await this.prisma.store.update({
              where: { id: store.id },
              data: { tier: newTier },
            });
            tiersUpdated++;
          }

          storesSynced++;
        } catch (err) {
          this.logger.error(
            `Failed to sync employee count for store ${store.id}: ${err.message}`,
          );
        }
      }

      // Sync department employee counts
      const activeDepts = await this.prisma.storeDepartment.findMany({
        where: { isActive: true },
        select: { storeId: true, departmentId: true },
      });

      let deptsSynced = 0;
      for (const sd of activeDepts) {
        try {
          const deptCount =
            await this.gamificationService.getDeptEmployeeCount(
              sd.storeId,
              sd.departmentId,
            );

          await this.prisma.departmentPoints.upsert({
            where: {
              storeId_departmentId: {
                storeId: sd.storeId,
                departmentId: sd.departmentId,
              },
            },
            create: {
              storeId: sd.storeId,
              departmentId: sd.departmentId,
              activeEmployeeCount: deptCount,
            },
            update: { activeEmployeeCount: deptCount },
          });

          // Recalculate per capita
          const dp = await this.prisma.departmentPoints.findUnique({
            where: {
              storeId_departmentId: {
                storeId: sd.storeId,
                departmentId: sd.departmentId,
              },
            },
          });
          if (dp && deptCount > 0) {
            await this.prisma.departmentPoints.update({
              where: {
                storeId_departmentId: {
                  storeId: sd.storeId,
                  departmentId: sd.departmentId,
                },
              },
              data: {
                perCapitaTotal: dp.totalPoints / deptCount,
                perCapitaWeekly: dp.weeklyPoints / deptCount,
                perCapitaMonthly: dp.monthlyPoints / deptCount,
              },
            });
          }

          deptsSynced++;
        } catch (err) {
          this.logger.error(
            `Failed to sync dept count for ${sd.storeId}/${sd.departmentId}: ${err.message}`,
          );
        }
      }

      this.logger.log(
        `Employee count sync completed. Stores: ${storesSynced}, Tiers updated: ${tiersUpdated}, Departments: ${deptsSynced}`,
      );
    } catch (error) {
      this.logger.error(
        `Error syncing employee counts: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isSyncRunning = false;
    }
  }
}
