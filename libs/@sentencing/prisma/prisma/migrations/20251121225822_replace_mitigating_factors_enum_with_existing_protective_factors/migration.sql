/*
  Warnings:

  - The `mitigatingFactors` column on the `SentencingAssessmentReport` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" DROP COLUMN "mitigatingFactors",
ADD COLUMN     "mitigatingFactors" "public"."ProtectiveFactor"[];

-- DropEnum
DROP TYPE "public"."MitigatingFactor";
