/*
  Warnings:

  - You are about to drop the column `primaryCharge` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `secondaryCharges` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `offense` on the `Insight` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gender,offenseId,assessmentScoreBucketStart,assessmentScoreBucketEnd]` on the table `Insight` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `offenseId` to the `Insight` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Insight_gender_offense_assessmentScoreBucketStart_assessmen_key";

-- AlterTable
ALTER TABLE "Case" DROP COLUMN "primaryCharge",
DROP COLUMN "secondaryCharges",
ADD COLUMN     "offenseId" TEXT;

-- AlterTable
ALTER TABLE "Insight" DROP COLUMN "offense",
ADD COLUMN     "offenseId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Offense" (
    "id" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Offense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Offense_name_key" ON "Offense"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Insight_gender_offenseId_assessmentScoreBucketStart_assessm_key" ON "Insight"("gender", "offenseId", "assessmentScoreBucketStart", "assessmentScoreBucketEnd");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_offenseId_fkey" FOREIGN KEY ("offenseId") REFERENCES "Offense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_offenseId_fkey" FOREIGN KEY ("offenseId") REFERENCES "Offense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
