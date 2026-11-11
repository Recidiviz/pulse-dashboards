-- Editing an action item didn't set actionItemsEditedAt until now, so meetings
-- with edited items still have it null, which reads as untouched LLM output.
-- Only the items on the current notes count: older runs' items are hidden, and
-- regenerating the notes clears actionItemsEditedAt on purpose. The real edit
-- time was never stored, so this uses the newest edited item's createdAt, the
-- closest date on record.
UPDATE "public"."Meeting" m
SET "actionItemsEditedAt" = edited."createdAt"
FROM (
  SELECT item."meetingId", MAX(item."createdAt") AS "createdAt"
  FROM "public"."MeetingActionItem" item
  JOIN "public"."Meeting" meeting ON meeting.id = item."meetingId"
  WHERE item."editedTask" IS NOT NULL
    AND item.deleted = false
    AND (
      item."pipelineRunId" IS NULL
      OR item."pipelineRunId" = meeting."notetakingPipelineRunId"
    )
  GROUP BY item."meetingId"
) edited
WHERE m.id = edited."meetingId"
  AND m."actionItemsEditedAt" IS NULL;
