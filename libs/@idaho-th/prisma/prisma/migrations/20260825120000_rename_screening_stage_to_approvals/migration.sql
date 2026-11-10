-- Prisma does not generate enum-value renames, so these are hand-written.
-- ALTER TYPE ... RENAME VALUE rewrites no rows.

-- AlterEnum
ALTER TYPE "public"."ApplicationStage" RENAME VALUE 'SCREENING' TO 'APPROVALS';

-- AlterEnum
ALTER TYPE "public"."TimelineEventType" RENAME VALUE 'SCREENING_HOUSING_PLAN_APPROVED' TO 'APPROVALS_HOUSING_PLAN_APPROVED';
ALTER TYPE "public"."TimelineEventType" RENAME VALUE 'SCREENING_HOUSING_PLAN_REJECTED' TO 'APPROVALS_HOUSING_PLAN_REJECTED';

-- CreateEnum
CREATE TYPE "public"."ReleaseDecision" AS ENUM ('PAROLE_GRANTED', 'PAROLE_DENIED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "public"."HomePlanInvestigationResult" AS ENUM ('APPROVED', 'REJECTED', 'NOT_APPLICABLE');

-- AlterTable
-- The screeningResult* columns are deliberately retained and unused so the live
-- rows stay available for a later backfill; a follow-up migration drops them.
ALTER TABLE "public"."HousingApplicationHomePlan"
  ADD COLUMN "releaseDecision" "public"."ReleaseDecision",
  ADD COLUMN "homePlanInvestigation" "public"."HomePlanInvestigationResult",
  ADD COLUMN "approvalsAt" TIMESTAMP(3),
  ADD COLUMN "approvalsByStaffPseudonymizedId" TEXT;

-- DropIndex
DROP INDEX "public"."HousingApplicationHomePlan_screeningResult_idx";

-- CreateIndex
CREATE INDEX "HousingApplicationHomePlan_homePlanInvestigation_idx" ON "public"."HousingApplicationHomePlan"("homePlanInvestigation");
