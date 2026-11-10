/*
  Warnings:

  - A unique constraint covering the columns `[intercomContactId]` on the table `HousingProvider` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."HousingProvider" ADD COLUMN     "intercomContactId" TEXT,
ADD COLUMN     "intercomSyncedAt" TIMESTAMP(3),
ADD COLUMN     "lastDigestSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."HousingStaff" (
    "id" TEXT NOT NULL,
    "pseudonymizedId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "intercomContactId" TEXT,
    "intercomSyncedAt" TIMESTAMP(3),
    "lastDigestSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousingStaff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HousingStaff_pseudonymizedId_key" ON "public"."HousingStaff"("pseudonymizedId");

-- CreateIndex
CREATE UNIQUE INDEX "HousingStaff_email_key" ON "public"."HousingStaff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HousingStaff_intercomContactId_key" ON "public"."HousingStaff"("intercomContactId");

-- CreateIndex
CREATE INDEX "HousingStaff_lastDigestSentAt_idx" ON "public"."HousingStaff"("lastDigestSentAt");

-- CreateIndex
CREATE INDEX "HousingApplicationTimelineEvent_applicationId_cmOnly_create_idx" ON "public"."HousingApplicationTimelineEvent"("applicationId", "cmOnly", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HousingProvider_intercomContactId_key" ON "public"."HousingProvider"("intercomContactId");

-- CreateIndex
CREATE INDEX "HousingProvider_lastDigestSentAt_idx" ON "public"."HousingProvider"("lastDigestSentAt");

-- CreateIndex
CREATE INDEX "StaffHousingApplication_staffPseudonymizedId_idx" ON "public"."StaffHousingApplication"("staffPseudonymizedId");
