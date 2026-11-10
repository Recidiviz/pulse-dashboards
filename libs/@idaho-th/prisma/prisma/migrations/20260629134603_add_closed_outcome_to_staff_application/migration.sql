-- CreateEnum
CREATE TYPE "public"."ClosedOutcome" AS ENUM ('CLIENT_RELEASED', 'APPLICATION_WITHDRAWN', 'RELEASE_DENIED', 'HOUSING_PLAN_REJECTED', 'OTHER');

-- AlterTable
ALTER TABLE "public"."StaffHousingApplication" ADD COLUMN     "closedOutcome" "public"."ClosedOutcome",
ADD COLUMN     "closedOutcomeNote" TEXT;
