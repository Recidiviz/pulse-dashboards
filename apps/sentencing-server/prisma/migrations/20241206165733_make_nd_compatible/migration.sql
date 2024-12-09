/*
  Warnings:

  - You are about to drop the column `assignedDate` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `completionDate` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `sentenceDate` on the `Case` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Case" DROP COLUMN "assignedDate",
DROP COLUMN "completionDate",
DROP COLUMN "sentenceDate",
ADD COLUMN     "district" TEXT,
ALTER COLUMN "county" DROP NOT NULL;
