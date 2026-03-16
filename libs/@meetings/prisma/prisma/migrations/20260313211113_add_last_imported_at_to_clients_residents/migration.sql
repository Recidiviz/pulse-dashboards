/*
  Warnings:

  - Added the required column `lastImportedAt` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastImportedAt` to the `Resident` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "lastImportedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- AlterTable
ALTER TABLE "public"."Resident" ADD COLUMN     "lastImportedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
