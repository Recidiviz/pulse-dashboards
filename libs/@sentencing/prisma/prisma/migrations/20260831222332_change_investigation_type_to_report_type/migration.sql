/*
  Warnings:

  - You are about to drop the column `investigationType` on the `SentencingAssessmentReport` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."SARReportType" AS ENUM ('SAR', 'PSR');

-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" DROP COLUMN "investigationType",
ADD COLUMN     "reportType" "public"."SARReportType" NOT NULL DEFAULT 'SAR';

-- DropEnum
DROP TYPE "public"."InvestigationType";
