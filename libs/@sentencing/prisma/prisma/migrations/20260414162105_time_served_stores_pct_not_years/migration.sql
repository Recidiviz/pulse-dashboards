-- AlterTable
ALTER TABLE "public"."Insight" ADD COLUMN     "avgPctServed" DOUBLE PRECISION,
ADD COLUMN     "avgSentenceLengthYears" DOUBLE PRECISION,
ADD COLUMN     "timeServedNumRecords" INTEGER;
