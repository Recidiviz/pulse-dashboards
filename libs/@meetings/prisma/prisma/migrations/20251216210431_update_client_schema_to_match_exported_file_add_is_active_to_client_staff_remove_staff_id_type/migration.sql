/*
  Warnings:

  - You are about to drop the column `birthDate` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `lastKnownResidence` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `stableStaffExternalIdType` on the `Staff` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pseudonymizedId,stablePersonExternalIdType]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stableStaffExternalId]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX IF EXISTS "public"."Client_pseudonymizedId_key";

-- DropIndex
DROP INDEX "public"."Staff_stableStaffExternalId_stableStaffExternalIdType_key";

-- AlterTable
ALTER TABLE "public"."Client" DROP COLUMN "birthDate",
DROP COLUMN "lastKnownResidence",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Staff" DROP COLUMN "stableStaffExternalIdType",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Client_pseudonymizedId_stablePersonExternalIdType_key" ON "public"."Client"("pseudonymizedId", "stablePersonExternalIdType");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_stableStaffExternalId_key" ON "public"."Staff"("stableStaffExternalId");
