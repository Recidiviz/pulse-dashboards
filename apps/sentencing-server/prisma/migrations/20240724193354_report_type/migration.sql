-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('FullPSI', 'FileReview', 'FileReviewWithUpdatedLSIRScore');

-- AlterTable
ALTER TABLE "Case" DROP COLUMN "reportType",

/* Temp default, will get wiped during import */
ADD COLUMN     "reportType" "ReportType" NOT NULL default 'FullPSI';

ALTER TABLE "Case" ALTER COLUMN "reportType" drop default;

-- DropEnum
DROP TYPE "Charge";

-- DropEnum
DROP TYPE "Pronouns";
