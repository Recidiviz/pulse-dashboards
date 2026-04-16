-- Backfill structuredActionItems from VERIFICATION agent execution outputData (has task + context)
UPDATE "public"."Meeting" m
SET "structuredActionItems" = subq.structured
FROM (
  SELECT DISTINCT ON (npr."meetingId")
    npr."meetingId",
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'task', item->>'task',
          'context', item->>'context'
        )
      )
      FROM jsonb_array_elements(nae."outputData"->'actionItems') AS item
    ) AS structured
  FROM "public"."NotetakingAgentExecution" nae
  JOIN "public"."NotetakingPipelineRun" npr ON nae."pipelineRunId" = npr.id
  WHERE nae."agentType" = 'VERIFICATION'
  ORDER BY npr."meetingId", npr."createdAt" DESC
) subq
WHERE m.id = subq."meetingId"
  AND m."actionItems" IS NOT NULL;

-- Fallback: meetings with actionItems but no VERIFICATION execution → context null
UPDATE "public"."Meeting"
SET "structuredActionItems" = (
  SELECT jsonb_agg(jsonb_build_object('task', item, 'context', NULL))
  FROM jsonb_array_elements_text("actionItems") AS item
)
WHERE "actionItems" IS NOT NULL
  AND "structuredActionItems" IS NULL;
