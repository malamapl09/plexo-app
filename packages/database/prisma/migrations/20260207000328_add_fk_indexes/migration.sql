-- CreateIndex
CREATE INDEX "announcements_createdById_idx" ON "announcements"("createdById");

-- CreateIndex
CREATE INDEX "announcements_status_idx" ON "announcements"("status");

-- CreateIndex
CREATE INDEX "discrepancies_receivingId_idx" ON "discrepancies"("receivingId");

-- CreateIndex
CREATE INDEX "issues_storeId_idx" ON "issues"("storeId");

-- CreateIndex
CREATE INDEX "issues_reportedById_idx" ON "issues"("reportedById");

-- CreateIndex
CREATE INDEX "issues_assignedToId_idx" ON "issues"("assignedToId");

-- CreateIndex
CREATE INDEX "issues_resolvedById_idx" ON "issues"("resolvedById");

-- CreateIndex
CREATE INDEX "issues_verifiedById_idx" ON "issues"("verifiedById");

-- CreateIndex
CREATE INDEX "issues_status_idx" ON "issues"("status");

-- CreateIndex
CREATE INDEX "receivings_storeId_idx" ON "receivings"("storeId");

-- CreateIndex
CREATE INDEX "receivings_verifiedById_idx" ON "receivings"("verifiedById");

-- CreateIndex
CREATE INDEX "receivings_status_idx" ON "receivings"("status");

-- CreateIndex
CREATE INDEX "regions_supervisorId_idx" ON "regions"("supervisorId");

-- CreateIndex
CREATE INDEX "stores_regionId_idx" ON "stores"("regionId");

-- CreateIndex
CREATE INDEX "task_assignments_storeId_idx" ON "task_assignments"("storeId");

-- CreateIndex
CREATE INDEX "task_assignments_completedById_idx" ON "task_assignments"("completedById");

-- CreateIndex
CREATE INDEX "task_assignments_verifiedById_idx" ON "task_assignments"("verifiedById");

-- CreateIndex
CREATE INDEX "task_assignments_status_idx" ON "task_assignments"("status");

-- CreateIndex
CREATE INDEX "task_templates_departmentId_idx" ON "task_templates"("departmentId");

-- CreateIndex
CREATE INDEX "task_templates_createdById_idx" ON "task_templates"("createdById");

-- CreateIndex
CREATE INDEX "tasks_departmentId_idx" ON "tasks"("departmentId");

-- CreateIndex
CREATE INDEX "tasks_createdById_idx" ON "tasks"("createdById");

-- CreateIndex
CREATE INDEX "tasks_templateId_idx" ON "tasks"("templateId");

-- CreateIndex
CREATE INDEX "users_storeId_idx" ON "users"("storeId");

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");
