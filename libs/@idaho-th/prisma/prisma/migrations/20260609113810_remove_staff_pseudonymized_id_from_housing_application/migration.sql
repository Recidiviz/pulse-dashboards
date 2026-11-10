/*
  Warnings:

  - You are about to drop the column `staffPseudonymizedId` on the `HousingApplication` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."HousingApplication_stateCode_staffPseudonymizedId_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."HousingApplication" DROP COLUMN "staffPseudonymizedId";

-- AlterTable
ALTER TABLE "public"."ProviderHousingApplication" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."StaffHousingApplication" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "HousingApplication_stateCode_createdAt_idx" ON "public"."HousingApplication"("stateCode", "createdAt");
