-- CreateEnum
CREATE TYPE "TrainingCourseCategory" AS ENUM ('OPERATIONS', 'CASH_MANAGEMENT', 'CUSTOMER_SERVICE', 'INVENTORY', 'COMPLIANCE', 'SAFETY');

-- CreateEnum
CREATE TYPE "TrainingLessonType" AS ENUM ('TEXT', 'PDF', 'VIDEO', 'QUIZ');

-- CreateEnum
CREATE TYPE "TrainingQuizQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE');

-- CreateEnum
CREATE TYPE "TrainingEnrollmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TrainingProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'TRAINING_COURSE';
ALTER TYPE "AuditEntityType" ADD VALUE 'TRAINING_ENROLLMENT';

-- AlterEnum
ALTER TYPE "GamificationActionType" ADD VALUE 'TRAINING_COMPLETED';
ALTER TYPE "GamificationActionType" ADD VALUE 'PERFECT_TRAINING_SCORE';

-- CreateTable
CREATE TABLE "training_courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "TrainingCourseCategory" NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scope" TEXT NOT NULL DEFAULT 'ALL',
    "targetStoreIds" TEXT[],
    "targetRoleIds" TEXT[],
    "certificationValidDays" INTEGER,
    "estimatedDurationMinutes" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_lessons" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" "TrainingLessonType" NOT NULL,
    "content" TEXT,
    "fileUrl" TEXT,
    "estimatedMinutes" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_quiz_questions" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "type" "TrainingQuizQuestionType" NOT NULL,
    "options" JSONB NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_enrollments" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "TrainingEnrollmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "score" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "certificateExpiresAt" TIMESTAMP(3),
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" "TrainingProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "score" DOUBLE PRECISION,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "training_courses_createdById_idx" ON "training_courses"("createdById");
CREATE INDEX "training_courses_category_idx" ON "training_courses"("category");
CREATE INDEX "training_courses_isActive_idx" ON "training_courses"("isActive");

-- CreateIndex
CREATE INDEX "training_lessons_courseId_idx" ON "training_lessons"("courseId");

-- CreateIndex
CREATE INDEX "training_quiz_questions_lessonId_idx" ON "training_quiz_questions"("lessonId");

-- CreateIndex
CREATE INDEX "training_enrollments_userId_idx" ON "training_enrollments"("userId");
CREATE INDEX "training_enrollments_status_idx" ON "training_enrollments"("status");
CREATE UNIQUE INDEX "training_enrollments_courseId_userId_key" ON "training_enrollments"("courseId", "userId");

-- CreateIndex
CREATE INDEX "training_progress_enrollmentId_idx" ON "training_progress"("enrollmentId");
CREATE UNIQUE INDEX "training_progress_enrollmentId_lessonId_key" ON "training_progress"("enrollmentId", "lessonId");

-- AddForeignKey
ALTER TABLE "training_courses" ADD CONSTRAINT "training_courses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_lessons" ADD CONSTRAINT "training_lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_quiz_questions" ADD CONSTRAINT "training_quiz_questions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "training_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "training_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_progress" ADD CONSTRAINT "training_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "training_lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
