/*
  Warnings:

  - You are about to drop the column `charge` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `hasSubstanceAbuseDisorderDiagnosis` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `pronouns` on the `Case` table. All the data in the column will be lost.
  - Added the required column `hasDevelopmentalDisability` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plea` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryCharge` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `substanceUseDisorderDiagnosis` to the `Case` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubstanceUseDiagnosis" AS ENUM ('None', 'Mild', 'Moderate', 'Severe');

-- CreateEnum
CREATE TYPE "AsamCareRecommendation" AS ENUM ('LongTermRemissionMonitoring', 'OutpatientTherapy', 'MedicallyManagedOutpatient', 'IntensiveOutpatient', 'HighIntensityOutpatient', 'MedicallyManagedIntensiveOutpatient', 'ClinicallyManagedLowIntensityResidential', 'ClinicallyManagedHighIntensityResidential', 'MedicallyManagedResidential', 'MedicallyManagedInpatient', 'None');

-- CreateEnum
CREATE TYPE "MentalHealthDiagnosis" AS ENUM ('BipolarDisorder', 'BorderlinePersonalityDisorder', 'DelusionalDisorder', 'MajorDepressiveDisorder', 'PsychoticDisorder', 'Schizophrenia', 'SchizoaffectiveDisorder', 'Other', 'None');

-- CreateEnum
CREATE TYPE "Plea" AS ENUM ('Guilty', 'NotGuilty', 'Alford');

-- CreateEnum
CREATE TYPE "NeedToBeAddressed" AS ENUM ('AngerManagement', 'CaseManagement', 'DomesticViolenceIssues', 'Education', 'FamilyServices', 'FoodInsecurity', 'GeneralReEntrySupport', 'HousingOpportunities', 'JobTrainingOrOpportunities', 'MentalHealth', 'SubstanceUse');

-- AlterTable
ALTER TABLE "Case" DROP COLUMN "charge",
DROP COLUMN "hasSubstanceAbuseDisorderDiagnosis",
DROP COLUMN "pronouns",
ADD COLUMN     "asamCareRecommendation" "AsamCareRecommendation",
ADD COLUMN     "hasDevelopmentalDisability" BOOLEAN NOT NULL,
ADD COLUMN     "mentalHealthDiagnoses" "MentalHealthDiagnosis"[],
ADD COLUMN     "needsToBeAddressed" "NeedToBeAddressed"[],
ADD COLUMN     "plea" "Plea" NOT NULL,
ADD COLUMN     "primaryCharge" "Charge" NOT NULL,
ADD COLUMN     "secondaryCharges" "Charge"[],
ADD COLUMN     "substanceUseDisorderDiagnosis" "SubstanceUseDiagnosis" NOT NULL;
