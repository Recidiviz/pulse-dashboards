/*
  Warnings:

  - You are about to drop the column `eighteenOrOlderCriterion` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the column `minorCriterion` on the `Opportunity` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Gender" ADD VALUE 'NON_BINARY';
ALTER TYPE "Gender" ADD VALUE 'TRANS';
ALTER TYPE "Gender" ADD VALUE 'TRANS_FEMALE';
ALTER TYPE "Gender" ADD VALUE 'TRANS_MALE';
ALTER TYPE "Gender" ADD VALUE 'INTERNAL_UNKNOWN';

-- AlterTable
ALTER TABLE "Opportunity" DROP COLUMN "eighteenOrOlderCriterion",
DROP COLUMN "minorCriterion",
ADD COLUMN     "district" TEXT,
ADD COLUMN     "maxAge" INTEGER,
ADD COLUMN     "minAge" INTEGER;
