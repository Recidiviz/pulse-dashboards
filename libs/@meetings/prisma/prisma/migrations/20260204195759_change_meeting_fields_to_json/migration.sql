/*
  Warnings:

  - The `actionItems` column on the `Meeting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `criticalUpdates` column on the `Meeting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `meetingSummary` column on the `Meeting` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Meeting" DROP COLUMN "actionItems",
ADD COLUMN     "actionItems" JSONB,
DROP COLUMN "criticalUpdates",
ADD COLUMN     "criticalUpdates" JSONB,
DROP COLUMN "meetingSummary",
ADD COLUMN     "meetingSummary" JSONB;
