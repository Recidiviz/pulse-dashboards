/*
  Warnings:

  - The values [TRANSCRIBING_QUEUED,TRANSCRIBING_IN_PROGRESS,TRANSCRIBING_ERROR] on the enum `PostMeetingProcessingStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."TranscriptionProvider" AS ENUM ('ASSEMBLYAI', 'DEEPGRAM');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."PostMeetingProcessingStatus_new" AS ENUM ('NOT_STARTED', 'STITCHING_QUEUED', 'STITCHING_IN_PROGRESS', 'STITCHING_ERROR', 'TRANSCRIPTION_QUEUED', 'TRANSCRIPTION_IN_PROGRESS', 'TRANSCRIPTION_ERROR', 'COMPLETED');
ALTER TABLE "public"."Meeting" ALTER COLUMN "postMeetingProcessingStatus" DROP DEFAULT;
ALTER TABLE "public"."Meeting" ALTER COLUMN "postMeetingProcessingStatus" TYPE "public"."PostMeetingProcessingStatus_new" USING ("postMeetingProcessingStatus"::text::"public"."PostMeetingProcessingStatus_new");
ALTER TYPE "public"."PostMeetingProcessingStatus" RENAME TO "PostMeetingProcessingStatus_old";
ALTER TYPE "public"."PostMeetingProcessingStatus_new" RENAME TO "PostMeetingProcessingStatus";
DROP TYPE "public"."PostMeetingProcessingStatus_old";
ALTER TABLE "public"."Meeting" ALTER COLUMN "postMeetingProcessingStatus" SET DEFAULT 'NOT_STARTED';
COMMIT;

-- CreateTable
CREATE TABLE "public"."Transcription" (
    "id" TEXT NOT NULL,
    "provider" "public"."TranscriptionProvider" NOT NULL,
    "transcriptObject" JSONB NOT NULL,
    "meetingId" TEXT,

    CONSTRAINT "Transcription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Transcription" ADD CONSTRAINT "Transcription_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "public"."Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
