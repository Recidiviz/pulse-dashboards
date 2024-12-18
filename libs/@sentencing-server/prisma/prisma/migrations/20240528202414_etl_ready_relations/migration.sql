/*
  Warnings:

  - The primary key for the `Case` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Client` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Client` table. All the data in the column will be lost.
  - The primary key for the `Staff` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Staff` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `Case` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pseudonymizedId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pseudonymizedId]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.
  - The required column `pseudonymizedId` was added to the `Client` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `pseudonymizedId` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Case" DROP CONSTRAINT "Case_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Case" DROP CONSTRAINT "Case_staffId_fkey";

-- DropIndex
DROP INDEX "Case_externalId_key";

-- DropIndex
DROP INDEX "Client_externalId_key";

-- DropIndex
DROP INDEX "Staff_externalId_key";

-- AlterTable
ALTER TABLE "Case" DROP CONSTRAINT "Case_pkey",
ALTER COLUMN "staffId" DROP NOT NULL,
ALTER COLUMN "clientId" DROP NOT NULL,
ALTER COLUMN "veteranStatus" DROP NOT NULL,
ALTER COLUMN "previouslyIncarcerated" DROP NOT NULL,
ALTER COLUMN "previouslyUnderSupervision" DROP NOT NULL,
ALTER COLUMN "hasPreviousFelonyConviction" DROP NOT NULL,
ALTER COLUMN "hasPreviousViolentOffenseConviction" DROP NOT NULL,
ALTER COLUMN "hasPreviousSexOffenseConviction" DROP NOT NULL,
ALTER COLUMN "hasOpenChildProtectiveServicesCase" DROP NOT NULL,
ALTER COLUMN "hasDevelopmentalDisability" DROP NOT NULL,
ALTER COLUMN "plea" DROP NOT NULL,
ALTER COLUMN "primaryCharge" DROP NOT NULL,
ALTER COLUMN "substanceUseDisorderDiagnosis" DROP NOT NULL,
ADD CONSTRAINT "Case_pkey" PRIMARY KEY ("externalId");

-- AlterTable
ALTER TABLE "Client" DROP CONSTRAINT "Client_pkey",
DROP COLUMN "id",
ADD COLUMN     "pseudonymizedId" TEXT NOT NULL,
ADD CONSTRAINT "Client_pkey" PRIMARY KEY ("externalId");

-- AlterTable
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_pkey",
DROP COLUMN "id",
ADD COLUMN     "pseudonymizedId" TEXT NOT NULL,
ADD CONSTRAINT "Staff_pkey" PRIMARY KEY ("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Case_id_key" ON "Case"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Client_pseudonymizedId_key" ON "Client"("pseudonymizedId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_pseudonymizedId_key" ON "Staff"("pseudonymizedId");

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("externalId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("externalId") ON DELETE SET NULL ON UPDATE CASCADE;
