/*
  Warnings:

  - You are about to drop the column `previouslyIncarcerated` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `previouslyUnderSupervision` on the `Case` table. All the data in the column will be lost.
  - The `lsirScore` column on the `Case` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Case" DROP COLUMN "previouslyIncarcerated",
DROP COLUMN "previouslyUnderSupervision",
ADD COLUMN     "previouslyIncarceratedOrUnderSupervision" BOOLEAN,
DROP COLUMN "lsirScore",
ADD COLUMN     "lsirScore" INTEGER;
