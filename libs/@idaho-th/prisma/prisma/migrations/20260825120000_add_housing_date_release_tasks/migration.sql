-- Release Tasks list changes from (HOUSING_APPLICATION_SIGNED, FUNDING_SECURED,
-- RELEASE_DATE_ASSIGNED, BED_CONFIRMED, TRANSPORTATION_SECURED) to
-- (FUNDING_SECURED, HOUSING_DATE_REQUESTED, HOUSING_DATE_PROVIDED, BED_CONFIRMED,
-- TRANSPORTATION_SECURED). HOUSING_APPLICATION_SIGNED is dropped outright;
-- RELEASE_DATE_ASSIGNED is split into the two new housing-date tasks.
--
-- Everything (data backfill + enum value swap) happens in this one migration.
-- We go straight to a freshly created enum type with the final value set
-- (rather than ALTER TYPE ... ADD VALUE followed by a later migration) because
-- Postgres forbids using a newly ADD VALUE'd enum member in the same
-- transaction that added it, and Prisma applies each migration.sql as one
-- transaction. Capture the RELEASE_DATE_ASSIGNED rows in a temp table first,
-- since they must be deleted (their taskType value won't exist in the new
-- enum) before the column can be swapped over, but new rows using the new
-- enum values can't be inserted until after the swap.

-- Capture existing RELEASE_DATE_ASSIGNED rows before they're deleted, so we
-- can re-derive HOUSING_DATE_REQUESTED / HOUSING_DATE_PROVIDED rows from them
-- once the column has moved to the new enum type.
CREATE TEMP TABLE "_release_date_assigned_backfill" AS
SELECT "homePlanId", "completed", "completedAt", "completedByRole", "completedByPseudonymizedId", "createdAt", "updatedAt"
FROM "public"."HousingApplicationReleaseTask"
WHERE "taskType" = 'RELEASE_DATE_ASSIGNED';

-- Drop rows referencing the two retired task types so no row is left
-- pointing at a value the new enum type won't contain.
DELETE FROM "public"."HousingApplicationReleaseTask"
WHERE "taskType" IN ('RELEASE_DATE_ASSIGNED', 'HOUSING_APPLICATION_SIGNED');

-- Swap ReleaseTaskType to its final value set. ReleaseTaskType is used by
-- exactly this one column in the schema; no other table needs migrating.
-- Historical TimelineEvent rows store the task type as a plain string inside
-- a Json metadata field (not this enum type), so they are unaffected.
CREATE TYPE "public"."ReleaseTaskType_new" AS ENUM ('FUNDING_SECURED', 'HOUSING_DATE_REQUESTED', 'HOUSING_DATE_PROVIDED', 'BED_CONFIRMED', 'TRANSPORTATION_SECURED');

ALTER TABLE "public"."HousingApplicationReleaseTask"
  ALTER COLUMN "taskType" TYPE "public"."ReleaseTaskType_new"
  USING ("taskType"::text::"public"."ReleaseTaskType_new");

DROP TYPE "public"."ReleaseTaskType";

ALTER TYPE "public"."ReleaseTaskType_new" RENAME TO "ReleaseTaskType";

-- Re-create the split housing-date tasks from the captured data. If the date
-- was already assigned, both new tasks are marked done with the original
-- completedAt/actor; otherwise both start incomplete for the CM to complete
-- independently going forward.
INSERT INTO "public"."HousingApplicationReleaseTask"
  ("id", "homePlanId", "taskType", "completed", "completedAt", "completedByRole", "completedByPseudonymizedId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  "homePlanId",
  'HOUSING_DATE_REQUESTED',
  "completed",
  "completedAt",
  "completedByRole",
  "completedByPseudonymizedId",
  "createdAt",
  "updatedAt"
FROM "_release_date_assigned_backfill";

INSERT INTO "public"."HousingApplicationReleaseTask"
  ("id", "homePlanId", "taskType", "completed", "completedAt", "completedByRole", "completedByPseudonymizedId", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  "homePlanId",
  'HOUSING_DATE_PROVIDED',
  "completed",
  "completedAt",
  "completedByRole",
  "completedByPseudonymizedId",
  "createdAt",
  "updatedAt"
FROM "_release_date_assigned_backfill";

DROP TABLE "_release_date_assigned_backfill";

-- AlterTable
ALTER TABLE "public"."HousingApplicationReleaseTask" ADD COLUMN "note" TEXT;
