/*
  Warnings:

  - You are about to drop the column `caseNum` on the `Charge` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Charge" DROP COLUMN "caseNum",
ADD COLUMN     "causeNum" TEXT;
