-- CreateEnum
CREATE TYPE "UsNeCheckInVersion" AS ENUM ('v0', 'v1');

-- AlterTable
ALTER TABLE "UsNeCheckIn" ADD COLUMN     "version" "UsNeCheckInVersion";

-- Backfill null versions with the default value before enforcing NOT NULL
UPDATE "UsNeCheckIn" SET "version" = 'v0' WHERE "version" IS NULL;

-- AlterTable
ALTER TABLE "UsNeCheckIn" ALTER COLUMN "version" SET NOT NULL;
