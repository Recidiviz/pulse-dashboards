-- Moves the "New application" and "Release Date moved" notices onto the Alert
-- table: schema, backfill of currently visible notices, then drop the legacy
-- columns. Parameter-free; takes no user input.

-- Recreate the enum rather than ADD VALUE: Postgres rejects using a value
-- added by ADD VALUE in the same transaction, and the backfill below needs it.
ALTER TYPE "public"."AlertType" RENAME TO "AlertType_old";
CREATE TYPE "public"."AlertType" AS ENUM ('SELECTED_AS_HOME_PLAN', 'NEW_APPLICATION', 'RELEASE_DATE_CHANGED');
ALTER TABLE "public"."Alert"
  ALTER COLUMN "type" TYPE "public"."AlertType" USING ("type"::text::"public"."AlertType");
DROP TYPE "public"."AlertType_old";

-- AlterTable
ALTER TABLE "public"."Alert" ADD COLUMN "metadata" JSONB;

-- Backfill NEW_APPLICATION: visible (2-day window, undismissed since the send)
-- and not closed without the provider.
INSERT INTO "public"."Alert" ("id", "type", "applicationId", "providerId", "createdAt")
SELECT gen_random_uuid()::text, 'NEW_APPLICATION', m."applicationId", m."providerId", m."createdAt"
FROM "public"."ProviderHousingApplication" AS m
WHERE NOT (
    m."stage" = 'CLOSED'
    AND m."subStage" IN ('CANCELED', 'NOT_SELECTED', 'DECLINED', 'CONDITIONAL_APPROVAL_REVOKED')
  )
  AND m."createdAt" >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '2 days'
  AND (m."newApplicationDismissedAt" IS NULL OR m."newApplicationDismissedAt" < m."createdAt");

-- Backfill RELEASE_DATE_CHANGED: visible (10-day window, undismissed since the
-- change), not closed without the provider, and only for matches that already
-- existed when the date changed.
INSERT INTO "public"."Alert" ("id", "type", "applicationId", "providerId", "metadata", "createdAt")
SELECT
  gen_random_uuid()::text,
  'RELEASE_DATE_CHANGED',
  a."id",
  m."providerId",
  jsonb_build_object(
    'deltaDays', a."expectedReleaseDate"::date - a."previousExpectedReleaseDate"::date
  ),
  a."expectedReleaseDateChangedAt"
FROM "public"."ProviderHousingApplication" AS m
JOIN "public"."HousingApplication" AS a ON a."id" = m."applicationId"
WHERE NOT (
    m."stage" = 'CLOSED'
    AND m."subStage" IN ('CANCELED', 'NOT_SELECTED', 'DECLINED', 'CONDITIONAL_APPROVAL_REVOKED')
  )
  AND a."expectedReleaseDate" IS NOT NULL
  AND a."previousExpectedReleaseDate" IS NOT NULL
  AND a."expectedReleaseDateChangedAt" >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '10 days'
  AND (m."housingDateChangeDismissedAt" IS NULL OR m."housingDateChangeDismissedAt" < a."expectedReleaseDateChangedAt")
  AND m."createdAt" <= a."expectedReleaseDateChangedAt";

-- AlterTable
ALTER TABLE "public"."HousingApplication" DROP COLUMN "expectedReleaseDateChangedAt",
DROP COLUMN "previousExpectedReleaseDate";

-- AlterTable
ALTER TABLE "public"."ProviderHousingApplication" DROP COLUMN "housingDateChangeDismissedAt",
DROP COLUMN "newApplicationDismissedAt";
