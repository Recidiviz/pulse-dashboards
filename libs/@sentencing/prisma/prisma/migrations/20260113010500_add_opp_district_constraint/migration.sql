/*
  Warnings:

  - A unique constraint covering the columns `[opportunityName,providerName,district]` on the table `Opportunity` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Opportunity_opportunityName_providerName_key";

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_opportunityName_providerName_district_key" ON "public"."Opportunity"("opportunityName", "providerName", "district");
