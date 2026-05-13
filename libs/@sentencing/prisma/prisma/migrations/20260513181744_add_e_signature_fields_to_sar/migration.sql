-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ADD COLUMN     "officerLastSignedAt" TIMESTAMP(3),
ADD COLUMN     "officerSignature" TEXT,
ADD COLUMN     "officerTitle" TEXT,
ADD COLUMN     "supervisorLastSignedAt" TIMESTAMP(3),
ADD COLUMN     "supervisorSignature" TEXT,
ADD COLUMN     "supervisorTitle" TEXT;
