-- AlterTable
ALTER TABLE "public"."Resident" ADD COLUMN     "importedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
