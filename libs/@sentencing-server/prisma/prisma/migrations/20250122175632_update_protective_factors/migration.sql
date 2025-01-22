/*
  Warnings:

  - The values [NoSubstanceUseOrAbuseIssues] on the enum `ProtectiveFactor` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProtectiveFactor_new" AS ENUM ('NoPriorCriminalConvictions', 'NoHistoryOfViolentBehavior', 'NoSubstanceAbuseIssues', 'NoDiagnosisOfAMentalIllness', 'HistoryOfSuccessUnderSupervision', 'LengthyPeriodsOfSobrietyAfterCompletingTreatment', 'StableHousing', 'SteadyEmployment', 'FinancialStability', 'HighSchoolDiplomaOrHigherEducation', 'StrongSocialSupportNetwork', 'CloseFamilyTies', 'ActivelyParticipatingInTreatmentPrograms', 'EnrolledInEducationalOrVocationalTraining', 'ActiveInvolvementInCommunityActivities', 'Other');
ALTER TABLE "Case" ALTER COLUMN "protectiveFactors" TYPE "ProtectiveFactor_new"[] USING ("protectiveFactors"::text::"ProtectiveFactor_new"[]);
ALTER TYPE "ProtectiveFactor" RENAME TO "ProtectiveFactor_old";
ALTER TYPE "ProtectiveFactor_new" RENAME TO "ProtectiveFactor";
DROP TYPE "ProtectiveFactor_old";
COMMIT;
