-- DropIndex
ALTER TABLE "public"."HousingProvider" DROP CONSTRAINT IF EXISTS "HousingProvider_email_key";
DROP INDEX IF EXISTS "public"."HousingProvider_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "HousingProvider_email_lower_key" ON "public"."HousingProvider" (lower("email"));
