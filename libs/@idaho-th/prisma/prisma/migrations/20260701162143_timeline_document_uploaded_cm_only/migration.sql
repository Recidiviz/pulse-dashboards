-- AlterEnum
ALTER TYPE "public"."TimelineEventType" ADD VALUE 'DOCUMENT_UPLOADED';

-- AlterTable
ALTER TABLE "public"."HousingApplicationTimelineEvent" ADD COLUMN     "cmOnly" BOOLEAN NOT NULL DEFAULT false;
