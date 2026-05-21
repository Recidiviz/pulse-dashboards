-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "public"."FeedbackVoteValue" AS ENUM ('UP', 'DOWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "public"."Meeting" ADD COLUMN IF NOT EXISTS "staffFeedback" JSONB,
ADD COLUMN IF NOT EXISTS "staffFeedbackGeneratedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "staffFeedbackPipelineRunId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."FeedbackVote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voterEmail" TEXT NOT NULL,
    "vote" "public"."FeedbackVoteValue" NOT NULL,
    "pipelineRunId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,

    CONSTRAINT "FeedbackVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FeedbackVote_meetingId_voterEmail_pipelineRunId_idx" ON "public"."FeedbackVote"("meetingId", "voterEmail", "pipelineRunId");
