/*
  Warnings:

  - A unique constraint covering the columns `[insightId,recommendationType,sentenceLengthBucketStart,sentenceLengthBucketEnd]` on the table `Disposition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[insightId,recommendationType,sentenceLengthBucketStart,sentenceLengthBucketEnd]` on the table `RecidivismSeries` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Disposition_insightId_recommendationType_key";

-- DropIndex
DROP INDEX "RecidivismSeries_insightId_recommendationType_key";

-- AlterTable
ALTER TABLE "Disposition" ADD COLUMN     "sentenceLengthBucketEnd" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "sentenceLengthBucketStart" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "recommendationType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "RecidivismSeries" ADD COLUMN     "sentenceLengthBucketEnd" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "sentenceLengthBucketStart" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "recommendationType" DROP NOT NULL;

-- CreateIndex
-- The Index is set with NULLS NOT DISTINCT so that recommendationType can be NULL and still have the unique constraint
CREATE UNIQUE INDEX "Disposition_insightId_recommendationType_sentenceLengthBuck_key" ON "Disposition"("insightId", "recommendationType", "sentenceLengthBucketStart", "sentenceLengthBucketEnd") NULLS NOT DISTINCT;

-- CreateIndex
-- The Index is set with NULLS NOT DISTINCT so that recommendationType can be NULL and still have the unique constraint
CREATE UNIQUE INDEX "RecidivismSeries_insightId_recommendationType_sentenceLengt_key" ON "RecidivismSeries"("insightId", "recommendationType", "sentenceLengthBucketStart", "sentenceLengthBucketEnd") NULLS NOT DISTINCT;
