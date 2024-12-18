-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('NotYetStarted', 'InProgress', 'Complete');

-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "status" "CaseStatus" NOT NULL DEFAULT 'NotYetStarted';
