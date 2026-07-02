-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ADD COLUMN     "ORASDomainsAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "noORASDomainReason" TEXT;
