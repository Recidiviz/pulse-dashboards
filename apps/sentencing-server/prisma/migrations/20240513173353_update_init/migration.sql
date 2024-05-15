/*
  Warnings:

  - You are about to drop the column `countyName` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `isOpenChildProtectiveServicesCase` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `previousTreatmentCourtParticipation` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `Staff` table. All the data in the column will be lost.
  - Added the required column `county` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hasOpenChildProtectiveServicesCase` to the `Case` table without a default value. This is not possible if the table is not empty.
  - Added the required column `givenNames` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surname` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `givenNames` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stateCode` to the `Staff` table without a default value. This is not possible if the table is not empty.
  - Added the required column `surname` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Case" DROP COLUMN "countyName",
DROP COLUMN "isOpenChildProtectiveServicesCase",
DROP COLUMN "previousTreatmentCourtParticipation",
ADD COLUMN     "county" TEXT NOT NULL,
ADD COLUMN     "hasOpenChildProtectiveServicesCase" BOOLEAN NOT NULL,
ADD COLUMN     "previousTreatmentCourt" TEXT;

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "fullName",
ADD COLUMN     "givenNames" TEXT NOT NULL,
ADD COLUMN     "middleNames" TEXT,
ADD COLUMN     "nameSuffix" TEXT,
ADD COLUMN     "surname" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "fullName",
ADD COLUMN     "givenNames" TEXT NOT NULL,
ADD COLUMN     "middleNames" TEXT,
ADD COLUMN     "nameSuffix" TEXT,
ADD COLUMN     "stateCode" "StateCode" NOT NULL,
ADD COLUMN     "surname" TEXT NOT NULL;
