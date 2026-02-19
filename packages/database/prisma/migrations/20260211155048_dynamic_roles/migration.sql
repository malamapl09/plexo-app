-- Dynamic Roles: Convert UserRole enum to DB-driven Role table
-- Hand-edited to preserve existing data

-- 1. Create the roles table first
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "level" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- 2. Seed the 5 existing roles
INSERT INTO "roles" ("id", "key", "label", "description", "color", "level", "isActive", "sortOrder", "updatedAt") VALUES
  (gen_random_uuid(), 'OPERATIONS_MANAGER', 'Gerente de Operaciones', 'Acceso completo a todas las funciones del sistema', 'blue', 100, true, 1, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'HQ_TEAM', 'Equipo HQ', 'Equipo central de oficina principal', 'purple', 80, true, 2, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'REGIONAL_SUPERVISOR', 'Supervisor Regional', 'Supervisión de tiendas por región', 'green', 60, true, 3, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'STORE_MANAGER', 'Gerente de Tienda', 'Gestión completa de una tienda', 'orange', 40, true, 4, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'DEPT_SUPERVISOR', 'Supervisor de Departamento', 'Supervisión de departamento dentro de una tienda', 'gray', 20, true, 5, CURRENT_TIMESTAMP);

-- 3. Convert enum columns to TEXT using cast (preserves data)
ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
ALTER TABLE "audit_logs" ALTER COLUMN "performedByRole" TYPE TEXT USING "performedByRole"::TEXT;
ALTER TABLE "verifications" ALTER COLUMN "submittedByRole" TYPE TEXT USING "submittedByRole"::TEXT;
ALTER TABLE "verifications" ALTER COLUMN "verifiedByRole" TYPE TEXT USING "verifiedByRole"::TEXT;
ALTER TABLE "role_module_access" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;

-- targetRoles is an array column — need to drop and recreate
-- First save existing data, then recreate as TEXT[]
ALTER TABLE "announcements" ALTER COLUMN "targetRoles" TYPE TEXT[] USING "targetRoles"::TEXT[];

-- 4. Drop the old enum type
DROP TYPE "UserRole";

-- 5. Recreate indexes that Prisma expects
DROP INDEX IF EXISTS "role_module_access_role_idx";
CREATE INDEX "role_module_access_role_idx" ON "role_module_access"("role");
DROP INDEX IF EXISTS "role_module_access_role_module_key";
CREATE UNIQUE INDEX "role_module_access_role_module_key" ON "role_module_access"("role", "module");
