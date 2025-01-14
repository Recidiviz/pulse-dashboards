-- CreateEnum
CREATE TYPE "ProtectiveFactor" AS ENUM ('NoPriorCriminalConvictions', 'NoHistoryOfViolentBehavior', 'NoSubstanceUseOrAbuseIssues', 'NoDiagnosisOfAMentalIllness', 'StableHousing', 'SteadyEmployment', 'FinancialStability', 'HighSchoolDiplomaOrHigherEducation', 'StrongSocialSupportNetwork', 'CloseFamilyTies', 'ActivelyParticipatingInTreatmentPrograms', 'EnrolledInEducationalOrVocationalTraining', 'ActiveInvolvementInCommunityActivities');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "otherProtectiveFactor" TEXT,
ADD COLUMN     "protectiveFactors" "ProtectiveFactor"[];
