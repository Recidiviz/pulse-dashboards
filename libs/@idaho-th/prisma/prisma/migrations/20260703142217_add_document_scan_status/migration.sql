-- CreateEnum
CREATE TYPE "public"."HousingApplicationDocumentScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."HousingApplicationDocument" ADD COLUMN     "scanStatus" "public"."HousingApplicationDocumentScanStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "HousingApplicationDocument_scanStatus_idx" ON "public"."HousingApplicationDocument"("scanStatus");

-- Backfill: rows already CONFIRMED under the pre-scan flow were auto-confirmed
-- with no ClamAV scan and are already being served to users. Mark them CLEAN
-- (accepting that risk retroactively) rather than PENDING, since nothing will
-- ever scan them after the fact and PENDING would silently cut off access to
-- every document uploaded before this migration.
UPDATE "public"."HousingApplicationDocument"
SET "scanStatus" = 'CLEAN'
WHERE "status" = 'CONFIRMED';

/*
  Warnings:

  - A unique constraint covering the columns `[objectKey]` on the table `HousingApplicationDocument` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."HousingApplicationDocument_bucketName_objectKey_key";

-- CreateIndex
CREATE UNIQUE INDEX "HousingApplicationDocument_objectKey_key" ON "public"."HousingApplicationDocument"("objectKey");
