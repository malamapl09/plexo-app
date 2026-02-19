-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'LOGIN';
ALTER TYPE "AuditAction" ADD VALUE 'LOGOUT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntityType" ADD VALUE 'RECEIVING';
ALTER TYPE "AuditEntityType" ADD VALUE 'USER';
ALTER TYPE "AuditEntityType" ADD VALUE 'STORE';
ALTER TYPE "AuditEntityType" ADD VALUE 'TASK';
ALTER TYPE "AuditEntityType" ADD VALUE 'ANNOUNCEMENT';
