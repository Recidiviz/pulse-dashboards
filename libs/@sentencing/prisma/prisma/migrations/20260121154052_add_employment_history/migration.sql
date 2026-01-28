-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" DROP COLUMN "currentEmployer",
DROP COLUMN "employerAtOffense",
ADD COLUMN "employedAtOffense" BOOLEAN;

-- CreateTable
CREATE TABLE "public"."EmploymentHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentencingAssessmentReportId" TEXT NOT NULL,
    "employerName" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "verifiedByReportAuthor" BOOLEAN,

    CONSTRAINT "EmploymentHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."EmploymentHistory" ADD CONSTRAINT "EmploymentHistory_sentencingAssessmentReportId_fkey" FOREIGN KEY ("sentencingAssessmentReportId") REFERENCES "public"."SentencingAssessmentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
