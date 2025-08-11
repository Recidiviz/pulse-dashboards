/*
  Warnings:

  - You are about to drop the column `sections` on the `Intake` table. All the data in the column will be lost.
  - Added the required column `config` to the `Intake` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Intake" DROP COLUMN "sections",
ADD COLUMN     "config" JSONB NOT NULL;
