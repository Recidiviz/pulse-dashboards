-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ALTER COLUMN "isVictimImpactOnly" DROP NOT NULL,
ALTER COLUMN "isVictimImpactOnly" DROP DEFAULT;
