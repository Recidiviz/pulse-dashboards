-- CreateEnum
CREATE TYPE "public"."HomePlanType" AS ENUM ('MANUAL_ADDRESS', 'PROVIDER');

-- CreateEnum
CREATE TYPE "public"."ScreeningResult" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ReleaseTaskType" AS ENUM ('HOUSING_APPLICATION_SIGNED', 'FUNDING_SECURED', 'RELEASE_DATE_ASSIGNED', 'BED_CONFIRMED', 'TRANSPORTATION_SECURED');

-- CreateEnum
CREATE TYPE "public"."TaskCompletedByRole" AS ENUM ('STAFF', 'PROVIDER');

-- CreateTable
CREATE TABLE "public"."HousingApplicationHomePlan" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "public"."HomePlanType" NOT NULL,
    "address" TEXT,
    "selectedProviderId" TEXT,
    "selectedProviderApplicationId" TEXT,
    "createdByStaffPseudonymizedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "screeningResult" "public"."ScreeningResult",
    "screeningResultAt" TIMESTAMP(3),
    "screeningResultByStaffPseudonymizedId" TEXT,

    CONSTRAINT "HousingApplicationHomePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HousingApplicationReleaseTask" (
    "id" TEXT NOT NULL,
    "homePlanId" TEXT NOT NULL,
    "taskType" "public"."ReleaseTaskType" NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedByRole" "public"."TaskCompletedByRole",
    "completedByPseudonymizedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousingApplicationReleaseTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HousingApplicationHomePlan_applicationId_key" ON "public"."HousingApplicationHomePlan"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "HousingApplicationHomePlan_selectedProviderApplicationId_key" ON "public"."HousingApplicationHomePlan"("selectedProviderApplicationId");

-- CreateIndex
CREATE INDEX "HousingApplicationHomePlan_selectedProviderId_idx" ON "public"."HousingApplicationHomePlan"("selectedProviderId");

-- CreateIndex
CREATE INDEX "HousingApplicationHomePlan_screeningResult_idx" ON "public"."HousingApplicationHomePlan"("screeningResult");

-- CreateIndex
CREATE UNIQUE INDEX "HousingApplicationReleaseTask_homePlanId_taskType_key" ON "public"."HousingApplicationReleaseTask"("homePlanId", "taskType");

-- AddForeignKey
ALTER TABLE "public"."HousingApplicationHomePlan" ADD CONSTRAINT "HousingApplicationHomePlan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HousingApplicationHomePlan" ADD CONSTRAINT "HousingApplicationHomePlan_selectedProviderId_fkey" FOREIGN KEY ("selectedProviderId") REFERENCES "public"."HousingProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HousingApplicationHomePlan" ADD CONSTRAINT "HousingApplicationHomePlan_selectedProviderApplicationId_fkey" FOREIGN KEY ("selectedProviderApplicationId") REFERENCES "public"."ProviderHousingApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HousingApplicationReleaseTask" ADD CONSTRAINT "HousingApplicationReleaseTask_homePlanId_fkey" FOREIGN KEY ("homePlanId") REFERENCES "public"."HousingApplicationHomePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
