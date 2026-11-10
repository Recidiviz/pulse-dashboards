-- Splits the release decision by cohort (Q6 legalCurrentStatus): Termers and
-- Parole Violators get a Parole Commission Decision on the staff row; Riders
-- keep a court Release Decision on the home plan, now probation-worded.
-- Cohort rule matches isRider() in the shared lib: trimmed, lowercased Q6 equal
-- to 'rider' is a Rider; anything else, including null, is Termer/PV.
-- Parameter-free; takes no user input.

-- CreateEnum
CREATE TYPE "public"."ParoleCommissionDecision" AS ENUM ('PAROLE_GRANTED', 'PAROLE_DENIED', 'NOT_APPLICABLE');

-- AlterEnum (not used below, so ADD VALUE is safe inside this transaction)
ALTER TYPE "public"."TimelineEventType" ADD VALUE 'PAROLE_COMMISSION_DECISION_RECORDED' AFTER 'APPROVALS_HOUSING_PLAN_REJECTED';

-- AlterTable
ALTER TABLE "public"."StaffHousingApplication" ADD COLUMN "paroleCommissionDecision" "public"."ParoleCommissionDecision";

-- Backfill Termer/PV: copy the old release decision onto the staff row, while
-- the home plan column still holds the old values.
UPDATE "public"."StaffHousingApplication" AS s
SET "paroleCommissionDecision" = hp."releaseDecision"::text::"public"."ParoleCommissionDecision"
FROM "public"."HousingApplicationHomePlan" AS hp
JOIN "public"."HousingApplication" AS a ON a."id" = hp."applicationId"
WHERE s."applicationId" = hp."applicationId"
  AND hp."releaseDecision" IS NOT NULL
  AND LOWER(TRIM(COALESCE(a."formData"->>'legalCurrentStatus', ''))) <> 'rider';

-- A Rider who advanced on an old N/A release decision had no investigation
-- recorded. The new Rider gate requires an approved investigation (N/A is not
-- allowed), so record it as approved. Runs before the N/A value is remapped.
UPDATE "public"."HousingApplicationHomePlan" AS hp
SET "homePlanInvestigation" = 'APPROVED'
FROM "public"."HousingApplication" AS a
WHERE a."id" = hp."applicationId"
  AND LOWER(TRIM(COALESCE(a."formData"->>'legalCurrentStatus', ''))) = 'rider'
  AND hp."releaseDecision" = 'NOT_APPLICABLE'
  AND hp."homePlanInvestigation" IS NULL
  AND hp."approvalsAt" IS NOT NULL;

-- A Rider still in Approvals may hold an N/A investigation, which the Rider
-- options no longer offer and the Rider gate never clears. Clear it so the CM
-- records a fresh result.
UPDATE "public"."HousingApplicationHomePlan" AS hp
SET "homePlanInvestigation" = NULL
FROM "public"."HousingApplication" AS a
WHERE a."id" = hp."applicationId"
  AND LOWER(TRIM(COALESCE(a."formData"->>'legalCurrentStatus', ''))) = 'rider'
  AND hp."homePlanInvestigation" = 'NOT_APPLICABLE'
  AND hp."approvalsAt" IS NULL;

-- Recreate ReleaseDecision with the Rider-only values. The column goes through
-- text because the mapping depends on another table, which a USING clause
-- cannot read.
ALTER TABLE "public"."HousingApplicationHomePlan"
  ALTER COLUMN "releaseDecision" TYPE TEXT USING ("releaseDecision"::text);

UPDATE "public"."HousingApplicationHomePlan" AS hp
SET "releaseDecision" = CASE
    WHEN LOWER(TRIM(COALESCE(a."formData"->>'legalCurrentStatus', ''))) <> 'rider' THEN NULL
    WHEN hp."releaseDecision" = 'PAROLE_DENIED' THEN 'PROBATION_DENIED'
    -- PAROLE_GRANTED and NOT_APPLICABLE: Riders have no N/A under the new
    -- rules, and a Rider who served their sentence was released.
    ELSE 'PROBATION_GRANTED'
  END
FROM "public"."HousingApplication" AS a
WHERE a."id" = hp."applicationId"
  AND hp."releaseDecision" IS NOT NULL;

-- Before the release gate required an investigation, a Termer/PV with a fully
-- served sentence advanced with none recorded. Record it as not applicable so
-- the row satisfies the gate. approvalsAt excludes cases still in Approvals,
-- whose investigation the CM has yet to record.
UPDATE "public"."HousingApplicationHomePlan" AS hp
SET "homePlanInvestigation" = 'NOT_APPLICABLE'
FROM "public"."StaffHousingApplication" AS s
WHERE s."applicationId" = hp."applicationId"
  AND s."paroleCommissionDecision" = 'NOT_APPLICABLE'
  AND hp."homePlanInvestigation" IS NULL
  AND hp."approvalsAt" IS NOT NULL;

DROP TYPE "public"."ReleaseDecision";
CREATE TYPE "public"."ReleaseDecision" AS ENUM ('PROBATION_GRANTED', 'PROBATION_DENIED');
ALTER TABLE "public"."HousingApplicationHomePlan"
  ALTER COLUMN "releaseDecision" TYPE "public"."ReleaseDecision" USING ("releaseDecision"::"public"."ReleaseDecision");
