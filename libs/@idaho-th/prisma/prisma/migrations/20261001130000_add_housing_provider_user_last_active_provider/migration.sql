-- Remember which organization a provider user last chose to act as, so the
-- choice survives a new session or a different device.
--
-- Additive, and deliberately a migration of its own rather than an edit to
-- 20261001120000_split_housing_provider_into_organization_and_users: that one
-- is already applied to the local development and test databases, and editing
-- it would invalidate its recorded checksum and force a reset of both.
--
-- This column is a preference hint, never an authorization fact. It is
-- re-validated against HousingProviderUserAssignment on every request, so a
-- value whose assignment has since been revoked resolves to nothing.
-- SET NULL on delete: removing an organization clears the hint rather than
-- removing the person.

ALTER TABLE "public"."HousingProviderUser" ADD COLUMN "lastActiveProviderId" TEXT;

CREATE INDEX "HousingProviderUser_lastActiveProviderId_idx"
    ON "public"."HousingProviderUser"("lastActiveProviderId");

ALTER TABLE "public"."HousingProviderUser"
  ADD CONSTRAINT "HousingProviderUser_lastActiveProviderId_fkey"
  FOREIGN KEY ("lastActiveProviderId") REFERENCES "public"."HousingProvider"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
