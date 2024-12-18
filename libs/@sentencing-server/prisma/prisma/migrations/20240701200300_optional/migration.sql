-- AlterEnum
ALTER TYPE "NeedToBeAddressed" ADD VALUE 'Other';

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "otherNeedToBeAddressed" TEXT;
