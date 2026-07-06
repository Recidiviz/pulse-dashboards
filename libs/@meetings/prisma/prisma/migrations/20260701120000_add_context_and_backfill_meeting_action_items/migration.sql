-- Add context column to MeetingActionItem
ALTER TABLE "MeetingActionItem" ADD COLUMN IF NOT EXISTS "context" TEXT;

-- Backfill MeetingActionItem rows from structuredActionItems JSON for meetings
-- that have JSON data but no existing MeetingActionItem rows (i.e. meetings
-- processed before the MeetingActionItem table was added on 2026-06-09).
INSERT INTO "MeetingActionItem"
  (id, "meetingId", assignee, completed, "generatedTask", "evidenceQuotes", context, deleted, "pipelineRunId")
SELECT
  gen_random_uuid()::text,
  m.id,
  COALESCE(item->>'assignee', ''),
  false,
  item->>'task',
  COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(item->'evidenceQuotes')),
    '{}'::text[]
  ),
  item->>'context',
  false,
  COALESCE(m."outputsPipelineRunId", 'backfill-migration')
FROM "Meeting" m,
  jsonb_array_elements(m."structuredActionItems") AS item
WHERE m."structuredActionItems" IS NOT NULL
  AND m."structuredActionItems" != 'null'::jsonb
  AND jsonb_array_length(m."structuredActionItems") > 0
  AND NOT EXISTS (
    SELECT 1 FROM "MeetingActionItem" mai WHERE mai."meetingId" = m.id
  );
