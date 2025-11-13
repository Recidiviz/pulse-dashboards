-- CreateEnum
CREATE TYPE "public"."Division" AS ENUM ('Criminal', 'Juvenile', 'Family');

-- CreateEnum
CREATE TYPE "public"."FelonyClass" AS ENUM ('ClassA', 'ClassB', 'ClassC', 'ClassD', 'ClassE', 'Unclassified');

-- CreateEnum
CREATE TYPE "public"."LevelOfEducation" AS ENUM ('NoFormalSchooling', 'ElementarySchool', 'MiddleSchool', 'SomeHighSchool', 'HighSchoolDiplomaOrGED', 'SomeCollege', 'AssociateDegree', 'BachelorsDegree', 'MastersDegree', 'DoctorateDegree');

-- CreateEnum
CREATE TYPE "public"."AssessmentType" AS ENUM ('ORAS_CST', 'ORAS_PST', 'ORAS_REENTRY', 'Other');

-- CreateEnum
CREATE TYPE "public"."SubstanceType" AS ENUM ('Alcohol', 'Marijuana', 'Cocaine', 'Methamphetamine', 'Heroin', 'Prescription_Opioids', 'Benzodiazepines', 'Hallucinogens', 'Inhalants', 'Other');

-- CreateEnum
CREATE TYPE "public"."FrequencyOfUse" AS ENUM ('Daily', 'Weekly', 'Monthly', 'Occasionally', 'Rarely');

-- CreateEnum
CREATE TYPE "public"."MethodOfUse" AS ENUM ('Oral', 'Smoking', 'Injection', 'Snorting', 'Other');

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "ssn" TEXT;

-- AlterTable
ALTER TABLE "public"."Staff" ADD COLUMN     "officeAddress" TEXT,
ADD COLUMN     "officePhoneNumber" TEXT;

-- CreateTable
CREATE TABLE "public"."SentencingAssessmentReport" (
    "externalId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "public"."CaseStatus" NOT NULL DEFAULT 'NotYetStarted',
    "clientId" TEXT NOT NULL,
    "requestingJudgeName" TEXT,
    "dateRequested" TIMESTAMP(3),
    "dateDueToCourt" TIMESTAMP(3),
    "division" "public"."Division",
    "address" TEXT,
    "needsToBeAddressed" "public"."NeedToBeAddressed"[],
    "mitigatingFactors" "public"."NeedToBeAddressed"[],
    "levelOfEducation" "public"."LevelOfEducation",
    "assessmentScore" INTEGER,
    "assessmentType" "public"."AssessmentType",
    "assessmentDate" TIMESTAMP(3),
    "assessmentAdministeredBy" TEXT,
    "criminalHistoryLevel" INTEGER,
    "educationLevelScore" INTEGER,
    "neighborhoodLevel" INTEGER,
    "substanceAbuseLevel" INTEGER,
    "familySocialSupportLevel" INTEGER,
    "peerAssociatesLevel" INTEGER,
    "criminalBehaviorLevel" INTEGER,
    "defendantStatement" TEXT,
    "victimImpactStatement" TEXT,
    "criminalHistorySummary" TEXT,
    "employerAtOffense" TEXT,
    "currentEmployer" TEXT,
    "employmentSummary" TEXT,
    "familyAndSocialSupportSummary" TEXT,
    "homePlan" TEXT,
    "housingSummary" TEXT,
    "drugHistorySummary" TEXT,
    "peerAssociatesSummary" TEXT,
    "criminalAttitudesSummary" TEXT,
    "responsivityAndBarriersSummary" TEXT,
    "communityStrategyRecommendation" TEXT,
    "institutionalStrategyRecommendation" TEXT,
    "metadata" JSONB,

    CONSTRAINT "SentencingAssessmentReport_pkey" PRIMARY KEY ("externalId")
);

-- CreateTable
CREATE TABLE "public"."Charge" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentencingAssessmentReportId" TEXT NOT NULL,
    "offenseId" TEXT NOT NULL,
    "felonyClass" "public"."FelonyClass",
    "caseNum" TEXT,
    "moCode" TEXT,
    "judgeName" TEXT,
    "division" "public"."Division",
    "prosecutingAttorney" TEXT,
    "defenseAttorney" TEXT,
    "pleaAgreement" "public"."Plea",
    "pleaDate" TIMESTAMP(3),
    "sentencingDate" TIMESTAMP(3),

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DrugHistory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentencingAssessmentReportId" TEXT NOT NULL,
    "substance" "public"."SubstanceType",
    "ageOfRegularUse" INTEGER,
    "lastUse" TIMESTAMP(3),
    "heaviestUse" "public"."FrequencyOfUse",
    "method" "public"."MethodOfUse",

    CONSTRAINT "DrugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SentencingAssessmentReport_id_key" ON "public"."SentencingAssessmentReport"("id");

-- AddForeignKey
ALTER TABLE "public"."SentencingAssessmentReport" ADD CONSTRAINT "SentencingAssessmentReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("externalId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Charge" ADD CONSTRAINT "Charge_sentencingAssessmentReportId_fkey" FOREIGN KEY ("sentencingAssessmentReportId") REFERENCES "public"."SentencingAssessmentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Charge" ADD CONSTRAINT "Charge_offenseId_fkey" FOREIGN KEY ("offenseId") REFERENCES "public"."Offense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DrugHistory" ADD CONSTRAINT "DrugHistory_sentencingAssessmentReportId_fkey" FOREIGN KEY ("sentencingAssessmentReportId") REFERENCES "public"."SentencingAssessmentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
