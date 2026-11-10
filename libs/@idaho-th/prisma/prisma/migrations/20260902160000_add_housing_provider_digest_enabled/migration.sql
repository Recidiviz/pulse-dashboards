ALTER TABLE "HousingProvider"
  ADD COLUMN "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "digestEnabledAt" TIMESTAMP(3);

-- Providers who have already signed in satisfy the rule by definition, and must
-- not silently lose their digest on deploy. Stamping "digestEnabledAt" marks the
-- flag as decided, so the login converge can never re-enable an opt-out.
UPDATE "HousingProvider"
   SET "digestEnabled" = true,
       "digestEnabledAt" = COALESCE("linkedAt", CURRENT_TIMESTAMP)
 WHERE "auth0Sub" IS NOT NULL;
