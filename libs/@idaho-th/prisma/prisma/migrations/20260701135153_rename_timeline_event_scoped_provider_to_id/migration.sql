/*
  Warnings:

  - You are about to drop the column `scopedProviderPseudonymizedId` on the `HousingApplicationTimelineEvent` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."HousingApplicationTimelineEvent_applicationId_scopedProvide_idx";

-- AlterTable
ALTER TABLE "public"."HousingApplicationTimelineEvent" DROP COLUMN "scopedProviderPseudonymizedId",
ADD COLUMN     "scopedProviderId" TEXT;

-- CreateIndex
CREATE INDEX "HousingApplicationTimelineEvent_applicationId_scopedProvide_idx" ON "public"."HousingApplicationTimelineEvent"("applicationId", "scopedProviderId", "createdAt");
