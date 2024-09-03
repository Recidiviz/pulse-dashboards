/*
  Warnings:

  - Added the required column `lastUpdatedAt` to the `Opportunity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "additionalNotes" TEXT,
ADD COLUMN     "genders" "Gender"[],
ADD COLUMN     "genericDescription" TEXT,
ADD COLUMN     "lastUpdatedAt" TIMESTAMP(3) NOT NULL;
