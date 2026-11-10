-- CreateTable
CREATE TABLE "public"."AiExtractionMetrics" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "overriddenFieldCount" INTEGER,
    "overriddenFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiExtractionMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiExtractionMetrics_applicationId_key" ON "public"."AiExtractionMetrics"("applicationId");

-- CreateIndex
CREATE INDEX "AiExtractionMetrics_scannedAt_idx" ON "public"."AiExtractionMetrics"("scannedAt");

-- AddForeignKey
ALTER TABLE "public"."AiExtractionMetrics" ADD CONSTRAINT "AiExtractionMetrics_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
