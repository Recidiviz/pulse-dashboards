/*
  Warnings:

  - You are about to drop the column `judgeName` on the `Charge` table. All the data in the column will be lost.
  - The `division` column on the `Charge` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `raceOrEthnicity` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `division` column on the `SentencingAssessmentReport` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Charge" DROP COLUMN "judgeName",
ADD COLUMN     "judgeNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "division",
ADD COLUMN     "division" TEXT;

-- AlterTable
ALTER TABLE "public"."Client" DROP COLUMN "raceOrEthnicity",
ADD COLUMN     "raceOrEthnicity" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" DROP COLUMN "division",
ADD COLUMN     "division" TEXT;

-- AlterTable
ALTER TABLE "public"."Staff" ADD COLUMN     "districtId" TEXT;

-- DropEnum
DROP TYPE "public"."Division";

-- AddForeignKey
ALTER TABLE "public"."Staff" ADD CONSTRAINT "Staff_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "public"."District"("id") ON DELETE SET NULL ON UPDATE CASCADE;
