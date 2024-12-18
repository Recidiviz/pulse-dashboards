-- CreateEnum
CREATE TYPE "CaseRecommendation" AS ENUM ('Probation', 'Rider', 'Term', 'None');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "selectedRecommendation" "CaseRecommendation";
