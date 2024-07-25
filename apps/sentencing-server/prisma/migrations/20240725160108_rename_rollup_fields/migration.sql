/*
  Warnings:

  - You are about to drop the column `recidivismNumRecords` on the `Insight` table. All the data in the column will be lost.
  - You are about to drop the column `recidivismRollupOffense` on the `Insight` table. All the data in the column will be lost.
  - Added the required column `rollupRecidivismNumRecords` to the `Insight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rollupStateCode` to the `Insight` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Insight" RENAME COLUMN "recidivismNumRecords" TO "rollupRecidivismNumRecords";

ALTER TABLE "Insight"
DROP COLUMN "recidivismRollupOffense",
ADD COLUMN     "rollupAssessmentScoreBucketEnd" INTEGER,
ADD COLUMN     "rollupAssessmentScoreBucketStart" INTEGER,
ADD COLUMN     "rollupCombinedOffenseCategory" TEXT,
ADD COLUMN     "rollupGender" "Gender",
ADD COLUMN     "rollupNcicCategory" TEXT,
ADD COLUMN     "rollupOffenseId" TEXT,
ADD COLUMN     "rollupStateCode" "StateCode" NOT NULL,
ADD COLUMN     "rollupViolentOffense" BOOLEAN;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_rollupOffenseId_fkey" FOREIGN KEY ("rollupOffenseId") REFERENCES "Offense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
