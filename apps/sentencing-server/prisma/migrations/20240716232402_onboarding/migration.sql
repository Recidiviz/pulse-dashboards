-- CreateEnum
CREATE TYPE "OnboardingTopic" AS ENUM ('OffenseLsirScore', 'PrimaryNeeds', 'AdditionalNeeds', 'Done');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "currentOnboardingTopic" "OnboardingTopic" NOT NULL DEFAULT 'OffenseLsirScore';
