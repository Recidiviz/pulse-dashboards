/*
  Warnings:
  - Changed the type of `gender` on the `Client` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `gender` on the `Insight` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
*/

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'EXTERNAL_UNKNOWN');

-- AlterTable
ALTER TABLE "Client"
  ALTER COLUMN "gender" TYPE "Gender" USING("gender"::"Gender");

-- AlterTable
ALTER TABLE "Insight"
  ALTER COLUMN "gender" TYPE "Gender" USING("gender"::VARCHAR::"Gender");

-- DropEnum
DROP TYPE "InsightsGender";
