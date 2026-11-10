-- Backfill the parole-board / P&P waiting sub-statuses and AWAITING_RELEASE for
-- existing cases. Release-stage DONE was set automatically before; DONE now means
-- an explicit Mark Complete, so release-stage rows are recomputed from task state.

CREATE TEMP TABLE "_home_plan_status_backfill" AS
SELECT
  hp."applicationId",
  hp."selectedProviderApplicationId",
  hp."releaseDecision",
  hp."homePlanInvestigation",
  EXISTS (
    SELECT 1
    FROM unnest(
      CASE
        WHEN hp."type" = 'MANUAL_ADDRESS' THEN ARRAY[
          'RESIDENT_CONFIRMED_FUNDING', 'FUNDING_SECURED', 'HOUSING_DATE_REQUESTED',
          'HOUSING_DATE_PROVIDED', 'BED_CONFIRMED', 'TRANSPORTATION_SECURED'
        ]
        ELSE ARRAY[
          'RESIDENT_CONFIRMED_FUNDING', 'HOUSING_DATE_REQUESTED',
          'HOUSING_DATE_PROVIDED', 'TRANSPORTATION_SECURED'
        ]
      END
    ) AS owned(task_type)
    WHERE NOT EXISTS (
      SELECT 1
      FROM "HousingApplicationReleaseTask" rt
      WHERE rt."homePlanId" = hp."id"
        AND rt."taskType"::text = owned.task_type
        AND rt."completed"
    )
  ) AS staff_incomplete,
  EXISTS (
    SELECT 1
    FROM unnest(
      CASE
        WHEN hp."type" = 'MANUAL_ADDRESS' THEN ARRAY[]::text[]
        ELSE ARRAY['FUNDING_SECURED', 'BED_CONFIRMED']
      END
    ) AS owned(task_type)
    WHERE NOT EXISTS (
      SELECT 1
      FROM "HousingApplicationReleaseTask" rt
      WHERE rt."homePlanId" = hp."id"
        AND rt."taskType"::text = owned.task_type
        AND rt."completed"
    )
  ) AS provider_incomplete
FROM "HousingApplicationHomePlan" hp;

UPDATE "StaffHousingApplication" sa
SET "status" = CASE
  WHEN b."releaseDecision" IS NULL THEN 'WAITING_ON_PAROLE_BOARD'
  ELSE 'WAITING_ON_PP'
END::"ApplicationStatus"
FROM "_home_plan_status_backfill" b
WHERE b."applicationId" = sa."applicationId"
  AND sa."stage" = 'APPROVALS'
  AND (
    b."releaseDecision" IS NULL
    OR (b."releaseDecision" = 'PAROLE_GRANTED' AND b."homePlanInvestigation" IS NULL)
  );

UPDATE "StaffHousingApplication" sa
SET "status" = CASE
  WHEN b.staff_incomplete THEN 'ACTION_NEEDED'
  WHEN b.provider_incomplete THEN 'WAITING'
  ELSE 'AWAITING_RELEASE'
END::"ApplicationStatus"
FROM "_home_plan_status_backfill" b
WHERE b."applicationId" = sa."applicationId"
  AND sa."stage" = 'RELEASE';

UPDATE "ProviderHousingApplication" pa
SET "status" = CASE
  WHEN b.provider_incomplete THEN 'ACTION_NEEDED'
  WHEN b.staff_incomplete THEN 'WAITING'
  ELSE 'AWAITING_RELEASE'
END::"ApplicationStatus"
FROM "_home_plan_status_backfill" b
WHERE b."selectedProviderApplicationId" = pa."id"
  AND pa."stage" = 'RELEASE';

DROP TABLE "_home_plan_status_backfill";
