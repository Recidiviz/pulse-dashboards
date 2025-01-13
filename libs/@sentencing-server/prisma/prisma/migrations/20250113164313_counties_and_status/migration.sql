-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "counties" TEXT[];
