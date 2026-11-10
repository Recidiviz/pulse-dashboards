-- =============================================================================
-- Split HousingProvider, which carried both an organization and its single
-- representative, into three tables:
--
--   HousingProvider               the organization
--   HousingProviderUser           the people who manage it
--   HousingProviderUserAssignment which organizations each person manages
--
-- HousingApplicationTimelineReadState is split the same way, because its one
-- viewer column meant a person for staff and an organization for providers.
--
-- Load-bearing property of this migration: each organization's existing
-- `pseudonymizedId` is MOVED onto the user row created for it, never
-- regenerated. Every bare-string identity column in the schema
-- (uploadedByPseudonymizedId, senderPseudonymizedId, completedByPseudonymizedId,
-- actorPseudonymizedId, staffPseudonymizedId) and every already-issued JWT keeps
-- resolving as a result, so none of them needs a backfill.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Prechecks. Fail loudly and name the offending rows rather than letting a
--    later statement report a bare constraint violation.
--
--    No precheck is needed for two organizations sharing an email: the existing
--    HousingProvider_email_lower_key unique index already makes that impossible.
-- -----------------------------------------------------------------------------

-- 1a. name becomes the organization's identity key for the seed.
DO $$
DECLARE
  duplicate_names TEXT;
BEGIN
  SELECT string_agg(d."name", ', ')
    INTO duplicate_names
    FROM (
      SELECT "name"
        FROM "public"."HousingProvider"
       GROUP BY "name"
      HAVING count(*) > 1
    ) d;

  IF duplicate_names IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot make HousingProvider.name unique: duplicate name(s): %. Resolve these before migrating.',
      duplicate_names;
  END IF;
END $$;

-- 1b. The user backfill trims surrounding whitespace before lowercasing, which
--     the existing lower("email") index does not. Two addresses differing only
--     by padding pass that index today but would collide as users.
DO $$
DECLARE
  collisions TEXT;
BEGIN
  SELECT string_agg(d."normalized", ', ')
    INTO collisions
    FROM (
      SELECT lower(btrim("email")) AS "normalized"
        FROM "public"."HousingProvider"
       WHERE btrim(COALESCE("email", '')) <> ''
       GROUP BY lower(btrim("email"))
      HAVING count(*) > 1
    ) d;

  IF collisions IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot backfill HousingProviderUser: email(s) collide once trimmed: %. Resolve these before migrating.',
      collisions;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. HousingProvider becomes a pure organization.
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."HousingProvider"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Prisma's @updatedAt is written by the client, not by the database; the
-- default above exists only to populate the column for existing rows.
ALTER TABLE "public"."HousingProvider" ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE UNIQUE INDEX "HousingProvider_name_key" ON "public"."HousingProvider"("name");

-- -----------------------------------------------------------------------------
-- 3. New tables.
-- -----------------------------------------------------------------------------

CREATE TABLE "public"."HousingProviderUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "auth0Sub" TEXT,
    "pseudonymizedId" TEXT,
    "linkedAt" TIMESTAMP(3),
    "contactPhone" TEXT,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "digestEnabledAt" TIMESTAMP(3),
    "intercomContactId" TEXT,
    "intercomSyncedAt" TIMESTAMP(3),
    "lastDigestSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousingProviderUser_pkey" PRIMARY KEY ("id")
);

-- Expression index, mirroring HousingProvider_email_lower_key which this
-- replaces. Prisma cannot express it, so `email` carries no `@unique` in
-- schema.prisma; the uniqueness lives here.
CREATE UNIQUE INDEX "HousingProviderUser_email_lower_key" ON "public"."HousingProviderUser" (lower("email"));

CREATE UNIQUE INDEX "HousingProviderUser_auth0Sub_key" ON "public"."HousingProviderUser"("auth0Sub");
CREATE UNIQUE INDEX "HousingProviderUser_pseudonymizedId_key" ON "public"."HousingProviderUser"("pseudonymizedId");
CREATE UNIQUE INDEX "HousingProviderUser_intercomContactId_key" ON "public"."HousingProviderUser"("intercomContactId");
CREATE INDEX "HousingProviderUser_lastDigestSentAt_idx" ON "public"."HousingProviderUser"("lastDigestSentAt");

CREATE TABLE "public"."HousingProviderUserAssignment" (
    "id" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HousingProviderUserAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HousingProviderUserAssignment_providerUserId_providerId_key"
    ON "public"."HousingProviderUserAssignment"("providerUserId", "providerId");
CREATE INDEX "HousingProviderUserAssignment_providerId_idx"
    ON "public"."HousingProviderUserAssignment"("providerId");

ALTER TABLE "public"."HousingProviderUserAssignment"
  ADD CONSTRAINT "HousingProviderUserAssignment_providerUserId_fkey"
  FOREIGN KEY ("providerUserId") REFERENCES "public"."HousingProviderUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."HousingProviderUserAssignment"
  ADD CONSTRAINT "HousingProviderUserAssignment_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "public"."HousingProvider"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."StaffTimelineReadState" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "staffPseudonymizedId" TEXT NOT NULL,
    "lastViewedTimelineAt" TIMESTAMP(3),
    "lastOpenedModalAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffTimelineReadState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffTimelineReadState_applicationId_staffPseudonymizedId_key"
    ON "public"."StaffTimelineReadState"("applicationId", "staffPseudonymizedId");

ALTER TABLE "public"."StaffTimelineReadState"
  ADD CONSTRAINT "StaffTimelineReadState_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "public"."ProviderTimelineReadState" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerUserId" TEXT,
    "lastViewedTimelineAt" TIMESTAMP(3),
    "lastOpenedModalAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderTimelineReadState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderTimelineReadState_applicationId_providerId_key"
    ON "public"."ProviderTimelineReadState"("applicationId", "providerId");

ALTER TABLE "public"."ProviderTimelineReadState"
  ADD CONSTRAINT "ProviderTimelineReadState_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ProviderTimelineReadState"
  ADD CONSTRAINT "ProviderTimelineReadState_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "public"."HousingProvider"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."ProviderTimelineReadState"
  ADD CONSTRAINT "ProviderTimelineReadState_providerUserId_fkey"
  FOREIGN KEY ("providerUserId") REFERENCES "public"."HousingProviderUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 4. Backfill one user per organization that has an email.
--
--    Organizations with a null or empty email get no user: nobody can log in to
--    them today either, and inventing a placeholder address would put fake
--    contact data into the table the Intercom digest reads from.
-- -----------------------------------------------------------------------------

INSERT INTO "public"."HousingProviderUser" (
    "id",
    "name",
    "email",
    "auth0Sub",
    "pseudonymizedId",
    "linkedAt",
    "contactPhone",
    "digestEnabled",
    "digestEnabledAt",
    "intercomContactId",
    "intercomSyncedAt",
    "lastDigestSentAt",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::TEXT,
    COALESCE(NULLIF(btrim(p."contactName"), ''), p."name"),
    lower(btrim(p."email")),
    p."auth0Sub",
    p."pseudonymizedId",
    p."linkedAt",
    p."contactPhone",
    p."digestEnabled",
    p."digestEnabledAt",
    p."intercomContactId",
    p."intercomSyncedAt",
    p."lastDigestSentAt",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "public"."HousingProvider" p
WHERE btrim(COALESCE(p."email", '')) <> '';

-- Each created user manages the organization it came from.
INSERT INTO "public"."HousingProviderUserAssignment" ("id", "providerUserId", "providerId", "createdAt")
SELECT
    gen_random_uuid()::TEXT,
    u."id",
    p."id",
    CURRENT_TIMESTAMP
FROM "public"."HousingProvider" p
JOIN "public"."HousingProviderUser" u
  ON u."email" = lower(btrim(p."email"))
WHERE btrim(COALESCE(p."email", '')) <> '';

DO $$
DECLARE
  skipped INT;
BEGIN
  SELECT count(*) INTO skipped
    FROM "public"."HousingProvider"
   WHERE btrim(COALESCE("email", '')) = '';

  IF skipped > 0 THEN
    RAISE NOTICE
      '% organization(s) had no email address and therefore have no HousingProviderUser and no assignment.',
      skipped;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. Document scoping moves from the organization's pseudonymizedId to its id.
--
--    This is a visibility control, so the check below fails the migration rather
--    than leaving a row unscoped — an unresolved scope would read as "shared
--    with every provider on the application".
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."HousingApplicationDocument" ADD COLUMN "scopedProviderId" TEXT;

UPDATE "public"."HousingApplicationDocument" d
   SET "scopedProviderId" = p."id"
  FROM "public"."HousingProvider" p
 WHERE p."pseudonymizedId" = d."scopedProviderPseudonymizedId";

DO $$
DECLARE
  unresolved INT;
BEGIN
  SELECT count(*) INTO unresolved
    FROM "public"."HousingApplicationDocument"
   WHERE "scopedProviderPseudonymizedId" IS NOT NULL
     AND "scopedProviderId" IS NULL;

  IF unresolved > 0 THEN
    RAISE EXCEPTION
      'Cannot migrate document scoping: % document(s) reference a provider pseudonymizedId with no matching HousingProvider. Leaving them unscoped would share private documents.',
      unresolved;
  END IF;
END $$;

DROP INDEX IF EXISTS "public"."HousingApplicationDocument_scopedProviderPseudonymizedId_idx";
ALTER TABLE "public"."HousingApplicationDocument" DROP COLUMN "scopedProviderPseudonymizedId";

CREATE INDEX "HousingApplicationDocument_scopedProviderId_idx"
    ON "public"."HousingApplicationDocument"("scopedProviderId");

ALTER TABLE "public"."HousingApplicationDocument"
  ADD CONSTRAINT "HousingApplicationDocument_scopedProviderId_fkey"
  FOREIGN KEY ("scopedProviderId") REFERENCES "public"."HousingProvider"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- 6. Split timeline read state. Must run before HousingProvider.pseudonymizedId
--    is dropped, since that column is how provider rows resolve to an
--    organization.
-- -----------------------------------------------------------------------------

INSERT INTO "public"."StaffTimelineReadState" (
    "id", "applicationId", "staffPseudonymizedId",
    "lastViewedTimelineAt", "lastOpenedModalAt", "createdAt", "updatedAt"
)
SELECT
    r."id",
    r."applicationId",
    r."viewerPseudonymizedId",
    r."lastViewedTimelineAt",
    r."lastOpenedModalAt",
    r."createdAt",
    r."updatedAt"
FROM "public"."HousingApplicationTimelineReadState" r
WHERE r."viewerRole" = 'CASE_MANAGER';

-- `providerUserId` is a LEFT JOIN: an organization with no email has no
-- user, so its read state survives with the reader unattributed.
INSERT INTO "public"."ProviderTimelineReadState" (
    "id", "applicationId", "providerId", "providerUserId",
    "lastViewedTimelineAt", "lastOpenedModalAt", "createdAt", "updatedAt"
)
SELECT
    r."id",
    r."applicationId",
    p."id",
    u."id",
    r."lastViewedTimelineAt",
    r."lastOpenedModalAt",
    r."createdAt",
    r."updatedAt"
FROM "public"."HousingApplicationTimelineReadState" r
JOIN "public"."HousingProvider" p
  ON p."pseudonymizedId" = r."viewerPseudonymizedId"
LEFT JOIN "public"."HousingProviderUser" u
  ON u."pseudonymizedId" = r."viewerPseudonymizedId"
WHERE r."viewerRole" = 'PROVIDER';

-- Provider rows whose viewer id matches no organization are dropped by the join
-- above. That only loses an unread badge, never access, so it is reported
-- rather than fatal.
DO $$
DECLARE
  orphaned INT;
BEGIN
  SELECT count(*) INTO orphaned
    FROM "public"."HousingApplicationTimelineReadState" r
   WHERE r."viewerRole" = 'PROVIDER'
     AND NOT EXISTS (
       SELECT 1 FROM "public"."HousingProvider" p
        WHERE p."pseudonymizedId" = r."viewerPseudonymizedId"
     );

  IF orphaned > 0 THEN
    RAISE NOTICE
      '% provider read-state row(s) matched no organization and were not migrated.',
      orphaned;
  END IF;
END $$;

DROP TABLE "public"."HousingApplicationTimelineReadState";

-- -----------------------------------------------------------------------------
-- 7. Drop the person-shaped columns from the organization.
-- -----------------------------------------------------------------------------

DROP INDEX IF EXISTS "public"."HousingProvider_email_lower_key";

ALTER TABLE "public"."HousingProvider"
  DROP COLUMN "email",
  DROP COLUMN "auth0Sub",
  DROP COLUMN "pseudonymizedId",
  DROP COLUMN "linkedAt",
  DROP COLUMN "digestEnabled",
  DROP COLUMN "digestEnabledAt",
  DROP COLUMN "intercomContactId",
  DROP COLUMN "intercomSyncedAt",
  DROP COLUMN "lastDigestSentAt",
  DROP COLUMN "contactName",
  DROP COLUMN "contactPhone";
