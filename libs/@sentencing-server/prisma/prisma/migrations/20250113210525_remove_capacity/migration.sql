/*
  Warnings:

  - You are about to drop the column `availableCapacity` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the column `totalCapacity` on the `Opportunity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Opportunity" DROP COLUMN "availableCapacity",
DROP COLUMN "totalCapacity";
