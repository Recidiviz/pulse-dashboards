/*
  Warnings:

  - The `mitigatingFactors` column on the `SentencingAssessmentReport` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."MitigatingFactor" AS ENUM ('NoPriorCriminalConvictions', 'SteadyEmployment', 'NoHistoryOfViolentBehavior', 'NoSubstanceAbuseIssues', 'NoDiagnosisOfMentalIllness', 'HistoryOfSuccessUnderSupervision', 'FinancialStability', 'HighSchoolDiplomaOrHigher', 'StrongSocialSupportNetwork', 'CloseFamilyTies', 'CurrentlyParticipatingInTreatment', 'EnrolledInEducationalOrVocationalTraining', 'ActiveInvolvementInCommunityActivities', 'Other');

-- AlterTable
ALTER TABLE "public"."SentencingAssessmentReport" ADD COLUMN     "otherMitigatingFactor" TEXT,
ADD COLUMN     "otherNeedToBeAddressed" TEXT,
ADD COLUMN     "staffId" TEXT,
DROP COLUMN "mitigatingFactors",
ADD COLUMN     "mitigatingFactors" "public"."MitigatingFactor"[];

-- AddForeignKey
ALTER TABLE "public"."SentencingAssessmentReport" ADD CONSTRAINT "SentencingAssessmentReport_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "public"."Staff"("externalId") ON DELETE SET NULL ON UPDATE CASCADE;
