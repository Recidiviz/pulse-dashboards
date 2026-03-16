-- AlterTable
ALTER TABLE "public"."Client" ALTER COLUMN "lastImportedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Resident" ALTER COLUMN "lastImportedAt" DROP DEFAULT;
