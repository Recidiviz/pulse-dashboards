/*
  Warnings:

  - You are about to drop the column `felonyClass` on the `Charge` table. All the data in the column will be lost.
  - You are about to drop the column `offenseId` on the `Charge` table. All the data in the column will be lost.
  - Added the required column `offense` to the `Charge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ChargeClassificationType" AS ENUM ('FELONY', 'MISDEMEANOR', 'INFRACTION');

-- CreateEnum
CREATE TYPE "public"."ChargeClassificationSubtype" AS ENUM ('A', 'B', 'C', 'D', 'E', 'U');

-- DropForeignKey
ALTER TABLE "public"."Charge" DROP CONSTRAINT "Charge_offenseId_fkey";

-- AlterTable
ALTER TABLE "public"."Charge" DROP COLUMN "felonyClass",
DROP COLUMN "offenseId",
ADD COLUMN     "chargeExternalId" TEXT,
ADD COLUMN     "classificationSubtype" "public"."ChargeClassificationSubtype",
ADD COLUMN     "classificationType" "public"."ChargeClassificationType",
ADD COLUMN     "offense" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."FelonyClass";
