-- Data-only migration: carry the retained screening columns over to the
-- approvals columns added in 20260825120000. Idempotent — every UPDATE is
-- guarded on the target column still being NULL.

-- The old screening result was purely the home plan investigation, so it maps
-- across one-to-one along with its audit pair.
UPDATE "public"."HousingApplicationHomePlan"
SET "homePlanInvestigation" = CASE "screeningResult"
      WHEN 'APPROVED' THEN 'APPROVED'::"public"."HomePlanInvestigationResult"
      WHEN 'REJECTED' THEN 'REJECTED'::"public"."HomePlanInvestigationResult"
    END,
    "approvalsAt" = "screeningResultAt",
    "approvalsByStaffPseudonymizedId" = "screeningResultByStaffPseudonymizedId"
WHERE "screeningResult" IS NOT NULL
  AND "homePlanInvestigation" IS NULL;

-- Under the old model an approved screening was the only gate to the Release
-- stage, so a row that reached it implies parole was granted. Without this,
-- deriveApprovalsOutcome would read those rows as WAIT while their application
-- already sits in RELEASE. Rejected rows never had a release decision recorded
-- and stay NULL.
UPDATE "public"."HousingApplicationHomePlan"
SET "releaseDecision" = 'PAROLE_GRANTED'::"public"."ReleaseDecision"
WHERE "screeningResult" = 'APPROVED'
  AND "releaseDecision" IS NULL;
