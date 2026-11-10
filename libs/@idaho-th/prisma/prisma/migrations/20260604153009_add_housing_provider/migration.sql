-- CreateEnum
CREATE TYPE "public"."StateCode" AS ENUM ('US_ID');

-- CreateEnum
CREATE TYPE "public"."GcsUploadStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED', 'DELETED');

-- CreateTable
CREATE TABLE "public"."UserHousingApplication" (
    "id" TEXT NOT NULL,
    "staff" TEXT NOT NULL,
    "stateCode" "public"."StateCode" NOT NULL,
    "clientName" TEXT NOT NULL,
    "rawAiResponse" JSONB NOT NULL,
    "formData" JSONB NOT NULL,
    "expectedReleaseDate" TEXT NOT NULL DEFAULT '',
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responses" INTEGER NOT NULL,
    "alerts" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserHousingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HousingProvider" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT,
    "housingType" TEXT,
    "menAccepted" BOOLEAN NOT NULL DEFAULT false,
    "womenAccepted" BOOLEAN NOT NULL DEFAULT false,
    "ridersAccepted" BOOLEAN NOT NULL DEFAULT false,
    "sexOffendersAccepted" BOOLEAN NOT NULL DEFAULT false,
    "violenceHistoryAccepted" BOOLEAN NOT NULL DEFAULT false,
    "faithBasedProvider" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "businessMailingName" TEXT,
    "businessMailingAddress" TEXT,
    "businessMailingCity" TEXT,
    "businessMailingState" TEXT,
    "businessMailingZip" TEXT,
    "addressUsedForPPInvestigation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HousingProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GcsPdfFile" (
    "id" UUID NOT NULL,
    "stateCode" "public"."StateCode" NOT NULL,
    "staffPseudonymizedId" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalFileName" TEXT,
    "contentType" TEXT NOT NULL,
    "uploadStatus" "public"."GcsUploadStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GcsPdfFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GcsPdfFile_stateCode_staffPseudonymizedId_createdAt_idx" ON "public"."GcsPdfFile"("stateCode", "staffPseudonymizedId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GcsPdfFile_bucketName_objectKey_key" ON "public"."GcsPdfFile"("bucketName", "objectKey");
