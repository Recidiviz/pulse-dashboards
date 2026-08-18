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

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Storage } from "@google-cloud/storage";

import type { Prisma, StateCode } from "~@meetings/prisma/client";
import { formatTranscripts } from "~@meetings/tasks/llm/utils";

/**
 * Prisma include shape for fetching a meeting with the relations needed
 * to build a Label Studio task.
 */
export const labelStudioMeetingInclude = {
  client: true,
  resident: true,
  transcriptions: {
    include: {
      utterances: {
        orderBy: { startTimeMs: "asc" as const },
      },
    },
    orderBy: { confidence: "desc" as const },
  },
  meetingActionItems: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.MeetingInclude;

export type LabelStudioMeeting = Prisma.MeetingGetPayload<{
  include: typeof labelStudioMeetingInclude;
}>;

/** Format a duration in seconds as "Xm Ys". */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

type StructuredActionItem = {
  task: string;
  assignee: string;
  deadline?: string | null;
};

/** Format a structured action item as "[Assignee] Task (due: deadline)". */
function formatStructuredActionItem(item: StructuredActionItem): string {
  const base = `[${item.assignee}] ${item.task}`;
  return item.deadline ? `${base} (due: ${item.deadline})` : base;
}

/**
 * Format one action item row as "[Assignee] Task".
 *
 * The assignee prefix is dropped when there isn't one: rows the backfill
 * migration created from structuredActionItems default to an empty assignee
 * (`COALESCE(item->>'assignee', '')`) when the JSON had no assignee to carry
 * over, and "[] Task" reads as a bug to a rater.
 */
function formatActionItemRow(item: {
  assignee: string;
  generatedTask: string;
}): string {
  return item.assignee.trim()
    ? `[${item.assignee}] ${item.generatedTask}`
    : item.generatedTask;
}

/**
 * The subset of a meeting `formatLabelStudioActionItems` reads, as a Prisma
 * select — for callers that need only the action items and shouldn't pay for a
 * meeting's transcripts and utterances (see `patch-label-studio-tasks.ts`).
 * A meeting fetched with `labelStudioMeetingInclude` also satisfies it.
 */
export const labelStudioActionItemsSelect = {
  structuredActionItems: true,
  notetakingPipelineRunId: true,
  meetingActionItems: {
    orderBy: { createdAt: "asc" as const },
    select: { assignee: true, generatedTask: true, pipelineRunId: true },
  },
} satisfies Prisma.MeetingSelect;

export type LabelStudioActionItemsSource = Prisma.MeetingGetPayload<{
  select: typeof labelStudioActionItemsSelect;
}>;

/**
 * A meeting's generated action items for the `action_items` task field — one
 * "[Assignee] Task" per line — or null if it has none.
 *
 * One newline-separated string rather than a list because the labeling config
 * renders this field with `<Text name="action_items_display"
 * value="$action_items"/>`, and Text concatenates a list into a single run-on
 * blob. A string with newlines renders one item per line, the same way the
 * transcript and case note fields do.
 *
 * Action items live in MeetingActionItem rows as of migration
 * 20260609120000_add_meeting_action_item, and the notetaking pipeline writes
 * only rows — it leaves Meeting.structuredActionItems null — so the rows are
 * the source of truth whenever a meeting has any.
 *
 * Raters grade what the pipeline generated, so this deliberately shows the
 * generated task text rather than `editedTask`, and keeps items staff later
 * deleted or completed: all three were part of the output being graded.
 */
export function formatLabelStudioActionItems(
  meeting: LabelStudioActionItemsSource,
): string | null {
  const { meetingActionItems, notetakingPipelineRunId } = meeting;

  if (meetingActionItems.length > 0) {
    const generatedRows =
      notetakingPipelineRunId === null
        ? // A meeting processed before notetakingPipelineRunId was added
          // (migration 20260622120000) has no run to scope to, so every row
          // counts — which for those meetings is exactly the rows the backfill
          // migration created from structuredActionItems.
          meetingActionItems
        : // Otherwise keep only the run that produced the meeting's current
          // notes. That drops rows left behind by a superseded run, and rows
          // staff added themselves in the app: those carry a null
          // pipelineRunId, and aren't pipeline output to be graded.
          meetingActionItems.filter(
            (item) => item.pipelineRunId === notetakingPipelineRunId,
          );
    return generatedRows.length > 0
      ? generatedRows.map(formatActionItemRow).join("\n")
      : null;
  }

  // Nothing in the rows table at all: fall back to the JSON column, which the
  // pipeline wrote before the cutover. Migration 20260701120000 backfilled rows
  // from this column for every meeting that had it, so this is only reachable
  // for a meeting that migration didn't cover — but reading it is free, and the
  // alternative is silently dropping the action items of an old meeting.
  const structuredActionItems = meeting.structuredActionItems as
    | StructuredActionItem[]
    | null;
  // An empty JSON array means the same thing as no action items at all, so
  // normalize it to null rather than handing Label Studio an empty list.
  return structuredActionItems?.length
    ? structuredActionItems.map(formatStructuredActionItem).join("\n")
    : null;
}

/**
 * Build a Label Studio task JSON object from a completed meeting.
 *
 * The meeting must include client/resident and transcriptions (with utterances,
 * ordered by confidence desc).
 */
export function buildLabelStudioTask(
  meeting: LabelStudioMeeting,
  stateCode: StateCode,
  needsRecidivizReview = false,
) {
  const person = meeting.client ?? meeting.resident;

  const { byProvider: transcriptsByProvider } = formatTranscripts(
    meeting.transcriptions,
  );

  // Best transcription is first (ordered by confidence desc)
  const bestTranscription = meeting.transcriptions[0];

  const durationSeconds =
    meeting.durationMs !== null ? Math.floor(meeting.durationMs / 1000) : null;

  const recordingDate = meeting.startTime.toISOString().split("T")[0];
  return {
    meeting_id: meeting.id,
    state_code: stateCode,
    recording_date: recordingDate,

    // Allows us to use the label studio UI to randomly assign each task to an annotator by having a
    // range of numbers that correspond to each annotator. Doing it as a random number instead of
    // doing the assignments in the code makes it easy to make adjustments in LS later.
    random_split: Math.random(),

    audio: meeting.finalRecordingGCSPath
      ? `gs://${meeting.recordingsGCSBucket}/${meeting.finalRecordingGCSPath}`
      : null,

    // ── Transcripts (formatted as LLM input) ────────────────────────────
    transcript_assemblyai: transcriptsByProvider["assemblyai"] ?? null,
    transcript_deepgram: transcriptsByProvider["deepgram"] ?? null,
    transcript_best_provider:
      bestTranscription.provider === "ASSEMBLYAI" ? "assemblyai" : "deepgram",
    transcript_best_confidence: bestTranscription.confidence ?? null,

    // ── LLM outputs ─────────────────────────────────────────────────────
    case_note: meeting.caseNote ?? null,
    action_items: formatLabelStudioActionItems(meeting),

    needs_recidiviz_review: needsRecidivizReview,

    // ── Meta (human-readable labels for Label Studio <Table> widget) ────
    meta: {
      State: stateCode,
      "Recording date": recordingDate,
      Duration:
        durationSeconds !== null ? formatDuration(durationSeconds) : null,
      "Meeting ID": meeting.id,
      "Person Display ID": person?.displayPersonExternalId ?? null,
      "Processing status": meeting.postMeetingProcessingStatus,
    },
  };
}

/**
 * Basename of the per-meeting Label Studio task JSON file, written by
 * `exportLabelStudioTask` to `{recordingsFolderPath}/{LABEL_STUDIO_TASK_FILENAME}`.
 *
 * ⚠️ This filename (combined with `recordingsFolderPath`) is the GCS key Label
 * Studio's Sync Storage uses to recognize a task it has already imported —
 * Sync Storage is purely additive, so any object at a key it hasn't seen
 * before becomes a *new* task, and it never dedupes or removes tasks whose
 * object disappears. If a future migration moves/renames this file (e.g. as
 * part of reorganizing where audio recordings live), already-synced tasks'
 * keys change and the next Sync Storage will import duplicates of every
 * affected meeting — this happened in practice with the #14821 state-code
 * audio storage split, cleaned up via `dedupe-label-studio-tasks.ts`. Any
 * script that moves objects under a meeting's recordings folder should leave
 * this file where Label Studio already knows about it.
 */
export const LABEL_STUDIO_TASK_FILENAME = "label-studio-task.json";

/**
 * Build and upload a Label Studio task JSON file to GCS for a completed meeting.
 *
 * The file is written to `{recordingsFolderPath}/label-studio-task.json` in the
 * meeting's recordings bucket.
 */
export async function exportLabelStudioTask(
  meeting: LabelStudioMeeting,
  stateCode: StateCode,
  needsRecidivizReview = false,
): Promise<void> {
  const task = buildLabelStudioTask(meeting, stateCode, needsRecidivizReview);
  const taskJson = JSON.stringify(task, null, 2);
  const fileName = LABEL_STUDIO_TASK_FILENAME;

  if (process.env["IS_LOCAL_MODE"] === "true") {
    const localStorageDir =
      process.env["LOCAL_STORAGE_DIR"] ??
      path.join(os.tmpdir(), "meetings-local");
    const meetingDir = path.join(localStorageDir, meeting.recordingsFolderPath);
    if (!fs.existsSync(meetingDir)) {
      fs.mkdirSync(meetingDir, { recursive: true });
    }
    const filePath = path.join(meetingDir, fileName);
    fs.writeFileSync(filePath, taskJson);
    console.log(`Label Studio task exported: ${filePath}`);
    return;
  }

  const outputPath = `${meeting.recordingsFolderPath}/${fileName}`;
  const storage = new Storage();
  const file = storage.bucket(meeting.recordingsGCSBucket).file(outputPath);
  await file.save(taskJson, { contentType: "application/json" });

  console.log(
    `Label Studio task exported: gs://${meeting.recordingsGCSBucket}/${outputPath}`,
  );
}
