-- Rename enum FeedbackVoteValue -> OutputVoteValue (preserves existing values)
ALTER TYPE "public"."FeedbackVoteValue" RENAME TO "OutputVoteValue";

-- CreateEnum
CREATE TYPE "public"."OutputVoteTab" AS ENUM ('DRAFT_CASE_NOTES', 'ACTION_ITEMS', 'STAFF_FEEDBACK');

-- Rename table FeedbackVote -> OutputVote (preserves rows)
ALTER TABLE "public"."FeedbackVote" RENAME TO "OutputVote";

-- Rename primary key and index to match the new table name
ALTER TABLE "public"."OutputVote" RENAME CONSTRAINT "FeedbackVote_pkey" TO "OutputVote_pkey";
ALTER INDEX "public"."FeedbackVote_meetingId_voterEmail_pipelineRunId_idx" RENAME TO "OutputVote_meetingId_voterEmail_pipelineRunId_idx";

-- Add new columns. message is nullable; tab is NOT NULL and defaults to
-- STAFF_FEEDBACK, which backfills existing rows (the only tab that produced
-- votes before this PR).
ALTER TABLE "public"."OutputVote" ADD COLUMN "message" TEXT;
ALTER TABLE "public"."OutputVote" ADD COLUMN "tab" "public"."OutputVoteTab" NOT NULL DEFAULT 'STAFF_FEEDBACK';

-- Rename Meeting.staffFeedbackPipelineRunId -> outputsPipelineRunId (preserves
-- existing values). The column tracks the pipeline run behind ALL current
-- outputs (caseNote, staffFeedback, etc.), not just staff feedback, and now
-- pairs with OutputVote.pipelineRunId.
ALTER TABLE "public"."Meeting" RENAME COLUMN "staffFeedbackPipelineRunId" TO "outputsPipelineRunId";
