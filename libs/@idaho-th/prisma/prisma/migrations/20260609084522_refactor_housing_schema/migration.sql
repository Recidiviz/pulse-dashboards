/*
  Warnings:

  - The primary key for the `HousingProvider` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `addressUsedForPPInvestigation` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `faithBasedProvider` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `housingType` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `menAccepted` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `ridersAccepted` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `sexOffendersAccepted` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `violenceHistoryAccepted` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `womenAccepted` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the column `zip` on the `HousingProvider` table. All the data in the column will be lost.
  - You are about to drop the `UserHousingApplication` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ApplicationStage" AS ENUM ('APPLICATION', 'SCREENING', 'RELEASE', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."ApplicationSubStage" AS ENUM ('PROVIDER_REVIEW', 'OFFERS_RECEIVED', 'INFO_NEEDED', 'DECLINED', 'RELEASED', 'PLAN_REJECTED', 'CANCELED', 'CONDITIONALLY_APPROVED', 'SELECTED', 'NOT_SELECTED');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('ACTION_NEEDED', 'WAITING', 'DONE');

-- CreateEnum
CREATE TYPE "public"."AcceptedGenders" AS ENUM ('MALE', 'FEMALE', 'ALL');

-- AlterTable
ALTER TABLE "public"."HousingProvider" DROP CONSTRAINT "HousingProvider_pkey",
DROP COLUMN "address",
DROP COLUMN "addressUsedForPPInvestigation",
DROP COLUMN "city",
DROP COLUMN "contactEmail",
DROP COLUMN "createdAt",
DROP COLUMN "district",
DROP COLUMN "faithBasedProvider",
DROP COLUMN "housingType",
DROP COLUMN "menAccepted",
DROP COLUMN "ridersAccepted",
DROP COLUMN "sexOffendersAccepted",
DROP COLUMN "updatedAt",
DROP COLUMN "violenceHistoryAccepted",
DROP COLUMN "womenAccepted",
DROP COLUMN "zip",
ADD COLUMN     "email" TEXT,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "HousingProvider_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "HousingProvider_id_seq";

-- DropTable
DROP TABLE "public"."UserHousingApplication";

-- CreateTable
CREATE TABLE "public"."HousingApplication" (
    "id" TEXT NOT NULL,
    "stateCode" "public"."StateCode" NOT NULL,
    "staffPseudonymizedId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "idocNumber" TEXT,
    "formData" JSONB NOT NULL,
    "rawAiResponse" JSONB,
    "expectedReleaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HousingProviderLocation" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "acceptedGenders" "public"."AcceptedGenders"[],
    "acceptsRiders" BOOLEAN NOT NULL,
    "acceptsSexOffenders" BOOLEAN NOT NULL,
    "acceptsViolentCriminals" BOOLEAN NOT NULL,
    "faithBased" BOOLEAN NOT NULL,
    "housingType" TEXT,
    "populationsServed" TEXT,
    "addressUsedForPPInvestigation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HousingProviderLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StaffHousingApplication" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "staffPseudonymizedId" TEXT NOT NULL,
    "stage" "public"."ApplicationStage" NOT NULL DEFAULT 'APPLICATION',
    "subStage" "public"."ApplicationSubStage" NOT NULL DEFAULT 'PROVIDER_REVIEW',
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'ACTION_NEEDED',

    CONSTRAINT "StaffHousingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EligibleHousingProvider" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerLocationId" TEXT NOT NULL,

    CONSTRAINT "EligibleHousingProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProviderHousingApplication" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerLocationId" TEXT NOT NULL,
    "stage" "public"."ApplicationStage" NOT NULL DEFAULT 'APPLICATION',
    "subStage" "public"."ApplicationSubStage" NOT NULL DEFAULT 'PROVIDER_REVIEW',
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'ACTION_NEEDED',

    CONSTRAINT "ProviderHousingApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HousingApplication_stateCode_staffPseudonymizedId_createdAt_idx" ON "public"."HousingApplication"("stateCode", "staffPseudonymizedId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffHousingApplication_applicationId_key" ON "public"."StaffHousingApplication"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "EligibleHousingProvider_applicationId_providerId_key" ON "public"."EligibleHousingProvider"("applicationId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderHousingApplication_applicationId_providerId_key" ON "public"."ProviderHousingApplication"("applicationId", "providerId");

-- AddForeignKey
ALTER TABLE "public"."HousingProviderLocation" ADD CONSTRAINT "HousingProviderLocation_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."HousingProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StaffHousingApplication" ADD CONSTRAINT "StaffHousingApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EligibleHousingProvider" ADD CONSTRAINT "EligibleHousingProvider_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EligibleHousingProvider" ADD CONSTRAINT "EligibleHousingProvider_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."HousingProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EligibleHousingProvider" ADD CONSTRAINT "EligibleHousingProvider_providerLocationId_fkey" FOREIGN KEY ("providerLocationId") REFERENCES "public"."HousingProviderLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderHousingApplication" ADD CONSTRAINT "ProviderHousingApplication_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."HousingApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderHousingApplication" ADD CONSTRAINT "ProviderHousingApplication_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."HousingProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProviderHousingApplication" ADD CONSTRAINT "ProviderHousingApplication_providerLocationId_fkey" FOREIGN KEY ("providerLocationId") REFERENCES "public"."HousingProviderLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
