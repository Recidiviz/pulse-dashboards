-- AlterTable
ALTER TABLE "Case" ADD COLUMN     "isCountyLocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "isCountyLocked" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "county" DROP NOT NULL;
