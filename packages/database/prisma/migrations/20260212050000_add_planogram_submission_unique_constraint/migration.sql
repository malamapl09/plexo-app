-- CreateIndex
CREATE UNIQUE INDEX "planogram_submissions_templateId_storeId_key" ON "planogram_submissions"("templateId", "storeId");
