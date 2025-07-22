/*
  Warnings:

  - Added the required column `sections` to the `Intake` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Intake" ADD COLUMN     "sections" JSONB NOT NULL;
