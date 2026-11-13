-- CreateEnum
CREATE TYPE "SAREventType" AS ENUM ('Opened', 'ReportEdited', 'ReportCompleted', 'Signed', 'Downloaded', 'Unlocked', 'DataUpdatedORAS', 'DataUpdatedMOCIS', 'DataUpdatedInsights');

-- CreateEnum
CREATE TYPE "SAREventStaffRole" AS ENUM ('Officer', 'Supervisor');

-- CreateTable
CREATE TABLE "SAREvent" (
    "id" TEXT NOT NULL,
    "type" "SAREventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffId" TEXT,
    "staffName" TEXT,
    "staffRole" "SAREventStaffRole",
    "sentencingAssessmentReportId" TEXT NOT NULL,

    CONSTRAINT "SAREvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SAREvent_sentencingAssessmentReportId_occurredAt_idx" ON "SAREvent"("sentencingAssessmentReportId", "occurredAt");

-- AddForeignKey
ALTER TABLE "SAREvent" ADD CONSTRAINT "SAREvent_sentencingAssessmentReportId_fkey" FOREIGN KEY ("sentencingAssessmentReportId") REFERENCES "SentencingAssessmentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
