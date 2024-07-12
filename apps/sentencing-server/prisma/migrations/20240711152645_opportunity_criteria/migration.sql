/*
  Warnings:

  - Added the required column `developmentalDisabilityDiagnosisCriterion` to the `Opportunity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eighteenOrOlderCriterion` to the `Opportunity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entryOfGuiltyPleaCriterion` to the `Opportunity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minorCriterion` to the `Opportunity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `noCurrentOrPriorSexOffenseCriterion` to the `Opportunity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `noCurrentOrPriorViolentOffenseCriterion` to the `Opportunity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `noPendingFelonyChargesInAnotherCountyOrStateCriterion` to the `Opportunity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `veteranStatusCriterion` to the `Opportunity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PriorCriminalHistoryCriterion" AS ENUM ('None', 'Significant');

-- CreateEnum
CREATE TYPE "DiagnosedMentalHealthDiagnosisCriterion" AS ENUM ('BipolarDisorder', 'BorderlinePersonalityDisorder', 'DelusionalDisorder', 'MajorDepressiveDisorder', 'PsychoticDisorder', 'Schizophrenia', 'SchizoaffectiveDisorder', 'Other', 'Any');

-- CreateEnum
CREATE TYPE "AsamLevelOfCareRecommendationCriterion" AS ENUM ('LongTermRemissionMonitoring', 'OutpatientTherapy', 'MedicallyManagedOutpatient', 'IntensiveOutpatient', 'HighIntensityOutpatient', 'MedicallyManagedIntensiveOutpatient', 'ClinicallyManagedLowIntensityResidential', 'ClinicallyManagedHighIntensityResidential', 'MedicallyManagedResidential', 'MedicallyManagedInpatient', 'Any');

-- CreateEnum
CREATE TYPE "DiagnosedSubstanceUseDisorderCriterion" AS ENUM ('Mild', 'Moderate', 'Severe', 'Any');

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "PriorCriminalHistoryCriterion" "PriorCriminalHistoryCriterion"[],
ADD COLUMN     "asamLevelOfCareRecommendationCriterion" "AsamLevelOfCareRecommendationCriterion"[],
ADD COLUMN     "developmentalDisabilityDiagnosisCriterion" BOOLEAN NOT NULL,
ADD COLUMN     "diagnosedMentalHealthDiagnosisCriterion" "DiagnosedMentalHealthDiagnosisCriterion"[],
ADD COLUMN     "diagnosedSubstanceUseDisorderCriterion" "DiagnosedSubstanceUseDisorderCriterion"[],
ADD COLUMN     "eighteenOrOlderCriterion" BOOLEAN NOT NULL,
ADD COLUMN     "entryOfGuiltyPleaCriterion" BOOLEAN NOT NULL,
ADD COLUMN     "maxLsirScoreCriterion" INTEGER,
ADD COLUMN     "minLsirScoreCriterion" INTEGER,
ADD COLUMN     "minorCriterion" BOOLEAN NOT NULL,
ADD COLUMN     "noCurrentOrPriorSexOffenseCriterion" BOOLEAN NOT NULL,
ADD COLUMN     "noCurrentOrPriorViolentOffenseCriterion" BOOLEAN NOT NULL,
ADD COLUMN     "noPendingFelonyChargesInAnotherCountyOrStateCriterion" BOOLEAN NOT NULL,
ADD COLUMN     "veteranStatusCriterion" BOOLEAN NOT NULL;
