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

import { describe, expect, test, vi } from "vitest";

import type { LabelStudioTask } from "~@meetings/tasks/label-studio-client";
import type {
  EvaluationScores,
  TextEvaluatorOutput,
} from "~@meetings/tasks/llm/evaluators/schemas";
import {
  type BackfillEvaluationRun,
  type BackfillMeetingFacts,
  classifyBackfillMeeting,
  gradedOutputsFromAgentExecutions,
  groupTasksByMeetingId,
} from "~@meetings/tasks/llmaj-triage-backfill";

const CURRENT_VERSION = "5";

function textScore(grade: TextEvaluatorOutput["grade"]): TextEvaluatorOutput {
  return {
    grade,
    rationale: `graded ${grade}`,
    hallucinations: [],
    omissions: [],
  };
}

function evaluationRun(
  overrides: Partial<EvaluationScores>,
  {
    id = "eval-1",
    evaluatorVersion = CURRENT_VERSION,
    createdAt = new Date("2026-10-01T12:00:00Z"),
  } = {},
): BackfillEvaluationRun {
  const scores: EvaluationScores = {
    transcriptComparison: null,
    caseNote: textScore("GOOD"),
    actionItems: textScore("GOOD"),
    overall: textScore("GOOD"),
    ...overrides,
  };
  return { id, evaluatorVersion, createdAt, scores };
}

function fullReviewTask(
  id: number,
  { completed = 0, skipped = 0 } = {},
): LabelStudioTask {
  return {
    id,
    data: { meeting_id: "meeting-1" },
    total_annotations: completed,
    cancelled_annotations: skipped,
  };
}

function facts(
  overrides: Partial<BackfillMeetingFacts> = {},
): BackfillMeetingFacts {
  return {
    meetingId: "meeting-1",
    stateCode: "US_NE",
    startTime: new Date("2026-09-15T16:00:00Z"),
    evaluationRuns: [evaluationRun({ caseNote: textScore("BAD") })],
    hasReviewOutcome: false,
    fullReviewTasks: [fullReviewTask(101)],
    ...overrides,
  };
}

const noTriageTask = () => Promise.resolve(false);

async function classify(
  overrides: Partial<BackfillMeetingFacts> = {},
  triageTaskExists = noTriageTask,
  options: { since?: Date } = {},
) {
  return classifyBackfillMeeting(facts(overrides), triageTaskExists, options);
}

describe("classifyBackfillMeeting", () => {
  test("picks a judge-BAD meeting whose full-review task is unlabeled", async () => {
    expect(await classify()).toEqual({
      kind: "candidate",
      meetingId: "meeting-1",
      stateCode: "US_NE",
      evaluationRunId: "eval-1",
      fullReviewTaskIds: [101],
    });
  });

  test("picks a meeting the judge graded BAD only overall", async () => {
    const decision = await classify({
      evaluationRuns: [evaluationRun({ overall: textScore("BAD") })],
    });

    expect(decision).toMatchObject({ kind: "candidate" });
  });

  test("skips a meeting whose full-review task has an annotation", async () => {
    const decision = await classify({
      fullReviewTasks: [fullReviewTask(101, { completed: 1 })],
    });

    expect(decision).toMatchObject({
      kind: "skip",
      reason: "FULL_REVIEW_ANNOTATED",
    });
  });

  test("skips a meeting whose full-review task a rater skipped", async () => {
    const decision = await classify({
      fullReviewTasks: [fullReviewTask(101, { skipped: 1 })],
    });

    expect(decision).toMatchObject({
      kind: "skip",
      reason: "FULL_REVIEW_SKIPPED",
    });
  });

  test("skips a meeting with any annotated task among duplicates", async () => {
    const decision = await classify({
      fullReviewTasks: [
        fullReviewTask(101),
        fullReviewTask(102, { completed: 1 }),
      ],
    });

    expect(decision).toMatchObject({
      kind: "skip",
      reason: "FULL_REVIEW_ANNOTATED",
    });
  });

  test("throws for a task listed without annotation counts", async () => {
    await expect(
      classify({ fullReviewTasks: [{ id: 101, data: {} }] }),
    ).rejects.toThrow("no annotation counts");
  });

  test("skips a meeting that already has a MeetingReviewOutcome", async () => {
    const decision = await classify({ hasReviewOutcome: true });

    expect(decision).toMatchObject({
      kind: "skip",
      reason: "HAS_REVIEW_OUTCOME",
    });
  });

  test("counts a BAD grade from an older evaluator version", async () => {
    const decision = await classify({
      evaluationRuns: [
        evaluationRun(
          { caseNote: textScore("BAD") },
          { evaluatorVersion: "4" },
        ),
      ],
    });

    expect(decision).toMatchObject({
      kind: "candidate",
      evaluationRunId: "eval-1",
    });
  });

  test("uses the latest run, even when an older one is at a newer version", async () => {
    const decision = await classify({
      evaluationRuns: [
        evaluationRun(
          {},
          {
            id: "older-v5",
            evaluatorVersion: "5",
            createdAt: new Date("2026-10-01T12:00:00Z"),
          },
        ),
        evaluationRun(
          { overall: textScore("BAD") },
          {
            id: "newer-v4",
            evaluatorVersion: "4",
            createdAt: new Date("2026-10-02T12:00:00Z"),
          },
        ),
      ],
    });

    expect(decision).toMatchObject({
      kind: "candidate",
      evaluationRunId: "newer-v4",
    });
  });

  test("ignores an older BAD run once a newer run grades the meeting GOOD", async () => {
    const decision = await classify({
      evaluationRuns: [
        evaluationRun(
          { caseNote: textScore("BAD") },
          {
            id: "older",
            evaluatorVersion: "4",
            createdAt: new Date("2026-10-01T12:00:00Z"),
          },
        ),
        evaluationRun(
          {},
          { id: "newer", createdAt: new Date("2026-10-02T12:00:00Z") },
        ),
      ],
    });

    expect(decision).toMatchObject({ kind: "skip", reason: "NOT_JUDGE_BAD" });
  });

  test("skips a meeting with no judge run", async () => {
    const decision = await classify({ evaluationRuns: [] });

    expect(decision).toMatchObject({ kind: "skip", reason: "NO_EVALUATION" });
  });

  test("skips US_DEMO", async () => {
    const decision = await classify({ stateCode: "US_DEMO" });

    expect(decision).toMatchObject({ kind: "skip", reason: "US_DEMO" });
  });

  test("skips a meeting that already has a triage task", async () => {
    const decision = await classify({}, () => Promise.resolve(true));

    expect(decision).toMatchObject({
      kind: "skip",
      reason: "ALREADY_TRIAGED",
    });
  });

  test("looks for a triage task only after every other check passes", async () => {
    const triageTaskExists = vi.fn(noTriageTask);

    await classify({ hasReviewOutcome: true }, triageTaskExists);

    expect(triageTaskExists).not.toHaveBeenCalled();
  });

  test("skips a meeting with no full-review task", async () => {
    const decision = await classify({ fullReviewTasks: [] });

    expect(decision).toMatchObject({
      kind: "skip",
      reason: "NO_FULL_REVIEW_TASK",
    });
  });

  test("skips a meeting that started before --since", async () => {
    const decision = await classify({}, noTriageTask, {
      since: new Date("2026-10-01T00:00:00Z"),
    });

    expect(decision).toMatchObject({ kind: "skip", reason: "OUTSIDE_WINDOW" });
  });
});

describe("groupTasksByMeetingId", () => {
  test("groups duplicates and drops tasks without a meeting_id", () => {
    const grouped = groupTasksByMeetingId([
      { id: 1, data: { meeting_id: "meeting-a" } },
      { id: 2, data: { meeting_id: "meeting-b" } },
      { id: 3, data: { meeting_id: "meeting-a" } },
      { id: 4, data: {} },
    ]);

    expect(
      [...grouped].map(([meetingId, tasks]) => [
        meetingId,
        tasks.map((t) => t.id),
      ]),
    ).toEqual([
      ["meeting-a", [1, 3]],
      ["meeting-b", [2]],
    ]);
  });
});

describe("gradedOutputsFromAgentExecutions", () => {
  const drafting = (caseNote: string) => ({
    caseNote,
    staffFeedback: { whatYouDidWell: [], growthOpportunities: [] },
  });
  const verification = {
    actionItems: [
      {
        assignee: "Client" as const,
        task: "Bring a pay stub to the next visit",
        deadline: null,
        context: null,
        evidenceQuotes: [],
      },
    ],
    entities: [],
  };

  test("reads the newest parseable drafting output and the newest verification output", () => {
    const outputs = gradedOutputsFromAgentExecutions([
      {
        agentType: "DRAFTING",
        attemptNumber: 1,
        outputData: drafting("First draft of the synthetic note."),
      },
      {
        agentType: "DRAFTING",
        attemptNumber: 2,
        outputData: { unexpected: "shape" },
      },
      {
        agentType: "VERIFICATION",
        attemptNumber: 1,
        outputData: verification,
      },
    ]);

    expect(outputs).toEqual({
      caseNote: "First draft of the synthetic note.",
      actionItems: [
        {
          assignee: "Client",
          task: "Bring a pay stub to the next visit",
          deadline: null,
        },
      ],
    });
  });

  test("returns null without a verification output", () => {
    expect(
      gradedOutputsFromAgentExecutions([
        {
          agentType: "DRAFTING",
          attemptNumber: 1,
          outputData: drafting("Synthetic note."),
        },
      ]),
    ).toBeNull();
  });
});
