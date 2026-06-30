-- AlterTable
ALTER TABLE "public"."EmploymentHistory" ADD COLUMN     "importedFromDOC" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ADD COLUMN     "hasManuallyUpdatedEmploymentHistory" BOOLEAN NOT NULL DEFAULT false;
