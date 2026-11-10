-- CreateEnum
CREATE TYPE "public"."InfoRequestSenderType" AS ENUM ('STAFF', 'PROVIDER');

-- CreateEnum
CREATE TYPE "public"."InfoRequestStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."HousingApplicationInfoRequest" (
    "id" TEXT NOT NULL,
    "providerApplicationId" TEXT NOT NULL,
    "status" "public"."InfoRequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "HousingApplicationInfoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InfoRequestMessage" (
    "id" TEXT NOT NULL,
    "infoRequestId" TEXT NOT NULL,
    "senderType" "public"."InfoRequestSenderType" NOT NULL,
    "senderPseudonymizedId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "originalBody" TEXT,
    "editedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfoRequestMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HousingApplicationInfoRequest_providerApplicationId_idx" ON "public"."HousingApplicationInfoRequest"("providerApplicationId");

-- CreateIndex
CREATE INDEX "HousingApplicationInfoRequest_status_idx" ON "public"."HousingApplicationInfoRequest"("status");

-- CreateIndex
CREATE INDEX "InfoRequestMessage_infoRequestId_createdAt_idx" ON "public"."InfoRequestMessage"("infoRequestId", "createdAt");

-- CreateIndex
CREATE INDEX "InfoRequestMessage_readAt_idx" ON "public"."InfoRequestMessage"("readAt");

-- AddForeignKey
ALTER TABLE "public"."HousingApplicationInfoRequest" ADD CONSTRAINT "HousingApplicationInfoRequest_providerApplicationId_fkey" FOREIGN KEY ("providerApplicationId") REFERENCES "public"."ProviderHousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InfoRequestMessage" ADD CONSTRAINT "InfoRequestMessage_infoRequestId_fkey" FOREIGN KEY ("infoRequestId") REFERENCES "public"."HousingApplicationInfoRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
