-- CreateEnum
CREATE TYPE "public"."TimelineEventType" AS ENUM ('APPLICATION_CREATED', 'APPLICATION_SENT_TO_PROVIDERS', 'APPLICATION_RECEIVED', 'PROVIDER_CONDITIONALLY_APPROVED', 'PROVIDER_REQUESTED_INFO', 'CM_RESPONDED_TO_INFO_REQUEST', 'PROVIDER_DECLINED', 'PROVIDER_SELECTED_AS_HOME_PLAN', 'PROVIDER_NOT_SELECTED', 'HOME_PLAN_ADDRESS_SET', 'EXPECTED_RELEASE_DATE_UPDATED', 'STAGE_ADVANCED', 'SCREENING_HOUSING_PLAN_APPROVED', 'SCREENING_HOUSING_PLAN_REJECTED', 'RELEASE_TASK_UPDATED', 'CASE_CLOSED');

-- CreateEnum
CREATE TYPE "public"."TimelineActorRole" AS ENUM ('SYSTEM', 'STAFF', 'PROVIDER');

-- CreateEnum
CREATE TYPE "public"."TimelineViewerRole" AS ENUM ('CASE_MANAGER', 'PROVIDER');

-- CreateTable
CREATE TABLE "public"."HousingApplicationTimelineEvent" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "eventType" "public"."TimelineEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "actorRole" "public"."TimelineActorRole" NOT NULL,
    "actorPseudonymizedId" TEXT,
    "scopedProviderPseudonymizedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HousingApplicationTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HousingApplicationTimelineReadState" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "viewerRole" "public"."TimelineViewerRole" NOT NULL,
    "viewerPseudonymizedId" TEXT NOT NULL,
    "lastViewedTimelineAt" TIMESTAMP(3),
    "lastOpenedModalAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousingApplicationTimelineReadState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HousingApplicationTimelineEvent_applicationId_createdAt_idx" ON "public"."HousingApplicationTimelineEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "HousingApplicationTimelineEvent_applicationId_scopedProvide_idx" ON "public"."HousingApplicationTimelineEvent"("applicationId", "scopedProviderPseudonymizedId", "createdAt");

-- CreateIndex
CREATE INDEX "HousingApplicationTimelineReadState_applicationId_idx" ON "public"."HousingApplicationTimelineReadState"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "HousingApplicationTimelineReadState_applicationId_viewerRol_key" ON "public"."HousingApplicationTimelineReadState"("applicationId", "viewerRole", "viewerPseudonymizedId");

-- AddForeignKey
ALTER TABLE "public"."HousingApplicationTimelineEvent" ADD CONSTRAINT "HousingApplicationTimelineEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HousingApplicationTimelineReadState" ADD CONSTRAINT "HousingApplicationTimelineReadState_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
