-- CreateEnum
CREATE TYPE "public"."HousingApplicationDocumentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."HousingApplicationDocument" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "scopedProviderPseudonymizedId" TEXT,
ADD COLUMN     "status" "public"."HousingApplicationDocumentStatus" NOT NULL DEFAULT 'PENDING';

-- Backfill: rows that existed before the upload-confirmation flow are all
-- finalized documents, so promote them to CONFIRMED. New uploads still default
-- to PENDING (createPendingDocument relies on this default) until verified.
UPDATE "public"."HousingApplicationDocument" SET "status" = 'CONFIRMED';

-- CreateIndex
CREATE INDEX "HousingApplicationDocument_applicationId_status_idx" ON "public"."HousingApplicationDocument"("applicationId", "status");

-- CreateIndex
CREATE INDEX "HousingApplicationDocument_scopedProviderPseudonymizedId_idx" ON "public"."HousingApplicationDocument"("scopedProviderPseudonymizedId");
