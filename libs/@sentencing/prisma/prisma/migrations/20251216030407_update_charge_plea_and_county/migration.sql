/*
  Warnings:

  - The `pleaAgreement` column on the `Charge` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Charge" ADD COLUMN     "county" TEXT,
DROP COLUMN "pleaAgreement",
ADD COLUMN     "pleaAgreement" TEXT;
