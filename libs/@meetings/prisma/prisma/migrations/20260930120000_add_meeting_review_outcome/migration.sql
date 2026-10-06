-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "public"."ReviewSection" AS ENUM ('CASE_NOTE', 'ACTION_ITEMS', 'OVERALL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ReviewOutcomeKind" AS ENUM ('CONFIRMED_BAD', 'NOT_BAD', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ReviewFollowUp" AS ENUM ('NO_ACTION', 'USER_CAUGHT_IT', 'EMAILED_PO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ReviewCorrectedGrade" AS ENUM ('GOOD', 'PARTIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ReviewSource" AS ENUM ('LLM_JUDGE', 'LABEL_STUDIO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."MeetingReviewOutcome" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meetingId" TEXT NOT NULL,
    "section" "public"."ReviewSection" NOT NULL,
    "pipelineRunId" TEXT,
    "outcome" "public"."ReviewOutcomeKind" NOT NULL,
    "followUp" "public"."ReviewFollowUp",
    "correctedGrade" "public"."ReviewCorrectedGrade",
    "overriddenSources" "public"."ReviewSource"[],
    "appliesTo" "public"."ReviewSection"[],
    "notes" TEXT,
    "reviewerEmail" TEXT NOT NULL,

    CONSTRAINT "MeetingReviewOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MeetingReviewOutcome_meetingId_section_createdAt_idx" ON "public"."MeetingReviewOutcome"("meetingId", "section", "createdAt");
