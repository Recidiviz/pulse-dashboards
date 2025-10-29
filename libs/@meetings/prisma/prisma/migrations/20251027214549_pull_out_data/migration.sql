/*
  Warnings:

  - A unique constraint covering the columns `[provider,meetingId]` on the table `Transcription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Transcription" ADD COLUMN     "confidence" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."Utterance" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "startTimeMs" INTEGER NOT NULL,
    "endTimeMs" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "transcriptionId" TEXT NOT NULL,

    CONSTRAINT "Utterance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transcription_provider_meetingId_key" ON "public"."Transcription"("provider", "meetingId");

-- AddForeignKey
ALTER TABLE "public"."Utterance" ADD CONSTRAINT "Utterance_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "public"."Transcription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
