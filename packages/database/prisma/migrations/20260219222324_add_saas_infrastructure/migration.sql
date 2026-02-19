-- ============================================================
-- SaaS Infrastructure Migration
-- Adds multi-tenancy (Organization + organizationId on 32 tables),
-- Invitation model, password reset fields, isPlatformAdmin,
-- and new GamificationActionType enum values.
-- ============================================================

-- AlterEnum: add new gamification action types
ALTER TYPE "GamificationActionType" ADD VALUE 'CAMPAIGN_SUBMITTED';
ALTER TYPE "GamificationActionType" ADD VALUE 'PERFECT_DAY';

-- ============================================================
-- Step 1: Create organizations table
-- ============================================================
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#4F46E5',
    "timezone" TEXT NOT NULL DEFAULT 'America/Santo_Domingo',
    "locale" TEXT NOT NULL DEFAULT 'es',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "organizations_domain_key" ON "organizations"("domain");

-- ============================================================
-- Step 2: Create a default organization for existing data
-- ============================================================
INSERT INTO "organizations" ("id", "name", "slug", "timezone", "locale", "plan", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default', 'America/Santo_Domingo', 'es', 'free', NOW());

-- ============================================================
-- Step 3: Add organizationId as NULLABLE to all tenant tables,
--         backfill with default org, then make NOT NULL
-- ============================================================

-- roles
ALTER TABLE "roles" ADD COLUMN "organizationId" TEXT;
UPDATE "roles" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "roles" ALTER COLUMN "organizationId" SET NOT NULL;

-- regions
ALTER TABLE "regions" ADD COLUMN "organizationId" TEXT;
UPDATE "regions" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "regions" ALTER COLUMN "organizationId" SET NOT NULL;

-- stores
ALTER TABLE "stores" ADD COLUMN "organizationId" TEXT;
UPDATE "stores" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "stores" ALTER COLUMN "organizationId" SET NOT NULL;

-- departments
ALTER TABLE "departments" ADD COLUMN "organizationId" TEXT;
UPDATE "departments" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "departments" ALTER COLUMN "organizationId" SET NOT NULL;

-- users (also add isPlatformAdmin, resetToken, resetTokenExpiry)
ALTER TABLE "users" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "users" ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "users" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);
UPDATE "users" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "users" ALTER COLUMN "organizationId" SET NOT NULL;

-- task_templates
ALTER TABLE "task_templates" ADD COLUMN "organizationId" TEXT;
UPDATE "task_templates" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "task_templates" ALTER COLUMN "organizationId" SET NOT NULL;

-- tasks
ALTER TABLE "tasks" ADD COLUMN "organizationId" TEXT;
UPDATE "tasks" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "tasks" ALTER COLUMN "organizationId" SET NOT NULL;

-- task_assignments
ALTER TABLE "task_assignments" ADD COLUMN "organizationId" TEXT;
UPDATE "task_assignments" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "task_assignments" ALTER COLUMN "organizationId" SET NOT NULL;

-- receivings
ALTER TABLE "receivings" ADD COLUMN "organizationId" TEXT;
UPDATE "receivings" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "receivings" ALTER COLUMN "organizationId" SET NOT NULL;

-- issues
ALTER TABLE "issues" ADD COLUMN "organizationId" TEXT;
UPDATE "issues" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "issues" ALTER COLUMN "organizationId" SET NOT NULL;

-- device_tokens
ALTER TABLE "device_tokens" ADD COLUMN "organizationId" TEXT;
UPDATE "device_tokens" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "device_tokens" ALTER COLUMN "organizationId" SET NOT NULL;

-- announcements
ALTER TABLE "announcements" ADD COLUMN "organizationId" TEXT;
UPDATE "announcements" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "announcements" ALTER COLUMN "organizationId" SET NOT NULL;

-- audit_logs
ALTER TABLE "audit_logs" ADD COLUMN "organizationId" TEXT;
UPDATE "audit_logs" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "audit_logs" ALTER COLUMN "organizationId" SET NOT NULL;

-- verifications
ALTER TABLE "verifications" ADD COLUMN "organizationId" TEXT;
UPDATE "verifications" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "verifications" ALTER COLUMN "organizationId" SET NOT NULL;

-- checklist_templates
ALTER TABLE "checklist_templates" ADD COLUMN "organizationId" TEXT;
UPDATE "checklist_templates" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "checklist_templates" ALTER COLUMN "organizationId" SET NOT NULL;

-- checklist_submissions
ALTER TABLE "checklist_submissions" ADD COLUMN "organizationId" TEXT;
UPDATE "checklist_submissions" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "checklist_submissions" ALTER COLUMN "organizationId" SET NOT NULL;

-- audit_templates
ALTER TABLE "audit_templates" ADD COLUMN "organizationId" TEXT;
UPDATE "audit_templates" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "audit_templates" ALTER COLUMN "organizationId" SET NOT NULL;

-- store_audits
ALTER TABLE "store_audits" ADD COLUMN "organizationId" TEXT;
UPDATE "store_audits" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "store_audits" ALTER COLUMN "organizationId" SET NOT NULL;

-- corrective_actions
ALTER TABLE "corrective_actions" ADD COLUMN "organizationId" TEXT;
UPDATE "corrective_actions" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "corrective_actions" ALTER COLUMN "organizationId" SET NOT NULL;

-- planogram_templates
ALTER TABLE "planogram_templates" ADD COLUMN "organizationId" TEXT;
UPDATE "planogram_templates" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "planogram_templates" ALTER COLUMN "organizationId" SET NOT NULL;

-- planogram_submissions
ALTER TABLE "planogram_submissions" ADD COLUMN "organizationId" TEXT;
UPDATE "planogram_submissions" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "planogram_submissions" ALTER COLUMN "organizationId" SET NOT NULL;

-- campaigns
ALTER TABLE "campaigns" ADD COLUMN "organizationId" TEXT;
UPDATE "campaigns" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "campaigns" ALTER COLUMN "organizationId" SET NOT NULL;

-- campaign_submissions
ALTER TABLE "campaign_submissions" ADD COLUMN "organizationId" TEXT;
UPDATE "campaign_submissions" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "campaign_submissions" ALTER COLUMN "organizationId" SET NOT NULL;

-- point_configs
ALTER TABLE "point_configs" ADD COLUMN "organizationId" TEXT;
UPDATE "point_configs" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "point_configs" ALTER COLUMN "organizationId" SET NOT NULL;

-- user_points
ALTER TABLE "user_points" ADD COLUMN "organizationId" TEXT;
UPDATE "user_points" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "user_points" ALTER COLUMN "organizationId" SET NOT NULL;

-- point_transactions
ALTER TABLE "point_transactions" ADD COLUMN "organizationId" TEXT;
UPDATE "point_transactions" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "point_transactions" ALTER COLUMN "organizationId" SET NOT NULL;

-- badges
ALTER TABLE "badges" ADD COLUMN "organizationId" TEXT;
UPDATE "badges" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "badges" ALTER COLUMN "organizationId" SET NOT NULL;

-- store_points
ALTER TABLE "store_points" ADD COLUMN "organizationId" TEXT;
UPDATE "store_points" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "store_points" ALTER COLUMN "organizationId" SET NOT NULL;

-- department_points
ALTER TABLE "department_points" ADD COLUMN "organizationId" TEXT;
UPDATE "department_points" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "department_points" ALTER COLUMN "organizationId" SET NOT NULL;

-- training_courses
ALTER TABLE "training_courses" ADD COLUMN "organizationId" TEXT;
UPDATE "training_courses" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "training_courses" ALTER COLUMN "organizationId" SET NOT NULL;

-- training_enrollments
ALTER TABLE "training_enrollments" ADD COLUMN "organizationId" TEXT;
UPDATE "training_enrollments" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "training_enrollments" ALTER COLUMN "organizationId" SET NOT NULL;

-- role_module_access
ALTER TABLE "role_module_access" ADD COLUMN "organizationId" TEXT;
UPDATE "role_module_access" SET "organizationId" = '00000000-0000-0000-0000-000000000001' WHERE "organizationId" IS NULL;
ALTER TABLE "role_module_access" ALTER COLUMN "organizationId" SET NOT NULL;

-- ============================================================
-- Step 4: Create invitations table
-- ============================================================
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "storeId" TEXT,
    "departmentId" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedById" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");
CREATE INDEX "invitations_email_idx" ON "invitations"("email");
CREATE INDEX "invitations_organizationId_idx" ON "invitations"("organizationId");

-- ============================================================
-- Step 5: Drop old unique constraints that need to become org-scoped
-- ============================================================
DROP INDEX IF EXISTS "departments_code_key";
DROP INDEX IF EXISTS "point_configs_actionType_key";
DROP INDEX IF EXISTS "role_module_access_role_module_key";
DROP INDEX IF EXISTS "roles_key_key";
DROP INDEX IF EXISTS "stores_code_key";
DROP INDEX IF EXISTS "users_email_key";

-- ============================================================
-- Step 6: Create new org-scoped unique constraints and indexes
-- ============================================================

-- users
CREATE UNIQUE INDEX "users_resetToken_key" ON "users"("resetToken");
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");
CREATE UNIQUE INDEX "users_organizationId_email_key" ON "users"("organizationId", "email");

-- roles
CREATE INDEX "roles_organizationId_idx" ON "roles"("organizationId");
CREATE UNIQUE INDEX "roles_organizationId_key_key" ON "roles"("organizationId", "key");

-- stores
CREATE INDEX "stores_organizationId_idx" ON "stores"("organizationId");
CREATE UNIQUE INDEX "stores_organizationId_code_key" ON "stores"("organizationId", "code");

-- departments
CREATE INDEX "departments_organizationId_idx" ON "departments"("organizationId");
CREATE UNIQUE INDEX "departments_organizationId_code_key" ON "departments"("organizationId", "code");

-- point_configs
CREATE INDEX "point_configs_organizationId_idx" ON "point_configs"("organizationId");
CREATE UNIQUE INDEX "point_configs_organizationId_actionType_key" ON "point_configs"("organizationId", "actionType");

-- role_module_access
CREATE INDEX "role_module_access_organizationId_idx" ON "role_module_access"("organizationId");
CREATE UNIQUE INDEX "role_module_access_organizationId_role_module_key" ON "role_module_access"("organizationId", "role", "module");

-- badges
CREATE INDEX "badges_organizationId_idx" ON "badges"("organizationId");
CREATE UNIQUE INDEX "badges_organizationId_name_key" ON "badges"("organizationId", "name");

-- remaining org indexes
CREATE INDEX "regions_organizationId_idx" ON "regions"("organizationId");
CREATE INDEX "announcements_organizationId_idx" ON "announcements"("organizationId");
CREATE INDEX "audit_logs_organizationId_idx" ON "audit_logs"("organizationId");
CREATE INDEX "audit_templates_organizationId_idx" ON "audit_templates"("organizationId");
CREATE INDEX "campaign_submissions_organizationId_idx" ON "campaign_submissions"("organizationId");
CREATE INDEX "campaigns_organizationId_idx" ON "campaigns"("organizationId");
CREATE INDEX "checklist_submissions_organizationId_idx" ON "checklist_submissions"("organizationId");
CREATE INDEX "checklist_templates_organizationId_idx" ON "checklist_templates"("organizationId");
CREATE INDEX "corrective_actions_organizationId_idx" ON "corrective_actions"("organizationId");
CREATE INDEX "department_points_organizationId_idx" ON "department_points"("organizationId");
CREATE INDEX "device_tokens_organizationId_idx" ON "device_tokens"("organizationId");
CREATE INDEX "issues_organizationId_idx" ON "issues"("organizationId");
CREATE INDEX "planogram_submissions_organizationId_idx" ON "planogram_submissions"("organizationId");
CREATE INDEX "planogram_templates_organizationId_idx" ON "planogram_templates"("organizationId");
CREATE INDEX "point_transactions_organizationId_idx" ON "point_transactions"("organizationId");
CREATE INDEX "receivings_organizationId_idx" ON "receivings"("organizationId");
CREATE INDEX "store_audits_organizationId_idx" ON "store_audits"("organizationId");
CREATE INDEX "store_points_organizationId_idx" ON "store_points"("organizationId");
CREATE INDEX "task_assignments_organizationId_idx" ON "task_assignments"("organizationId");
CREATE INDEX "task_templates_organizationId_idx" ON "task_templates"("organizationId");
CREATE INDEX "tasks_organizationId_idx" ON "tasks"("organizationId");
CREATE INDEX "training_courses_organizationId_idx" ON "training_courses"("organizationId");
CREATE INDEX "training_enrollments_organizationId_idx" ON "training_enrollments"("organizationId");
CREATE INDEX "user_points_organizationId_idx" ON "user_points"("organizationId");
CREATE INDEX "verifications_organizationId_idx" ON "verifications"("organizationId");

-- ============================================================
-- Step 7: Add foreign keys to organizations
-- ============================================================
ALTER TABLE "roles" ADD CONSTRAINT "roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "regions" ADD CONSTRAINT "regions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stores" ADD CONSTRAINT "stores_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_templates" ADD CONSTRAINT "task_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "receivings" ADD CONSTRAINT "receivings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "issues" ADD CONSTRAINT "issues_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "checklist_submissions" ADD CONSTRAINT "checklist_submissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_templates" ADD CONSTRAINT "audit_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "store_audits" ADD CONSTRAINT "store_audits_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "planogram_templates" ADD CONSTRAINT "planogram_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "planogram_submissions" ADD CONSTRAINT "planogram_submissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "campaign_submissions" ADD CONSTRAINT "campaign_submissions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "point_configs" ADD CONSTRAINT "point_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "badges" ADD CONSTRAINT "badges_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "store_points" ADD CONSTRAINT "store_points_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "department_points" ADD CONSTRAINT "department_points_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "role_module_access" ADD CONSTRAINT "role_module_access_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
