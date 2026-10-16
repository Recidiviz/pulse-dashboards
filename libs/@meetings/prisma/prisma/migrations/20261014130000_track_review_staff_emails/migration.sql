-- "Emailed the PO" becomes "Email staff", a to-do tracked until someone marks it sent. Existing
-- outcomes start as not yet sent, so the team can confirm each email actually went out.
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'ReviewFollowUp' AND e.enumlabel = 'EMAILED_PO'
    ) THEN
        ALTER TYPE "public"."ReviewFollowUp" RENAME VALUE 'EMAILED_PO' TO 'EMAIL_STAFF';
    END IF;
END $$;

-- AlterTable
ALTER TABLE "public"."MeetingReviewOutcome" ADD COLUMN IF NOT EXISTS "staffEmailSentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "staffEmailSentBy" TEXT;
