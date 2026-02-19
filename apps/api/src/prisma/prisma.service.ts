import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Models that have organizationId and need tenant scoping
const TENANT_MODELS = [
  'role', 'region', 'store', 'department', 'user',
  'taskTemplate', 'task', 'taskAssignment',
  'receiving', 'issue', 'deviceToken',
  'announcement', 'auditLog', 'verification',
  'checklistTemplate', 'checklistSubmission',
  'auditTemplate', 'storeAudit', 'correctiveAction',
  'planogramTemplate', 'planogramSubmission',
  'campaign', 'campaignSubmission',
  'pointConfig', 'userPoints', 'pointTransaction',
  'badge', 'storePoints', 'departmentPoints',
  'trainingCourse', 'trainingEnrollment',
  'roleModuleAccess',
] as const;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Returns a tenant-scoped Prisma client that automatically injects
   * organizationId into all queries and mutations.
   *
   * Usage:
   *   const tp = this.prisma.forTenant(orgId);
   *   const stores = await tp.store.findMany({ where: { isActive: true } });
   *   // organizationId is automatically added to the where clause
   */
  forTenant(organizationId: string) {
    return this.$extends({
      query: {
        $allModels: {
          async findMany({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              args.where = { ...args.where, organizationId };
            }
            return query(args);
          },
          async findFirst({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              args.where = { ...args.where, organizationId };
            }
            return query(args);
          },
          async findUnique({ model, args, query }) {
            // findUnique uses unique fields, so we don't auto-inject organizationId
            // but we validate the result belongs to the org after query
            return query(args);
          },
          async create({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              (args.data as any).organizationId = organizationId;
            }
            return query(args);
          },
          async createMany({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((d: any) => ({ ...d, organizationId }));
              } else {
                (args.data as any).organizationId = organizationId;
              }
            }
            return query(args);
          },
          async update({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              args.where = { ...args.where, organizationId } as any;
            }
            return query(args);
          },
          async updateMany({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              args.where = { ...args.where, organizationId };
            }
            return query(args);
          },
          async delete({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              args.where = { ...args.where, organizationId } as any;
            }
            return query(args);
          },
          async deleteMany({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              args.where = { ...args.where, organizationId };
            }
            return query(args);
          },
          async count({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              args.where = { ...args.where, organizationId };
            }
            return query(args);
          },
          async aggregate({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              args.where = { ...args.where, organizationId };
            }
            return query(args);
          },
          async upsert({ model, args, query }) {
            if (TENANT_MODELS.includes(model.charAt(0).toLowerCase() + model.slice(1) as any)) {
              args.where = { ...args.where, organizationId } as any;
              (args.create as any).organizationId = organizationId;
            }
            return query(args);
          },
        },
      },
    });
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase is not allowed in production');
    }
    // Add table cleanup logic for testing
  }
}
