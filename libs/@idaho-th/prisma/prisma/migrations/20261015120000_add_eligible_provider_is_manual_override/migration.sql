-- Distinguishes a hand-added provider from one the eligibility engine derived.
-- Previously inferred from "eligibilityOverrideNote" IS NOT NULL, but that note
-- is optional, so a manual add made without one was deleted whenever the
-- application form was next edited and the derived set recomputed.

ALTER TABLE "EligibleHousingProvider"
  ADD COLUMN "isManualOverride" BOOLEAN NOT NULL DEFAULT false;

-- Every row that carries a note was necessarily added by hand; rows without one
-- are ambiguous and stay false, matching the behaviour they have today.
UPDATE "EligibleHousingProvider"
SET "isManualOverride" = true
WHERE "eligibilityOverrideNote" IS NOT NULL;
