-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "role_module_access" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "module" TEXT NOT NULL,
    "hasAccess" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_module_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_module_access_role_idx" ON "role_module_access"("role");

-- CreateIndex
CREATE UNIQUE INDEX "role_module_access_role_module_key" ON "role_module_access"("role", "module");
