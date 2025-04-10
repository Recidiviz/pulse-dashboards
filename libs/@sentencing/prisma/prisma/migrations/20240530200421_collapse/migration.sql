/*
  Warnings:

  - You are about to drop the column `givenNames` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `middleNames` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `nameSuffix` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `surname` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `givenNames` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `middleNames` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `nameSuffix` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `surname` on the `Staff` table. All the data in the column will be lost.
  - Added the required column `fullName` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "givenNames",
DROP COLUMN "middleNames",
DROP COLUMN "nameSuffix",
DROP COLUMN "surname",
ADD COLUMN     "fullName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "givenNames",
DROP COLUMN "middleNames",
DROP COLUMN "nameSuffix",
DROP COLUMN "surname",
ADD COLUMN     "fullName" TEXT NOT NULL;
