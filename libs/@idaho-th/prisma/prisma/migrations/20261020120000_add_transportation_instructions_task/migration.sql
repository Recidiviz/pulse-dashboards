-- Add TRANSPORTATION_INSTRUCTIONS to ReleaseTaskType.
-- Postgres forbids using a newly ADD VALUE'd enum member in the same
-- transaction that added it, and Prisma applies each migration.sql as one
-- transaction. So we swap to a fresh enum type that includes the new value.

CREATE TYPE "public"."ReleaseTaskType_new" AS ENUM (
  'RESIDENT_CONFIRMED_FUNDING',
  'FUNDING_SECURED',
  'HOUSING_DATE_REQUESTED',
  'HOUSING_DATE_PROVIDED',
  'BED_CONFIRMED',
  'TRANSPORTATION_SECURED',
  'TRANSPORTATION_INSTRUCTIONS'
);

ALTER TABLE "public"."HousingApplicationReleaseTask"
  ALTER COLUMN "taskType" TYPE "public"."ReleaseTaskType_new"
  USING ("taskType"::text::"public"."ReleaseTaskType_new");

DROP TYPE "public"."ReleaseTaskType";

ALTER TYPE "public"."ReleaseTaskType_new" RENAME TO "ReleaseTaskType";

-- Backfill: insert an incomplete TRANSPORTATION_INSTRUCTIONS row for every
-- existing home plan (closed cases included) so pre-existing plans can resolve
-- the task by type without the server throwing. completed=false so no plan is
-- silently marked done.
INSERT INTO "HousingApplicationReleaseTask" ("id", "homePlanId", "taskType", "completed", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  hp."id",
  'TRANSPORTATION_INSTRUCTIONS'::"ReleaseTaskType",
  false,
  NOW(),
  NOW()
FROM "HousingApplicationHomePlan" hp
WHERE NOT EXISTS (
  SELECT 1
  FROM "HousingApplicationReleaseTask" rt
  WHERE rt."homePlanId" = hp."id"
    AND rt."taskType" = 'TRANSPORTATION_INSTRUCTIONS'
);

-- Status recomputation for RELEASE-stage non-closed PROVIDER-typed home plans.
-- The new unchecked task is PROVIDER-owned, so provider-side incomplete flips
-- true for every such plan. Mirrors resolveReleaseStageStatus() in
-- homePlan.progression.ts (ownIncomplete -> ACTION_NEEDED; !ownIncomplete &&
-- otherIncomplete -> WAITING). Manual-address plans are skipped: they have no
-- selected provider, and their staff-side status will recompute on the next
-- toggle.

-- Every non-closed selected provider now has an incomplete owned task -> their
-- status is ACTION_NEEDED. Idempotent: skips rows already ACTION_NEEDED.
UPDATE "ProviderHousingApplication" pa
SET "status" = 'ACTION_NEEDED', "updatedAt" = NOW()
FROM "HousingApplicationHomePlan" hp
JOIN "StaffHousingApplication" sa ON sa."applicationId" = hp."applicationId"
WHERE pa."id" = hp."selectedProviderApplicationId"
  AND sa."stage" = 'RELEASE'
  AND hp."type" = 'PROVIDER'
  AND pa."status" <> 'ACTION_NEEDED';

-- Only plans currently at AWAITING_RELEASE on the staff side had both parties
-- fully complete; those move to WAITING (staff done, now waiting on provider).
-- Staff rows already ACTION_NEEDED or WAITING stay as-is.
UPDATE "StaffHousingApplication" sa
SET "status" = 'WAITING', "updatedAt" = NOW()
FROM "HousingApplicationHomePlan" hp
WHERE hp."applicationId" = sa."applicationId"
  AND sa."stage" = 'RELEASE'
  AND hp."type" = 'PROVIDER'
  AND hp."selectedProviderApplicationId" IS NOT NULL
  AND sa."status" = 'AWAITING_RELEASE';
