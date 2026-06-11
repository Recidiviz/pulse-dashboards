-- Meetings created between the meetingType field being added (2026-05-12) and
-- the "Default" sentinel being removed from the frontend (2026-06-11) have
-- meetingType = 'Default', which was never a real type — it was a frontend
-- placeholder for agencies with no configured meeting types. Null these out so
-- they are treated consistently with pre-field meetings.
UPDATE "public"."Meeting"
SET "meetingType" = NULL
WHERE "meetingType" = 'Default';
