-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "isReportTypeLocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "isGenderLocked" BOOLEAN NOT NULL DEFAULT false;
