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
    meeting.endTime && meeting.startTime
      ? Math.floor(
          (meeting.endTime.getTime() - meeting.startTime.getTime()) / 1000,
        )
      : null;

  return {
    meeting_id: meeting.id,

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
    action_items:
      (meeting.structuredActionItems as StructuredActionItem[] | null)?.map(
        formatStructuredActionItem,
      ) ?? null,
    critical_updates:
      (meeting.criticalUpdates as string[] | null)?.join("\n") ?? null,

    needs_recidiviz_review: needsRecidivizReview,

    // ── Meta (human-readable labels for Label Studio <Table> widget) ────
    meta: {
      State: stateCode,
      "Recording date": meeting.startTime.toISOString().split("T")[0],
      Duration:
        durationSeconds !== null ? formatDuration(durationSeconds) : null,
      "Meeting ID": meeting.id,
      "Person Display ID": person?.displayPersonExternalId ?? null,
      "Processing status": meeting.postMeetingProcessingStatus,
    },
  };
}

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
  const fileName = "label-studio-task.json";

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
