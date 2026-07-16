-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ADD COLUMN     "involvesSexCrime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sexualHistorySummary" TEXT,
ADD COLUMN     "static9RRCompleted" BOOLEAN NOT NULL DEFAULT false;
