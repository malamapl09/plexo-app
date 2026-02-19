-- CreateEnum
CREATE TYPE "CAPASourceType" AS ENUM ('AUDIT_FINDING', 'CHECKLIST_FAILURE', 'ISSUE', 'MANUAL');

-- CreateEnum
CREATE TYPE "PlanogramSubmissionStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'NEEDS_REVISION', 'RESUBMITTED');

-- CreateEnum
CREATE TYPE "GamificationActionType" AS ENUM ('TASK_COMPLETED', 'CHECKLIST_COMPLETED', 'AUDIT_COMPLETED', 'ISSUE_RESOLVED', 'ISSUE_REPORTED', 'CAPA_COMPLETED', 'CAPA_VERIFIED', 'PLANOGRAM_APPROVED', 'ON_TIME_COMPLETION', 'PERFECT_AUDIT_SCORE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'REVISION_REQUESTED';
ALTER TYPE "AuditAction" ADD VALUE 'RESUBMITTED';
ALTER TYPE "AuditAction" ADD VALUE 'POINTS_AWARDED';
ALTER TYPE "AuditAction" ADD VALUE 'BADGE_EARNED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntityType" ADD VALUE 'PLANOGRAM_TEMPLATE';
ALTER TYPE "AuditEntityType" ADD VALUE 'PLANOGRAM_SUBMISSION';
ALTER TYPE "AuditEntityType" ADD VALUE 'POINT_TRANSACTION';
ALTER TYPE "AuditEntityType" ADD VALUE 'BADGE';

-- AlterTable
ALTER TABLE "corrective_actions" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceType" "CAPASourceType" NOT NULL DEFAULT 'AUDIT_FINDING',
ADD COLUMN     "storeId" TEXT,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "findingId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "planogram_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "referencePhotoUrls" TEXT[],
    "targetStoreIds" TEXT[],
    "targetRegionIds" TEXT[],
    "dueDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planogram_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planogram_submissions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "photoUrls" TEXT[],
    "notes" TEXT,
    "status" "PlanogramSubmissionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planogram_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_configs" (
    "id" TEXT NOT NULL,
    "actionType" "GamificationActionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "point_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_points" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "weeklyPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" "GamificationActionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "criteria" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "planogram_templates_createdById_idx" ON "planogram_templates"("createdById");

-- CreateIndex
CREATE INDEX "planogram_submissions_templateId_idx" ON "planogram_submissions"("templateId");

-- CreateIndex
CREATE INDEX "planogram_submissions_storeId_idx" ON "planogram_submissions"("storeId");

-- CreateIndex
CREATE INDEX "planogram_submissions_status_idx" ON "planogram_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "point_configs_actionType_key" ON "point_configs"("actionType");

-- CreateIndex
CREATE UNIQUE INDEX "user_points_userId_key" ON "user_points"("userId");

-- CreateIndex
CREATE INDEX "user_points_totalPoints_idx" ON "user_points"("totalPoints");

-- CreateIndex
CREATE INDEX "point_transactions_userId_idx" ON "point_transactions"("userId");

-- CreateIndex
CREATE INDEX "point_transactions_createdAt_idx" ON "point_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "corrective_actions_storeId_idx" ON "corrective_actions"("storeId");

-- CreateIndex
CREATE INDEX "corrective_actions_status_idx" ON "corrective_actions"("status");

-- CreateIndex
CREATE INDEX "corrective_actions_sourceType_sourceId_idx" ON "corrective_actions"("sourceType", "sourceId");

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planogram_templates" ADD CONSTRAINT "planogram_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planogram_submissions" ADD CONSTRAINT "planogram_submissions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "planogram_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planogram_submissions" ADD CONSTRAINT "planogram_submissions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planogram_submissions" ADD CONSTRAINT "planogram_submissions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planogram_submissions" ADD CONSTRAINT "planogram_submissions_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_points" ADD CONSTRAINT "user_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
