/*
  Warnings:

  - The primary key for the `Client` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `externalId` on the `Client` table. All the data in the column will be lost.
  - The primary key for the `ClientsToStaff` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Staff` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[stablePersonExternalId,stablePersonExternalIdType]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stableStaffExternalId,stableStaffExternalIdType]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayPersonExternalId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stablePersonExternalId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stablePersonExternalIdType` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `personId` on the `Client` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `staffId` on the `ClientsToStaff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `clientId` on the `ClientsToStaff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `clientId` on the `Intake` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `stableStaffExternalId` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stableStaffExternalIdType` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `staffId` on the `Staff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "ClientsToStaff" DROP CONSTRAINT "ClientsToStaff_clientId_fkey";

-- DropForeignKey
ALTER TABLE "ClientsToStaff" DROP CONSTRAINT "ClientsToStaff_staffId_fkey";

-- DropForeignKey
ALTER TABLE "Intake" DROP CONSTRAINT "Intake_clientId_fkey";

-- DropIndex
DROP INDEX "Client_externalId_key";

-- AlterTable
ALTER TABLE "Client" DROP CONSTRAINT "Client_pkey",
DROP COLUMN "externalId",
ADD COLUMN     "displayPersonExternalId" TEXT NOT NULL,
ADD COLUMN     "stablePersonExternalId" TEXT NOT NULL,
ADD COLUMN     "stablePersonExternalIdType" TEXT NOT NULL,
DROP COLUMN "personId",
ADD COLUMN     "personId" INTEGER NOT NULL,
ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("personId");

-- AlterTable
ALTER TABLE "ClientsToStaff" DROP CONSTRAINT "ClientsToStaff_pkey",
DROP COLUMN "staffId",
ADD COLUMN     "staffId" INTEGER NOT NULL,
DROP COLUMN "clientId",
ADD COLUMN     "clientId" INTEGER NOT NULL,
ADD CONSTRAINT "ClientsToStaff_pkey" PRIMARY KEY ("staffId", "clientId");

-- AlterTable
ALTER TABLE "Intake" DROP COLUMN "clientId",
ADD COLUMN     "clientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_pkey",
ADD COLUMN     "stableStaffExternalId" TEXT NOT NULL,
ADD COLUMN     "stableStaffExternalIdType" TEXT NOT NULL,
DROP COLUMN "staffId",
ADD COLUMN     "staffId" INTEGER NOT NULL,
ADD CONSTRAINT "Staff_pkey" PRIMARY KEY ("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_stablePersonExternalId_stablePersonExternalIdType_key" ON "Client"("stablePersonExternalId", "stablePersonExternalIdType");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_stableStaffExternalId_stableStaffExternalIdType_key" ON "Staff"("stableStaffExternalId", "stableStaffExternalIdType");

-- AddForeignKey
ALTER TABLE "ClientsToStaff" ADD CONSTRAINT "ClientsToStaff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("staffId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientsToStaff" ADD CONSTRAINT "ClientsToStaff_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("personId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intake" ADD CONSTRAINT "Intake_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("personId") ON DELETE RESTRICT ON UPDATE CASCADE;
