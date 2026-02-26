-- CreateEnum
CREATE TYPE "public"."DomainRiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ADD COLUMN     "criminalBehaviorRiskLevel" "public"."DomainRiskLevel",
ADD COLUMN     "criminalHistoryRiskLevel" "public"."DomainRiskLevel",
ADD COLUMN     "educationRiskLevel" "public"."DomainRiskLevel",
ADD COLUMN     "familySocialSupportRiskLevel" "public"."DomainRiskLevel",
ADD COLUMN     "neighborhoodRiskLevel" "public"."DomainRiskLevel",
ADD COLUMN     "peerAssociatesRiskLevel" "public"."DomainRiskLevel",
ADD COLUMN     "substanceAbuseRiskLevel" "public"."DomainRiskLevel";
