-- CreateEnum
CREATE TYPE "InsightsGender" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "stateCode" "StateCode" NOT NULL,
    "gender" "InsightsGender" NOT NULL,
    "offense" TEXT NOT NULL,
    "assessmentScoreBucketStart" INTEGER NOT NULL,
    "assessmentScoreBucketEnd" INTEGER NOT NULL,
    "recidivismRollupOffense" TEXT NOT NULL,
    "recidivismNumRecords" INTEGER NOT NULL,
    "dispositionNumRecords" INTEGER NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecidivismSeries" (
    "id" TEXT NOT NULL,
    "recommendationType" "CaseRecommendation" NOT NULL,
    "insightId" TEXT NOT NULL,

    CONSTRAINT "RecidivismSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecidvismSeriesDataPoint" (
    "id" TEXT NOT NULL,
    "cohortMonths" INTEGER NOT NULL,
    "eventRate" DOUBLE PRECISION NOT NULL,
    "lowerCI" DOUBLE PRECISION NOT NULL,
    "upperCI" DOUBLE PRECISION NOT NULL,
    "recidivismSeriesId" TEXT NOT NULL,

    CONSTRAINT "RecidvismSeriesDataPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disposition" (
    "id" TEXT NOT NULL,
    "recommendationType" "CaseRecommendation" NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "insightId" TEXT NOT NULL,

    CONSTRAINT "Disposition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Insight_gender_offense_assessmentScoreBucketStart_assessmen_key" ON "Insight"("gender", "offense", "assessmentScoreBucketStart", "assessmentScoreBucketEnd");

-- CreateIndex
CREATE UNIQUE INDEX "RecidivismSeries_insightId_recommendationType_key" ON "RecidivismSeries"("insightId", "recommendationType");

-- CreateIndex
CREATE UNIQUE INDEX "RecidvismSeriesDataPoint_recidivismSeriesId_cohortMonths_key" ON "RecidvismSeriesDataPoint"("recidivismSeriesId", "cohortMonths");

-- CreateIndex
CREATE UNIQUE INDEX "Disposition_insightId_recommendationType_key" ON "Disposition"("insightId", "recommendationType");

-- AddForeignKey
ALTER TABLE "RecidivismSeries" ADD CONSTRAINT "RecidivismSeries_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecidvismSeriesDataPoint" ADD CONSTRAINT "RecidvismSeriesDataPoint_recidivismSeriesId_fkey" FOREIGN KEY ("recidivismSeriesId") REFERENCES "RecidivismSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disposition" ADD CONSTRAINT "Disposition_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
