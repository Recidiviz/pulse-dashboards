/*
  Warnings:

  - You are about to drop the column `criticalUpdates` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the column `meetingSummary` on the `Meeting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Meeting" DROP COLUMN "criticalUpdates",
DROP COLUMN "meetingSummary";
