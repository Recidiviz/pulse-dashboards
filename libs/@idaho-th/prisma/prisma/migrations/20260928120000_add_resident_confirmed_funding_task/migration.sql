-- Add RESIDENT_CONFIRMED_FUNDING to ReleaseTaskType.
-- Postgres forbids using a newly ADD VALUE'd enum member in the same
-- transaction that added it, and Prisma applies each migration.sql as one
-- transaction. So we swap to a fresh enum type that includes the new value.

CREATE TYPE "public"."ReleaseTaskType_new" AS ENUM (
  'RESIDENT_CONFIRMED_FUNDING',
  'FUNDING_SECURED',
  'HOUSING_DATE_REQUESTED',
  'HOUSING_DATE_PROVIDED',
  'BED_CONFIRMED',
  'TRANSPORTATION_SECURED'
);

ALTER TABLE "public"."HousingApplicationReleaseTask"
  ALTER COLUMN "taskType" TYPE "public"."ReleaseTaskType_new"
  USING ("taskType"::text::"public"."ReleaseTaskType_new");

DROP TYPE "public"."ReleaseTaskType";

ALTER TYPE "public"."ReleaseTaskType_new" RENAME TO "ReleaseTaskType";

-- Backfill: insert a RESIDENT_CONFIRMED_FUNDING row for every existing home plan
-- so that pre-existing plans can resolve the task by type without throwing.
INSERT INTO "HousingApplicationReleaseTask" ("id", "homePlanId", "taskType", "completed", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  hp."id",
  'RESIDENT_CONFIRMED_FUNDING'::"ReleaseTaskType",
  false,
  NOW(),
  NOW()
FROM "HousingApplicationHomePlan" hp
WHERE NOT EXISTS (
  SELECT 1
  FROM "HousingApplicationReleaseTask" rt
  WHERE rt."homePlanId" = hp."id"
    AND rt."taskType" = 'RESIDENT_CONFIRMED_FUNDING'
);
