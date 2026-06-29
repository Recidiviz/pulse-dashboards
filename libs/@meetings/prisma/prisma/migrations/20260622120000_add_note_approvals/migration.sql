-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "public"."NoteSection" AS ENUM ('CASE_NOTE', 'ACTION_ITEMS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "public"."ApprovalValue" AS ENUM ('APPROVED', 'UNAPPROVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "public"."Meeting" ADD COLUMN IF NOT EXISTS "notetakingPipelineRunId" TEXT,
ADD COLUMN IF NOT EXISTS "caseNoteEditedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "actionItemsEditedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."NoteApproval" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approverEmail" TEXT NOT NULL,
    "section" "public"."NoteSection" NOT NULL,
    "value" "public"."ApprovalValue" NOT NULL,
    "pipelineRunId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,

    CONSTRAINT "NoteApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NoteApproval_meetingId_pipelineRunId_idx" ON "public"."NoteApproval"("meetingId", "pipelineRunId");
