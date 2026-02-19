-- AlterTable
ALTER TABLE "training_lessons" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "training_quiz_questions" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "training_enrollments_courseId_status_idx" ON "training_enrollments"("courseId", "status");

-- CreateIndex
CREATE INDEX "training_courses_isMandatory_idx" ON "training_courses"("isMandatory");
