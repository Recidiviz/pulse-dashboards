/*
  Warnings:

  - A unique constraint covering the columns `[opportunityName,providerName]` on the table `Opportunity` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Opportunity_opportunityName_providerPhoneNumber_key";

-- AlterTable
ALTER TABLE "Opportunity" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "providerPhoneNumber" DROP NOT NULL,
ALTER COLUMN "providerWebsite" DROP NOT NULL,
ALTER COLUMN "providerAddress" DROP NOT NULL,
ALTER COLUMN "totalCapacity" DROP NOT NULL,
ALTER COLUMN "availableCapacity" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_opportunityName_providerName_key" ON "Opportunity"("opportunityName", "providerName");
