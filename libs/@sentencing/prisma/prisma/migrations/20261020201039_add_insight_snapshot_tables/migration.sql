-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ADD COLUMN     "lockedAt" TIMESTAMP(3);

-- Lock reports MO already marked complete, so they stay read-only and don't
-- snapshot insights that differ from the submitted report. The import only sees
-- a rolling window of reports, so it can't backfill older ones.
UPDATE "public"."SentencingAssessmentReport"
SET "lockedAt" = "completionDate"
WHERE "completionDate" IS NOT NULL;

-- CreateTable
CREATE TABLE "public"."SARInsightSnapshot" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender",
    "assessmentScoreBucketStart" INTEGER,
    "assessmentScoreBucketEnd" INTEGER,
    "offenseName" TEXT,
    "offenseCategory" TEXT,
    "dispositionNumRecords" INTEGER,
    "avgSentenceLengthYears" DOUBLE PRECISION,
    "avgPctServed" DOUBLE PRECISION,
    "timeServedNumRecords" INTEGER,
    "sentencingAssessmentReportId" TEXT NOT NULL,

    CONSTRAINT "SARInsightSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SARInsightSnapshotDisposition" (
    "id" TEXT NOT NULL,
    "recommendationType" TEXT,
    "sentenceLengthBucketStart" INTEGER NOT NULL DEFAULT 0,
    "sentenceLengthBucketEnd" INTEGER NOT NULL DEFAULT -1,
    "percentage" DOUBLE PRECISION NOT NULL,
    "sarInsightSnapshotId" TEXT NOT NULL,

    CONSTRAINT "SARInsightSnapshotDisposition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SARInsightSnapshot_sentencingAssessmentReportId_key" ON "public"."SARInsightSnapshot"("sentencingAssessmentReportId");

-- CreateIndex
CREATE UNIQUE INDEX "SARInsightSnapshotDisposition_sarInsightSnapshotId_recommen_key" ON "public"."SARInsightSnapshotDisposition"("sarInsightSnapshotId", "recommendationType", "sentenceLengthBucketStart", "sentenceLengthBucketEnd");

-- AddForeignKey
ALTER TABLE "public"."SARInsightSnapshot" ADD CONSTRAINT "SARInsightSnapshot_sentencingAssessmentReportId_fkey" FOREIGN KEY ("sentencingAssessmentReportId") REFERENCES "public"."SentencingAssessmentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SARInsightSnapshotDisposition" ADD CONSTRAINT "SARInsightSnapshotDisposition_sarInsightSnapshotId_fkey" FOREIGN KEY ("sarInsightSnapshotId") REFERENCES "public"."SARInsightSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
