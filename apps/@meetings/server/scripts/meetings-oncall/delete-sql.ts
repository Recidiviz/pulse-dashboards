// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

/**
 * Builds the SQL for manually deleting meetings. Pure string building: nothing
 * here connects to a database. Shared by `nx delete-meeting-sql` and the oncall
 * dashboard's delete dialog.
 */

// Values are interpolated into SQL literals, so both patterns exclude quotes
// and backslashes.
const MEETING_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const EMAIL_PATTERN = /^[^\s'"\\]+@[^\s'"\\]+$/;

export function validateDeleteMeetingId(value: string): string {
  if (!MEETING_ID_PATTERN.test(value)) {
    throw new Error(`Invalid meeting id: ${value}`);
  }
  return value;
}

export function validateStaffEmail(value: string): string {
  if (!EMAIL_PATTERN.test(value)) {
    throw new Error(`Invalid staff email: ${value}`);
  }
  return value.toLowerCase();
}

export interface DeleteMeetingSql {
  /** Read-only queries to run first. */
  inspect: string;
  /** The delete transaction, ending in ROLLBACK or COMMIT. */
  transaction: string;
}

export function buildDeleteMeetingSql(options: {
  meetingIds: string[];
  staffEmail: string;
  commit: boolean;
}): DeleteMeetingSql {
  const meetingIds = [
    ...new Set(options.meetingIds.map(validateDeleteMeetingId)),
  ];
  if (meetingIds.length === 0) {
    throw new Error("At least one meeting id is required");
  }
  const staffEmail = validateStaffEmail(options.staffEmail);
  const idList = meetingIds.map((id) => `'${id}'`).join(", ");
  const ownedMeetings = `SELECT id FROM "Meeting"
  WHERE id IN (${idList}) AND lower("staffEmail") = '${staffEmail}'`;

  const inspect = `-- One row per meeting (${meetingIds.length}), each owned by ${staffEmail}.
-- The DELETE counts in the transaction should match these counts.
SELECT m.id, m."staffEmail", m."startTime", m."endTime", m."postMeetingProcessingStatus",
       m."durationMs", m."recordingsGCSBucket", m."recordingsFolderPath", m."finalRecordingGCSPath",
       m."clientId", m."residentId",
       (SELECT count(*) FROM "Transcription" t WHERE t."meetingId" = m.id) AS transcriptions,
       (SELECT count(*) FROM "Utterance" u JOIN "Transcription" t ON u."transcriptionId" = t.id
         WHERE t."meetingId" = m.id) AS utterances,
       (SELECT count(*) FROM "MeetingActionItem" a WHERE a."meetingId" = m.id) AS action_items
FROM "Meeting" m
WHERE m.id IN (${idList});

-- Every table with a foreign key to "Meeting". The transaction assumes only
-- "Transcription" and "MeetingActionItem"; any other table here will block it.
SELECT conrelid::regclass AS referencing_table, conname
FROM pg_constraint
WHERE contype = 'f' AND confrelid = '"Meeting"'::regclass;

-- Commands to delete the recordings from GCS. Run these only once the recordings
-- are no longer needed for debugging; they cannot be undone.
SELECT 'gcloud storage rm -r gs://' || "recordingsGCSBucket" || '/' || "recordingsFolderPath" || '/' AS gcs_cleanup
FROM "Meeting"
WHERE id IN (${idList});`;

  // Children first: none of the foreign keys to "Meeting" cascade.
  // NotetakingPipelineRun, OutputVote, and NoteApproval deliberately have no
  // foreign key and are kept as history, so they are not touched here.
  const transaction = `BEGIN;

DELETE FROM "Utterance"
WHERE "transcriptionId" IN (
  SELECT id FROM "Transcription" WHERE "meetingId" IN (
  ${ownedMeetings}
  )
);

DELETE FROM "Transcription"
WHERE "meetingId" IN (
  ${ownedMeetings}
);

DELETE FROM "MeetingActionItem"
WHERE "meetingId" IN (
  ${ownedMeetings}
);

DELETE FROM "Meeting"
WHERE id IN (${idList}) AND lower("staffEmail") = '${staffEmail}';
-- expect: DELETE ${meetingIds.length}

SELECT count(*) AS remaining FROM "Meeting" WHERE id IN (${idList});
-- expect: 0

${options.commit ? "COMMIT" : "ROLLBACK"};`;

  return { inspect, transaction };
}
