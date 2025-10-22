/*
  Warnings:

  - The values [STITCHING,TRANSCRIBING] on the enum `PostMeetingProcessingStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PostMeetingProcessingStatus_new" AS ENUM ('NOT_STARTED', 'STITCHING_QUEUED', 'STITCHING_IN_PROGRESS', 'STITCHING_ERROR', 'TRANSCRIBING_QUEUED', 'TRANSCRIBING_IN_PROGRESS', 'TRANSCRIBING_ERROR', 'COMPLETED');
ALTER TABLE "public"."Meeting" ALTER COLUMN "postMeetingProcessingStatus" DROP DEFAULT;
ALTER TABLE "public"."Meeting" ALTER COLUMN "postMeetingProcessingStatus" TYPE "public"."PostMeetingProcessingStatus_new" USING ("postMeetingProcessingStatus"::text::"public"."PostMeetingProcessingStatus_new");
ALTER TYPE "public"."PostMeetingProcessingStatus" RENAME TO "PostMeetingProcessingStatus_old";
ALTER TYPE "public"."PostMeetingProcessingStatus_new" RENAME TO "PostMeetingProcessingStatus";
DROP TYPE "public"."PostMeetingProcessingStatus_old";
ALTER TABLE "public"."Meeting" ALTER COLUMN "postMeetingProcessingStatus" SET DEFAULT 'NOT_STARTED';
COMMIT;
