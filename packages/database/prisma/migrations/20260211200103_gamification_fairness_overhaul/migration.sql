-- CreateEnum
CREATE TYPE "StoreTier" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "point_transactions" ADD COLUMN     "isFirstAttempt" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "qualityMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "tier" "StoreTier",
ADD COLUMN     "tierOverride" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "store_departments" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_points" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "weeklyPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyPoints" INTEGER NOT NULL DEFAULT 0,
    "perCapitaTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perCapitaWeekly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perCapitaMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyComplianceRate" DOUBLE PRECISION,
    "monthlyComplianceRate" DOUBLE PRECISION,
    "activeEmployeeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_points" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "weeklyPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyPoints" INTEGER NOT NULL DEFAULT 0,
    "perCapitaTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perCapitaWeekly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perCapitaMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activeEmployeeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_departments_storeId_idx" ON "store_departments"("storeId");

-- CreateIndex
CREATE INDEX "store_departments_departmentId_idx" ON "store_departments"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "store_departments_storeId_departmentId_key" ON "store_departments"("storeId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "store_points_storeId_key" ON "store_points"("storeId");

-- CreateIndex
CREATE INDEX "store_points_perCapitaWeekly_idx" ON "store_points"("perCapitaWeekly");

-- CreateIndex
CREATE INDEX "store_points_perCapitaMonthly_idx" ON "store_points"("perCapitaMonthly");

-- CreateIndex
CREATE INDEX "store_points_perCapitaTotal_idx" ON "store_points"("perCapitaTotal");

-- CreateIndex
CREATE INDEX "department_points_perCapitaWeekly_idx" ON "department_points"("perCapitaWeekly");

-- CreateIndex
CREATE INDEX "department_points_perCapitaMonthly_idx" ON "department_points"("perCapitaMonthly");

-- CreateIndex
CREATE INDEX "department_points_perCapitaTotal_idx" ON "department_points"("perCapitaTotal");

-- CreateIndex
CREATE UNIQUE INDEX "department_points_storeId_departmentId_key" ON "department_points"("storeId", "departmentId");

-- AddForeignKey
ALTER TABLE "store_departments" ADD CONSTRAINT "store_departments_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_departments" ADD CONSTRAINT "store_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_points" ADD CONSTRAINT "store_points_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_points" ADD CONSTRAINT "department_points_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_points" ADD CONSTRAINT "department_points_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: Auto-calculate store tiers based on active employee count
UPDATE "stores" s SET "tier" = CASE
  WHEN (SELECT COUNT(*) FROM "users" u WHERE u."storeId" = s."id" AND u."isActive" = true) <= 15 THEN 'SMALL'::"StoreTier"
  WHEN (SELECT COUNT(*) FROM "users" u WHERE u."storeId" = s."id" AND u."isActive" = true) <= 40 THEN 'MEDIUM'::"StoreTier"
  ELSE 'LARGE'::"StoreTier"
END
WHERE s."isActive" = true;

-- Backfill: Initialize StorePoints for every active store
INSERT INTO "store_points" ("id", "storeId", "activeEmployeeCount", "updatedAt")
SELECT gen_random_uuid(), s."id",
  COALESCE((SELECT COUNT(*) FROM "users" u WHERE u."storeId" = s."id" AND u."isActive" = true), 0),
  NOW()
FROM "stores" s
WHERE s."isActive" = true
ON CONFLICT ("storeId") DO NOTHING;
