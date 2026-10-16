-- AlterTable
ALTER TABLE "public"."MeetingReviewOutcome" ADD COLUMN IF NOT EXISTS "notetakingPromptFollowUp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "judgePromptFollowUp" BOOLEAN NOT NULL DEFAULT false;
