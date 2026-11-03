-- CreateEnum
CREATE TYPE "RecordingSource" AS ENUM ('LIVE', 'UPLOADED');

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN "recordingSource" "RecordingSource";
