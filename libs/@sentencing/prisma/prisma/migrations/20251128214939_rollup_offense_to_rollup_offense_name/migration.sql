/*
  Warnings:

  - You are about to drop the column `rollupOffenseId` on the `Insight` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Insight" DROP CONSTRAINT "Insight_rollupOffenseId_fkey";

-- AlterTable
ALTER TABLE "public"."Insight" DROP COLUMN "rollupOffenseId",
ADD COLUMN     "rollupOffenseName" TEXT;
