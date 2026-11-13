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

import {
  type NotetakingAgentExecution,
  type NotetakingEvaluationRun,
  type PrismaClient,
  type StateCode,
} from "~@meetings/prisma/client";
import type { LabelStudioTask } from "~@meetings/tasks/label-studio-client";
import {
  LLMAJ_TRIAGE_SECTIONS,
  LLMAJ_TRIAGE_TASK_FILENAME,
} from "~@meetings/tasks/label-studio-llmaj-triage";
import type { LlmajGradedOutputs } from "~@meetings/tasks/label-studio-llmaj-triage-task";
import type { EvaluationScores } from "~@meetings/tasks/llm/evaluators/schemas";
import {
  DraftingOutputSchema,
  VerificationOutputSchema,
} from "~@meetings/tasks/llm/schemas";
import { meetingTaskFileExists } from "~@meetings/tasks/meeting-task-file";

// =============================================================================
// Picks the meetings the one-time LLMAJ triage backfill gives a triage task:
// meetings the judge graded BAD that were exported to the full-review Label
// Studio project before triage existed, and that nobody has looked at yet.
//
// A meeting's grades come from its latest judge run, whatever evaluator version
// ran it. For example, given these US_NE meetings:
//
//   meeting  latest judge run     full-review task   other
//   m-1      v4, case note BAD    no annotations     -
//   m-2      v5, overall BAD      1 annotation       -
//   m-3      v5, action items BAD skipped by a rater -
//   m-4      v4, case note BAD    no annotations     has MeetingReviewOutcome
//   m-5      v5, all GOOD         no annotations     an older v4 run was BAD
//
// only m-1 is a candidate. The others are skipped as FULL_REVIEW_ANNOTATED,
// FULL_REVIEW_SKIPPED, HAS_REVIEW_OUTCOME and NOT_JUDGE_BAD.
// =============================================================================

export const BACKFILL_SKIP_REASONS = [
  "US_DEMO",
  "OUTSIDE_WINDOW",
  "NO_EVALUATION",
  "NOT_JUDGE_BAD",
  "HAS_REVIEW_OUTCOME",
  "NO_FULL_REVIEW_TASK",
  "FULL_REVIEW_ANNOTATED",
  "FULL_REVIEW_SKIPPED",
  "ALREADY_TRIAGED",
  "MISSING_GRADED_OUTPUTS",
] as const;

export type BackfillSkipReason = (typeof BACKFILL_SKIP_REASONS)[number];

export type BackfillEvaluationRun = Pick<
  NotetakingEvaluationRun,
  "id" | "createdAt" | "evaluatorVersion" | "scores"
>;

/** What the backfill knows about one meeting before it decides. */
export interface BackfillMeetingFacts {
  meetingId: string;
  stateCode: StateCode;
  startTime: Date;
  /** Every judge run on any of the meeting's pipeline runs, at any version. */
  evaluationRuns: BackfillEvaluationRun[];
  hasReviewOutcome: boolean;
  /** The meeting's tasks in the full-review project, listed with annotation counts. */
  fullReviewTasks: LabelStudioTask[];
}

export type BackfillDecision =
  | {
      kind: "candidate";
      meetingId: string;
      stateCode: StateCode;
      evaluationRunId: string;
      fullReviewTaskIds: number[];
    }
  | {
      kind: "skip";
      meetingId: string;
      stateCode: StateCode;
      reason: BackfillSkipReason;
    };

/** Returns the most recent run at any evaluator version, or undefined if there is none. */
export function latestEvaluationRun<T extends BackfillEvaluationRun>(
  runs: T[],
): T | undefined {
  return runs.reduce<T | undefined>(
    (latest, run) =>
      !latest || run.createdAt > latest.createdAt ? run : latest,
    undefined,
  );
}

/** Returns whether the judge graded any triage section BAD. */
export function isJudgeBad(
  evaluationRun: Pick<NotetakingEvaluationRun, "scores">,
): boolean {
  const scores = evaluationRun.scores as unknown as EvaluationScores;
  return LLMAJ_TRIAGE_SECTIONS.some(
    ({ scoresKey }) => scores[scoresKey]?.grade === "BAD",
  );
}

/**
 * Returns whether a rater has finished or skipped any of a meeting's
 * full-review tasks, or "UNLABELED" when nobody has touched them.
 *
 * Throws when a task was listed without annotation counts, since an unknown
 * count must never read as "unlabeled".
 */
export function fullReviewStatus(
  tasks: LabelStudioTask[],
): "ANNOTATED" | "SKIPPED" | "UNLABELED" {
  let skipped = false;
  for (const task of tasks) {
    if (
      task.total_annotations === undefined ||
      task.cancelled_annotations === undefined
    ) {
      throw new Error(
        `Label Studio task ${task.id} has no annotation counts; list it with withAnnotationCounts`,
      );
    }
    if (task.total_annotations > 0) return "ANNOTATED";
    if (task.cancelled_annotations > 0) skipped = true;
  }
  return skipped ? "SKIPPED" : "UNLABELED";
}

/** Returns full-review tasks keyed by their meeting_id, dropping tasks without one. */
export function groupTasksByMeetingId(
  tasks: LabelStudioTask[],
): Map<string, LabelStudioTask[]> {
  const byMeetingId = new Map<string, LabelStudioTask[]>();
  for (const task of tasks) {
    const meetingId = task.data["meeting_id"];
    if (typeof meetingId !== "string" || !meetingId) continue;
    const tasksForMeeting = byMeetingId.get(meetingId);
    if (tasksForMeeting) tasksForMeeting.push(task);
    else byMeetingId.set(meetingId, [task]);
  }
  return byMeetingId;
}

/**
 * Decides whether a meeting gets a backfilled triage task.
 *
 * Args:
 *   facts: What the backfill knows about the meeting.
 *   triageTaskExists: Returns whether the meeting already has an
 *     llmaj-triage-task.json. Called last, and only for a meeting that passes
 *     every other check, because it reads from GCS.
 *   options.since: When set, meetings that started before it are skipped.
 */
export async function classifyBackfillMeeting(
  facts: BackfillMeetingFacts,
  triageTaskExists: () => Promise<boolean>,
  { since }: { since?: Date } = {},
): Promise<BackfillDecision> {
  const { meetingId, stateCode } = facts;
  const skip = (reason: BackfillSkipReason): BackfillDecision => ({
    kind: "skip",
    meetingId,
    stateCode,
    reason,
  });

  if (stateCode === "US_DEMO") return skip("US_DEMO");
  if (since && facts.startTime < since) return skip("OUTSIDE_WINDOW");

  const evaluationRun = latestEvaluationRun(facts.evaluationRuns);
  if (!evaluationRun) return skip("NO_EVALUATION");
  if (!isJudgeBad(evaluationRun)) return skip("NOT_JUDGE_BAD");

  if (facts.hasReviewOutcome) return skip("HAS_REVIEW_OUTCOME");

  if (facts.fullReviewTasks.length === 0) return skip("NO_FULL_REVIEW_TASK");
  const status = fullReviewStatus(facts.fullReviewTasks);
  if (status === "ANNOTATED") return skip("FULL_REVIEW_ANNOTATED");
  if (status === "SKIPPED") return skip("FULL_REVIEW_SKIPPED");

  if (await triageTaskExists()) return skip("ALREADY_TRIAGED");

  return {
    kind: "candidate",
    meetingId,
    stateCode,
    evaluationRunId: evaluationRun.id,
    fullReviewTaskIds: facts.fullReviewTasks.map((task) => task.id),
  };
}

/**
 * Returns the case note and action items the judge graded for a pipeline run,
 * read from its agent executions the same way the run-llmaj-evaluation route
 * picks them, or null when either output is missing or unparseable.
 */
export function gradedOutputsFromAgentExecutions(
  executions: Pick<
    NotetakingAgentExecution,
    "agentType" | "attemptNumber" | "outputData"
  >[],
): LlmajGradedOutputs | null {
  const newestFirst = [...executions].sort(
    (a, b) => b.attemptNumber - a.attemptNumber,
  );
  const drafting = newestFirst
    .filter((e) => e.agentType === "DRAFTING")
    .map((e) => DraftingOutputSchema.safeParse(e.outputData))
    .find((parsed) => parsed.success);
  const verificationExecution = newestFirst.find(
    (e) => e.agentType === "VERIFICATION",
  );
  const verification = verificationExecution
    ? VerificationOutputSchema.safeParse(verificationExecution.outputData)
    : undefined;
  if (!drafting?.data || !verification?.success) return null;

  return {
    caseNote: drafting.data.caseNote,
    actionItems: verification.data.actionItems.map(
      ({ task, assignee, deadline }) => ({ task, assignee, deadline }),
    ),
  };
}

export type BackfillCandidate = Extract<
  BackfillDecision,
  { kind: "candidate" }
> & {
  evaluationRun: NotetakingEvaluationRun;
  gradedOutputs: LlmajGradedOutputs;
};

/**
 * Returns the backfill decision for every meeting in one state's database
 * that has a judge run, and loads each candidate's graded
 * outputs. It only reads: from Postgres, and from GCS to look for existing
 * triage tasks.
 *
 * Args:
 *   prisma: The state's database client.
 *   stateCode: The state the database belongs to.
 *   fullReviewTasksByMeetingId: Every task in the full-review project, from
 *     groupTasksByMeetingId.
 *   options.since: When set, meetings that started before it are skipped.
 */
export async function planLlmajTriageBackfill(
  prisma: PrismaClient,
  stateCode: StateCode,
  fullReviewTasksByMeetingId: Map<string, LabelStudioTask[]>,
  { since }: { since?: Date } = {},
): Promise<{
  /** How many meetings that still exist have a judge run. */
  judgedMeetingCount: number;
  candidates: BackfillCandidate[];
  skipped: Extract<BackfillDecision, { kind: "skip" }>[];
}> {
  const evaluationRuns = await prisma.notetakingEvaluationRun.findMany({
    include: { pipelineRun: { select: { meetingId: true } } },
  });
  const runsByMeetingId = new Map<string, typeof evaluationRuns>();
  for (const run of evaluationRuns) {
    const { meetingId } = run.pipelineRun;
    const runsForMeeting = runsByMeetingId.get(meetingId);
    if (runsForMeeting) runsForMeeting.push(run);
    else runsByMeetingId.set(meetingId, [run]);
  }
  const meetingIds = [...runsByMeetingId.keys()];

  const [meetings, reviewOutcomes] = await Promise.all([
    prisma.meeting.findMany({
      where: { id: { in: meetingIds } },
      select: {
        id: true,
        startTime: true,
        recordingsGCSBucket: true,
        recordingsFolderPath: true,
      },
    }),
    prisma.meetingReviewOutcome.findMany({
      where: { meetingId: { in: meetingIds } },
      select: { meetingId: true },
      distinct: ["meetingId"],
    }),
  ]);
  const reviewedMeetingIds = new Set(reviewOutcomes.map((o) => o.meetingId));

  const candidates: BackfillCandidate[] = [];
  const skipped: Extract<BackfillDecision, { kind: "skip" }>[] = [];
  // Meetings deleted since their judge run have no row and drop out here.
  for (const meeting of meetings) {
    const runs = runsByMeetingId.get(meeting.id) ?? [];
    // eslint-disable-next-line no-await-in-loop -- one GCS lookup at a time keeps the read load on the bucket low
    const decision = await classifyBackfillMeeting(
      {
        meetingId: meeting.id,
        stateCode,
        startTime: meeting.startTime,
        evaluationRuns: runs,
        hasReviewOutcome: reviewedMeetingIds.has(meeting.id),
        fullReviewTasks: fullReviewTasksByMeetingId.get(meeting.id) ?? [],
      },
      () => meetingTaskFileExists(meeting, LLMAJ_TRIAGE_TASK_FILENAME),
      { since },
    );
    if (decision.kind === "skip") {
      skipped.push(decision);
      continue;
    }

    const evaluationRun = runs.find((r) => r.id === decision.evaluationRunId);
    if (!evaluationRun) throw new Error("unreachable: run was just selected");
    // eslint-disable-next-line no-await-in-loop -- candidates are few, and sequential reads keep the load on the database low
    const executions = await prisma.notetakingAgentExecution.findMany({
      where: {
        pipelineRunId: evaluationRun.pipelineRunId,
        agentType: { in: ["DRAFTING", "VERIFICATION"] },
      },
      select: { agentType: true, attemptNumber: true, outputData: true },
    });
    const gradedOutputs = gradedOutputsFromAgentExecutions(executions);
    if (!gradedOutputs) {
      skipped.push({
        kind: "skip",
        meetingId: meeting.id,
        stateCode,
        reason: "MISSING_GRADED_OUTPUTS",
      });
      continue;
    }
    candidates.push({ ...decision, evaluationRun, gradedOutputs });
  }

  return { judgedMeetingCount: meetings.length, candidates, skipped };
}
