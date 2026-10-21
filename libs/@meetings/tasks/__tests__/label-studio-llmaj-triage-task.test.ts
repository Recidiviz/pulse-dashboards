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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { NotetakingEvaluationRun } from "~@meetings/prisma/client";
import type { LabelStudioMeeting } from "~@meetings/tasks/label-studio";
import {
  LLMAJ_TRIAGE_TASK_FILENAME,
  NO_FINDINGS,
  NOT_AVAILABLE,
} from "~@meetings/tasks/label-studio-llmaj-triage";
import {
  buildLlmajTriageTask,
  exportLlmajTriageTask,
  type LlmajGradedOutputs,
} from "~@meetings/tasks/label-studio-llmaj-triage-task";
import type {
  EvaluationScores,
  TextEvaluatorOutput,
} from "~@meetings/tasks/llm/evaluators/schemas";

function makeScore(
  overrides: Partial<TextEvaluatorOutput> = {},
): TextEvaluatorOutput {
  return {
    rationale: "Accurate and complete.",
    grade: "GOOD",
    hallucinations: [],
    omissions: [],
    ...overrides,
  };
}

function makeEvaluationRun(
  scores: Partial<EvaluationScores> = {},
): NotetakingEvaluationRun {
  return {
    id: "eval-1",
    createdAt: new Date("2026-03-15T11:00:00Z"),
    pipelineRunId: "run-1",
    evaluatorVersion: "v7",
    scores: {
      transcriptComparison: null,
      caseNote: makeScore(),
      actionItems: makeScore(),
      overall: makeScore(),
      ...scores,
    },
    langsmithTraceId: null,
  } as NotetakingEvaluationRun;
}

function makeGradedOutputs(
  overrides: Partial<LlmajGradedOutputs> = {},
): LlmajGradedOutputs {
  return {
    caseNote: "Client reported starting a warehouse job on Monday.",
    actionItems: [
      {
        assignee: "Client",
        task: "Bring pay stub to next visit",
        deadline: "2026-03-22",
      },
      { assignee: "Staff Member", task: "Confirm start date", deadline: null },
    ],
    ...overrides,
  };
}

function makeMeeting(
  overrides: Partial<LabelStudioMeeting> = {},
): LabelStudioMeeting {
  return {
    id: "meeting-1",
    durationMs: 1830000, // 30m 30s
    startTime: new Date("2026-03-15T10:00:00Z"),
    recordingsGCSBucket: "test-bucket",
    recordingsFolderPath: "meetings/meeting-1",
    finalRecordingGCSPath: "meetings/meeting-1/final.m4a",
    caseNote: "Staff rewrote this note after the judge ran.",
    userNotepadNotes: "Ask about bus pass",
    structuredActionItems: null,
    notetakingPipelineRunId: "run-1",
    meetingActionItems: [
      {
        assignee: "Client",
        generatedTask: "A row that differs from what the judge graded",
        pipelineRunId: "run-1",
      },
    ],
    client: { displayPersonExternalId: "DISPLAY-001" },
    resident: null,
    transcriptions: [
      {
        provider: "ASSEMBLYAI",
        confidence: 0.95,
        utterances: [
          { speaker: "A", text: "How is the new job going?" },
          { speaker: "B", text: "I start on Monday." },
        ],
      },
      {
        provider: "DEEPGRAM",
        confidence: 0.9,
        utterances: [{ speaker: "0", text: "How is the new job going?" }],
      },
    ],
    ...overrides,
  } as LabelStudioMeeting;
}

describe("buildLlmajTriageTask", () => {
  test("builds a task for a meeting whose case note alone is BAD", () => {
    const task = buildLlmajTriageTask(
      makeMeeting(),
      makeEvaluationRun({
        caseNote: makeScore({
          grade: "BAD",
          rationale: "The note invents a start date.",
          hallucinations: ["Says the job starts Monday", "Names the employer"],
          omissions: ["Leaves out the bus pass request"],
        }),
      }),
      "US_NE",
      makeGradedOutputs(),
    );

    expect(task?.random_split).toBeGreaterThanOrEqual(0);
    expect(task?.random_split).toBeLessThan(1);
    expect(task).toEqual(
      expect.objectContaining({
        meeting_id: "meeting-1",
        state_code: "US_NE",
        recording_date: "2026-03-15",
        review_reason: "LLMAJ_BAD",
        pipeline_run_id: "run-1",
        evaluation_run_id: "eval-1",
        evaluator_version: "v7",
        case_note_flagged: true,
        action_items_flagged: false,
        overall_flagged: false,
        judge_case_note_grade: "BAD",
        judge_case_note_rationale: "The note invents a start date.",
        judge_case_note_hallucinations:
          "- Says the job starts Monday\n- Names the employer",
        judge_case_note_omissions: "- Leaves out the bus pass request",
        judge_action_items_grade: "GOOD",
        judge_overall_grade: "GOOD",
        case_note: "Client reported starting a warehouse job on Monday.",
        action_items:
          "[Client] Bring pay stub to next visit (due: 2026-03-22)\n[Staff Member] Confirm start date",
        staff_notes: "Ask about bus pass",
        transcript: "[A]: How is the new job going?\n[B]: I start on Monday.",
        audio: "gs://test-bucket/meetings/meeting-1/final.m4a",
        meta: {
          State: "US_NE",
          "Recording date": "2026-03-15",
          Duration: "30m 30s",
          "Meeting ID": "meeting-1",
          "Person Display ID": "DISPLAY-001",
        },
      }),
    );
  });

  test("builds a task for a meeting whose overall grade alone is BAD", () => {
    const task = buildLlmajTriageTask(
      makeMeeting(),
      makeEvaluationRun({
        overall: makeScore({ grade: "BAD", omissions: ["Misses the job"] }),
      }),
      "US_NE",
      makeGradedOutputs(),
    );

    expect(task).toEqual(
      expect.objectContaining({
        case_note_flagged: false,
        action_items_flagged: false,
        overall_flagged: true,
        judge_overall_grade: "BAD",
        judge_overall_omissions: "- Misses the job",
      }),
    );
  });

  test("shows NOT_AVAILABLE for a meeting with no action items", () => {
    const task = buildLlmajTriageTask(
      makeMeeting(),
      makeEvaluationRun({ caseNote: makeScore({ grade: "BAD" }) }),
      "US_NE",
      makeGradedOutputs({ actionItems: [] }),
    );

    expect(task?.action_items).toBe(NOT_AVAILABLE);
  });

  test("shows a failed judge dimension as not available and unflagged", () => {
    const task = buildLlmajTriageTask(
      makeMeeting(),
      makeEvaluationRun({
        caseNote: makeScore({ grade: "BAD" }),
        actionItems: null,
      }),
      "US_NE",
      makeGradedOutputs(),
    );

    expect(task).toEqual(
      expect.objectContaining({
        action_items_flagged: false,
        judge_action_items_grade: NOT_AVAILABLE,
        judge_action_items_rationale: NOT_AVAILABLE,
        judge_action_items_hallucinations: NO_FINDINGS,
        judge_action_items_omissions: NO_FINDINGS,
      }),
    );
  });

  test("shows NO_FINDINGS for empty findings lists on a BAD section", () => {
    const task = buildLlmajTriageTask(
      makeMeeting(),
      makeEvaluationRun({ caseNote: makeScore({ grade: "BAD" }) }),
      "US_NE",
      makeGradedOutputs(),
    );

    expect(task?.judge_case_note_hallucinations).toBe(NO_FINDINGS);
    expect(task?.judge_case_note_omissions).toBe(NO_FINDINGS);
  });

  test("shows NOT_AVAILABLE for missing meeting outputs and metadata", () => {
    const task = buildLlmajTriageTask(
      makeMeeting({
        userNotepadNotes: "",
        transcriptions: [],
        finalRecordingGCSPath: null,
        durationMs: null,
        client: null,
        resident: null,
      }),
      makeEvaluationRun({ overall: makeScore({ grade: "BAD" }) }),
      "US_NE",
      makeGradedOutputs({ caseNote: "" }),
    );

    expect(task).toEqual(
      expect.objectContaining({
        case_note: NOT_AVAILABLE,
        staff_notes: NOT_AVAILABLE,
        transcript: NOT_AVAILABLE,
        audio: null,
      }),
    );
    expect(task?.meta.Duration).toBe(NOT_AVAILABLE);
    expect(task?.meta["Person Display ID"]).toBe(NOT_AVAILABLE);
  });

  test("returns null when no section is BAD", () => {
    expect(
      buildLlmajTriageTask(
        makeMeeting(),
        makeEvaluationRun({ caseNote: makeScore({ grade: "PARTIAL" }) }),
        "US_NE",
        makeGradedOutputs(),
      ),
    ).toBeNull();
  });
});

describe("exportLlmajTriageTask", () => {
  let localStorageDir: string;

  beforeEach(() => {
    localStorageDir = fs.mkdtempSync(path.join(os.tmpdir(), "llmaj-triage-"));
    vi.stubEnv("IS_LOCAL_MODE", "true");
    vi.stubEnv("LOCAL_STORAGE_DIR", localStorageDir);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    fs.rmSync(localStorageDir, { recursive: true, force: true });
  });

  const taskPath = () =>
    path.join(
      localStorageDir,
      "meetings/meeting-1",
      LLMAJ_TRIAGE_TASK_FILENAME,
    );

  test("writes the task next to the full-review task in local mode", async () => {
    const written = await exportLlmajTriageTask(
      makeMeeting(),
      makeEvaluationRun({ caseNote: makeScore({ grade: "BAD" }) }),
      "US_NE",
      makeGradedOutputs(),
    );

    expect(written).toBe(true);
    const task = JSON.parse(fs.readFileSync(taskPath(), "utf8"));
    expect(task.meeting_id).toBe("meeting-1");
    expect(task.case_note_flagged).toBe(true);
  });

  test("writes nothing when no section is BAD", async () => {
    const written = await exportLlmajTriageTask(
      makeMeeting(),
      makeEvaluationRun(),
      "US_NE",
      makeGradedOutputs(),
    );

    expect(written).toBe(false);
    expect(fs.existsSync(taskPath())).toBe(false);
  });
});
