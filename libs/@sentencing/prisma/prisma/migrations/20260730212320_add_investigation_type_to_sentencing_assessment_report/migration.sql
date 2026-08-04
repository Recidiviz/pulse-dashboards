-- CreateEnum
CREATE TYPE "public"."InvestigationType" AS ENUM ('SAR', 'PSR');

-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ADD COLUMN     "investigationType" "public"."InvestigationType" NOT NULL DEFAULT 'SAR';
