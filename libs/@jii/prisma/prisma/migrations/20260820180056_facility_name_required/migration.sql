-- Backfill null names with the row's id before enforcing NOT NULL
UPDATE "public"."IncarcerationFacility" SET "name" = "id" WHERE "name" IS NULL;

-- AlterTable
ALTER TABLE "public"."IncarcerationFacility" ALTER COLUMN "name" SET NOT NULL;
