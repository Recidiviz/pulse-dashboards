/*
  Warnings:

  - Added the required column `recordingsFolderPath` to the `Meeting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recordingsGCSBucket` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PostMeetingProcessingStatus" AS ENUM ('NOT_STARTED', 'STITCHING', 'STITCHING_ERROR', 'TRANSCRIBING', 'TRANSCRIBING_ERROR', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."Meeting" ADD COLUMN     "finalRecordingUrl" TEXT,
ADD COLUMN     "postMeetingProcessingStatus" "public"."PostMeetingProcessingStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "recordingsFolderPath" TEXT NOT NULL,
ADD COLUMN     "recordingsGCSBucket" TEXT NOT NULL;
