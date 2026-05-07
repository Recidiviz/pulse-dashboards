-- AlterEnum
ALTER TYPE "public"."ResidentFlagId" ADD VALUE 'usAzFslImprovements';

-- AlterTable
ALTER TABLE "public"."UserProperties" ADD COLUMN     "hideAboutVideoFromHomePage" TIMESTAMP(3);
