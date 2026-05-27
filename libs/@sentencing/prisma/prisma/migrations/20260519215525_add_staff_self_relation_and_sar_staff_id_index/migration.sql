-- CreateIndex
CREATE INDEX "SentencingAssessmentReport_staffId_idx" ON "public"."SentencingAssessmentReport"("staffId");

-- CreateIndex
CREATE INDEX "Staff_supervisorId_idx" ON "public"."Staff"("supervisorId");

-- AddForeignKey
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "public"."Staff"("externalId") ON DELETE SET NULL ON UPDATE CASCADE;
