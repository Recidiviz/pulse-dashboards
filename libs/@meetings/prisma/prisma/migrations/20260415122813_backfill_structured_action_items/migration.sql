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
-- actionItems may be a native JSON array OR a JSON-encoded string containing an array
UPDATE "public"."Meeting"
SET "structuredActionItems" = (
  SELECT jsonb_agg(jsonb_build_object('task', item, 'context', NULL))
  FROM jsonb_array_elements_text(
    CASE jsonb_typeof("actionItems")
      WHEN 'array'  THEN "actionItems"
      WHEN 'string' THEN ("actionItems" #>> '{}')::jsonb
    END
  ) AS item
)
WHERE "actionItems" IS NOT NULL
  AND jsonb_typeof("actionItems") IN ('array', 'string')
  AND "structuredActionItems" IS NULL;
