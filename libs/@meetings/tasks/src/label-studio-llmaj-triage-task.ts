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

import type {
  NotetakingEvaluationRun,
  StateCode,
} from "~@meetings/prisma/client";
import {
  formatStructuredActionItem,
  type LabelStudioMeeting,
  type StructuredActionItem,
} from "~@meetings/tasks/label-studio";
import {
  LLMAJ_TRIAGE_SECTIONS,
  LLMAJ_TRIAGE_TASK_FILENAME,
  type LlmajTriageTask,
  LlmajTriageTaskSchema,
  NO_FINDINGS,
  NOT_AVAILABLE,
} from "~@meetings/tasks/label-studio-llmaj-triage";
import type { EvaluationScores } from "~@meetings/tasks/llm/evaluators/schemas";
import {
  formatMeetingLocalDate,
  formatTranscripts,
} from "~@meetings/tasks/llm/utils";
import { writeMeetingTaskFile } from "~@meetings/tasks/meeting-task-file";

/**
 * The pipeline outputs the judge graded: the DRAFTING agent's case note and
 * the VERIFICATION agent's action items. Staff edits to the meeting never
 * change these.
 */
export type LlmajGradedOutputs = {
  caseNote: string;
  actionItems: StructuredActionItem[];
};

/** Returns findings as one "- finding" line each, or NO_FINDINGS for none. */
function formatFindingLines(findings: string[] | undefined): string {
  return findings && findings.length > 0
    ? findings.map((finding) => `- ${finding}`).join("\n")
    : NO_FINDINGS;
}

/** Returns a duration in milliseconds as "Xm Ys", or NOT_AVAILABLE. */
function formatDuration(durationMs: number | null): string {
  if (durationMs === null) return NOT_AVAILABLE;
  const seconds = Math.floor(durationMs / 1000);
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

/**
 * Returns the LLMAJ triage task for a meeting the judge graded, or null when
 * the judge graded no section BAD and the meeting needs no triage.
 * label-studio-llmaj-triage.ts shows the shape of the task.
 *
 * A judge dimension that failed has a null score; its grade and rationale
 * read NOT_AVAILABLE, its findings read NO_FINDINGS, and it is never flagged.
 *
 * Args:
 *   meeting: The meeting, fetched with labelStudioMeetingInclude.
 *   evaluationRun: The judge's run that produced the grades.
 *   stateCode: The state the meeting belongs to.
 *   gradedOutputs: The case note and action items the judge graded, which the
 *     task shows in place of the meeting's current, possibly staff-edited,
 *     notes.
 */
export function buildLlmajTriageTask(
  meeting: LabelStudioMeeting,
  evaluationRun: NotetakingEvaluationRun,
  stateCode: StateCode,
  gradedOutputs: LlmajGradedOutputs,
): LlmajTriageTask | null {
  const scores = evaluationRun.scores as unknown as EvaluationScores;
  const sectionScores = LLMAJ_TRIAGE_SECTIONS.map(({ prefix, scoresKey }) => ({
    prefix,
    score: scores[scoresKey],
  }));
  if (!sectionScores.some(({ score }) => score?.grade === "BAD")) return null;

  const judgeFields = Object.fromEntries(
    sectionScores.flatMap(({ prefix, score }) => [
      [`${prefix}_flagged`, score?.grade === "BAD"],
      [`judge_${prefix}_grade`, score?.grade ?? NOT_AVAILABLE],
      [`judge_${prefix}_rationale`, score?.rationale || NOT_AVAILABLE],
      [
        `judge_${prefix}_hallucinations`,
        formatFindingLines(score?.hallucinations),
      ],
      [`judge_${prefix}_omissions`, formatFindingLines(score?.omissions)],
    ]),
  );

  const recordingDate = formatMeetingLocalDate(
    meeting.startTime,
    stateCode,
    meeting.timeZone,
  );
  const person = meeting.client ?? meeting.resident;

  return LlmajTriageTaskSchema.parse({
    meeting_id: meeting.id,
    state_code: stateCode,
    recording_date: recordingDate,
    review_reason: "LLMAJ_BAD",
    pipeline_run_id: evaluationRun.pipelineRunId,
    evaluation_run_id: evaluationRun.id,
    evaluator_version: evaluationRun.evaluatorVersion,
    exported_at: new Date().toISOString(),
    random_split: Math.random(),
    ...judgeFields,
    case_note: gradedOutputs.caseNote || NOT_AVAILABLE,
    action_items:
      gradedOutputs.actionItems.length > 0
        ? gradedOutputs.actionItems.map(formatStructuredActionItem).join("\n")
        : NOT_AVAILABLE,
    staff_notes: meeting.userNotepadNotes || NOT_AVAILABLE,
    transcript:
      meeting.transcriptions.length > 0
        ? formatTranscripts(meeting.transcriptions).best || NOT_AVAILABLE
        : NOT_AVAILABLE,
    audio: meeting.finalRecordingGCSPath
      ? `gs://${meeting.recordingsGCSBucket}/${meeting.finalRecordingGCSPath}`
      : null,
    meta: {
      State: stateCode,
      "Recording date": recordingDate,
      Duration: formatDuration(meeting.durationMs),
      "Meeting ID": meeting.id,
      "Person Display ID": person?.displayPersonExternalId ?? NOT_AVAILABLE,
    },
  });
}

/**
 * Builds a meeting's LLMAJ triage task and writes it to
 * {recordingsFolderPath}/{LLMAJ_TRIAGE_TASK_FILENAME} in the meeting's
 * recordings bucket, next to label-studio-task.json. Returns whether it wrote
 * a task; it writes nothing when the judge graded no section BAD.
 *
 * Takes the same arguments as buildLlmajTriageTask, and in local mode writes
 * to local disk the way exportLabelStudioTask does.
 */
export async function exportLlmajTriageTask(
  meeting: LabelStudioMeeting,
  evaluationRun: NotetakingEvaluationRun,
  stateCode: StateCode,
  gradedOutputs: LlmajGradedOutputs,
): Promise<boolean> {
  const task = buildLlmajTriageTask(
    meeting,
    evaluationRun,
    stateCode,
    gradedOutputs,
  );
  if (task === null) return false;

  const location = await writeMeetingTaskFile(
    meeting,
    LLMAJ_TRIAGE_TASK_FILENAME,
    task,
  );
  console.log(`LLMAJ triage task exported: ${location}`);
  return true;
}
