-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN IF NOT EXISTS "supervisionLocation" TEXT,
ADD COLUMN IF NOT EXISTS "supervisionLevel" TEXT,
ADD COLUMN IF NOT EXISTS "expirationDate" DATE,
ADD COLUMN IF NOT EXISTS "lastRiskAssessmentDate" DATE,
ADD COLUMN IF NOT EXISTS "isSexOffenseCase" BOOLEAN;

-- AlterTable
ALTER TABLE "public"."Resident" ADD COLUMN IF NOT EXISTS "unitId" TEXT,
ADD COLUMN IF NOT EXISTS "custodyLevel" TEXT,
ADD COLUMN IF NOT EXISTS "releaseDate" DATE,
ADD COLUMN IF NOT EXISTS "paroleEligibilityDate" DATE,
ADD COLUMN IF NOT EXISTS "paroleHearingMonth" DATE,
ADD COLUMN IF NOT EXISTS "lastRiskAssessmentDate" DATE;
