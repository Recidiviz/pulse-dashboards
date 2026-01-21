-- CreateEnum
CREATE TYPE "public"."PreferredLanguage" AS ENUM ('en', 'es');

-- AlterTable
ALTER TABLE "public"."Person" ADD COLUMN     "preferredLanguage" "public"."PreferredLanguage" NOT NULL DEFAULT 'en';
