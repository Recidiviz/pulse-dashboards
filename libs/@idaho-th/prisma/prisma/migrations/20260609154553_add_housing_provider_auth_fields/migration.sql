/*
  Warnings:

  - A unique constraint covering the columns `[auth0Sub]` on the table `HousingProvider` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pseudonymizedId]` on the table `HousingProvider` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."HousingProvider" ADD COLUMN     "auth0Sub" TEXT,
ADD COLUMN     "linkedAt" TIMESTAMP(3),
ADD COLUMN     "pseudonymizedId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "HousingProvider_auth0Sub_key" ON "public"."HousingProvider"("auth0Sub");

-- CreateIndex
CREATE UNIQUE INDEX "HousingProvider_pseudonymizedId_key" ON "public"."HousingProvider"("pseudonymizedId");
