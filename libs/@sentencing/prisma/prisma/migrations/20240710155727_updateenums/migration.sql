/*
  Warnings:

  - The values [Alford] on the enum `Plea` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `veteranStatus` on the `Case` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NeedToBeAddressed" ADD VALUE 'ClothingAndToiletries';
ALTER TYPE "NeedToBeAddressed" ADD VALUE 'FinancialAssistance';
ALTER TYPE "NeedToBeAddressed" ADD VALUE 'Healthcare';
ALTER TYPE "NeedToBeAddressed" ADD VALUE 'Transportation';

-- AlterEnum
BEGIN;
CREATE TYPE "Plea_new" AS ENUM ('Guilty', 'NotGuilty', 'AlfordPlea');
ALTER TABLE "Case" ALTER COLUMN "plea" TYPE "Plea_new" USING ("plea"::text::"Plea_new");
ALTER TYPE "Plea" RENAME TO "Plea_old";
ALTER TYPE "Plea_new" RENAME TO "Plea";
DROP TYPE "Plea_old";
COMMIT;

-- AlterTable
ALTER TABLE "Case" DROP COLUMN "veteranStatus",
ADD COLUMN     "hasPreviousTreatmentCourt" BOOLEAN,
ADD COLUMN     "isVeteran" BOOLEAN;

-- DropEnum
DROP TYPE "VeteranStatus";
