-- AlterTable
ALTER TABLE "public"."HousingApplication" ADD COLUMN     "expectedReleaseDateChangedAt" TIMESTAMP(3),
ADD COLUMN     "previousExpectedReleaseDate" TIMESTAMP(3);
