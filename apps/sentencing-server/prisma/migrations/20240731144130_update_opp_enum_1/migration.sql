/*
  Warnings:

  - You are about to drop the column `PriorCriminalHistoryCriterion` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the column `asamLevelOfCareRecommendationCriterion` on the `Opportunity` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosedSubstanceUseDisorderCriterion` on the `Opportunity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Opportunity"
DROP COLUMN "PriorCriminalHistoryCriterion",
ADD COLUMN "priorCriminalHistoryCriterion" "PriorCriminalHistoryCriterion",
DROP COLUMN "asamLevelOfCareRecommendationCriterion",
ADD COLUMN "asamLevelOfCareRecommendationCriterion" "AsamLevelOfCareRecommendationCriterion",
DROP COLUMN "diagnosedSubstanceUseDisorderCriterion",
ADD COLUMN "diagnosedSubstanceUseDisorderCriterion" "DiagnosedSubstanceUseDisorderCriterion";
