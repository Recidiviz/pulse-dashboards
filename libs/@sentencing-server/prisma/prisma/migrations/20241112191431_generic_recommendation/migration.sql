/*
  Warnings:

  - The `selectedRecommendation` column on the `Case` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `recommendationType` on the `Disposition` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `recommendationType` on the `RecidivismSeries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Case" ALTER COLUMN "selectedRecommendation" TYPE TEXT;

-- AlterTable
ALTER TABLE "Disposition" ALTER COLUMN "recommendationType" TYPE TEXT;

-- AlterTable
ALTER TABLE "RecidivismSeries" ALTER COLUMN "recommendationType" TYPE TEXT;

-- DropEnum
DROP TYPE "CaseRecommendation";
