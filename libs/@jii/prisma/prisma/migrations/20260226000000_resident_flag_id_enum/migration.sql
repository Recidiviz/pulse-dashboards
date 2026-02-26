-- CreateEnum
CREATE TYPE "ResidentFlagId" AS ENUM ('usNeGoodTimeAlerts');

-- AlterTable
ALTER TABLE "ResidentFlagInstance"
    ALTER COLUMN "flagId" TYPE "ResidentFlagId" USING "flagId"::"ResidentFlagId";
