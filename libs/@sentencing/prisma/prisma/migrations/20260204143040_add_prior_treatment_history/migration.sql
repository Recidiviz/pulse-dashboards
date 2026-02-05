-- CreateEnum
CREATE TYPE "public"."TreatmentProgramCategory" AS ENUM ('CommunityTreatment', 'EducationProgram', 'CognitiveProgram');

-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ADD COLUMN     "priorTreatmentHistorySummary" TEXT;

-- CreateTable
CREATE TABLE "public"."PriorTreatmentHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentencingAssessmentReportId" TEXT NOT NULL,
    "programName" TEXT,
    "yearCompleted" INTEGER,
    "verifiedByReportAuthor" BOOLEAN,

    CONSTRAINT "PriorTreatmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DOCTreatmentHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientExternalId" TEXT NOT NULL,
    "programCategory" "public"."TreatmentProgramCategory",
    "programName" TEXT,
    "completedOn" TIMESTAMP(3),

    CONSTRAINT "DOCTreatmentHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PriorTreatmentHistory" ADD CONSTRAINT "PriorTreatmentHistory_sentencingAssessmentReportId_fkey" FOREIGN KEY ("sentencingAssessmentReportId") REFERENCES "public"."SentencingAssessmentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DOCTreatmentHistory" ADD CONSTRAINT "DOCTreatmentHistory_clientExternalId_fkey" FOREIGN KEY ("clientExternalId") REFERENCES "public"."Client"("externalId") ON DELETE CASCADE ON UPDATE CASCADE;
