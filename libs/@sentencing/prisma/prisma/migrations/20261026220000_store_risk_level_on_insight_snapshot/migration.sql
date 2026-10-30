-- AlterTable
ALTER TABLE "public"."SARInsightSnapshot" DROP COLUMN "assessmentScoreBucketStart",
DROP COLUMN "assessmentScoreBucketEnd",
ADD COLUMN     "assessmentRiskLevel" "public"."DomainRiskLevel";
