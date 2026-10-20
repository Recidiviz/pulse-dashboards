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

import { z } from "zod";

import { MEETINGS_STATE_CODES } from "~@meetings/config";
import type {
  ReviewCorrectedGrade,
  ReviewOutcomeKind,
  ReviewSection,
  StateCode,
} from "~@meetings/prisma/client";

// The values of the Prisma enums this contract uses. This lib imports Prisma
// types only, because its tests run without a generated Prisma client; the
// satisfies clauses fail typecheck if the schema's enums change.
const SECTION = {
  CASE_NOTE: "CASE_NOTE",
  ACTION_ITEMS: "ACTION_ITEMS",
  OVERALL: "OVERALL",
} as const satisfies { [K in ReviewSection]: K };

const OUTCOME = {
  CONFIRMED_BAD: "CONFIRMED_BAD",
  NOT_BAD: "NOT_BAD",
  OTHER: "OTHER",
} as const satisfies { [K in ReviewOutcomeKind]: K };

const CORRECTED_GRADE = {
  GOOD: "GOOD",
  PARTIAL: "PARTIAL",
} as const satisfies { [K in ReviewCorrectedGrade]: K };

const stateCode = z.custom<StateCode>(
  (value) => typeof value === "string" && MEETINGS_STATE_CODES.includes(value),
  { message: "Expected a state code enabled for Meetings" },
);

// =============================================================================
// The contract for an LLMAJ triage task: a Label Studio task asking a QA rater
// whether the LLM judge was right to grade a section of a meeting BAD. It is
// the counterpart to label-studio.ts, which builds the full-review task,
// where a rater grades the whole meeting without seeing the judge's grades.
// The two go to separate Label Studio projects.
//
// The task shows the judge's grade, rationale and findings for each section
// next to the case note and action items the judge graded. The rater records
// one verdict per flagged section, using the same outcomes as
// MeetingReviewOutcome. For example, a meeting whose case note the judge
// graded BAD exports a task like (fields abridged):
//
//   meeting_id: "c3f1..."
//   case_note_flagged: true
//   action_items_flagged: false
//   judge_case_note_grade: "BAD"
//   judge_case_note_hallucinations: "- Says the client starts work Monday; ..."
//   case_note: "Met with the client to review ..."
//
// and a rater who disagrees produces a verdict like:
//
//   { section: "CASE_NOTE", outcome: "NOT_BAD", correctedGrade: "PARTIAL",
//     notes: "The start date is in the transcript at 12:40." }
//
// Fields are flat because the labeling config binds to top-level $field
// names, and lists are newline-joined strings because its Text tag runs an
// array together into one line. Every field the config displays is a
// non-empty string, never null: Label Studio (1.23) rejects the whole import
// when a Text tag's field is null, so missing values use NO_FINDINGS or
// NOT_AVAILABLE instead.
// =============================================================================

/** Shown in place of an empty hallucinations or omissions list. */
export const NO_FINDINGS = "None";

/** Shown in place of any other displayed value that is missing. */
export const NOT_AVAILABLE = "Not available";

/**
 * Basename of the LLMAJ triage task file, written next to
 * label-studio-task.json in the meeting's recordings folder. The LLMAJ triage
 * project's Sync Storage imports only objects with this name.
 *
 * Sync Storage keys tasks by GCS path and never dedupes, so renaming this file
 * after tasks have synced imports every one of them again (see
 * LABEL_STUDIO_TASK_FILENAME).
 */
export const LLMAJ_TRIAGE_TASK_FILENAME = "llmaj-triage-task.json";

/**
 * The sections an LLMAJ triage task can ask about, with the task field prefix
 * and the EvaluationScores key that grades each one.
 */
export const LLMAJ_TRIAGE_SECTIONS = [
  {
    section: SECTION.CASE_NOTE,
    prefix: "case_note",
    scoresKey: "caseNote",
  },
  {
    section: SECTION.ACTION_ITEMS,
    prefix: "action_items",
    scoresKey: "actionItems",
  },
  { section: SECTION.OVERALL, prefix: "overall", scoresKey: "overall" },
] as const;

export type LlmajTriageSectionPrefix =
  (typeof LLMAJ_TRIAGE_SECTIONS)[number]["prefix"];

// NOT_AVAILABLE when that judge failed to produce a score.
const judgeGrade = z.union([
  z.enum(["GOOD", "PARTIAL", "BAD"]),
  z.literal(NOT_AVAILABLE),
]);

// One finding per line, each starting with "- ", or NO_FINDINGS.
const findingLines = z.string().min(1);

// A value the labeling config displays, or NOT_AVAILABLE.
const displayed = z.string().min(1);

export const LlmajTriageTaskSchema = z
  .object({
    meeting_id: z.string().min(1),
    state_code: stateCode,
    /** The meeting's start date, YYYY-MM-DD. */
    recording_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    review_reason: z.literal("LLMAJ_BAD"),
    /** The NotetakingPipelineRun whose outputs the judge graded. */
    pipeline_run_id: z.string().min(1),
    /** The NotetakingEvaluationRun that holds the judge's full scores. */
    evaluation_run_id: z.string().min(1),
    evaluator_version: z.string().min(1),
    exported_at: z.string().datetime(),
    /** Uniform in [0, 1), for splitting tasks between raters in Label Studio. */
    random_split: z.number().min(0).lt(1),

    case_note_flagged: z.boolean(),
    action_items_flagged: z.boolean(),
    overall_flagged: z.boolean(),

    judge_case_note_grade: judgeGrade,
    judge_case_note_rationale: displayed,
    judge_case_note_hallucinations: findingLines,
    judge_case_note_omissions: findingLines,

    judge_action_items_grade: judgeGrade,
    judge_action_items_rationale: displayed,
    judge_action_items_hallucinations: findingLines,
    judge_action_items_omissions: findingLines,

    judge_overall_grade: judgeGrade,
    judge_overall_rationale: displayed,
    judge_overall_hallucinations: findingLines,
    judge_overall_omissions: findingLines,

    /** The generated case note the judge graded, before any staff edits. */
    case_note: displayed,
    /** The generated action items the judge graded, one "[Assignee] Task" per line. */
    action_items: displayed,
    /** Notes the staff member typed during the meeting, which the judge also saw. */
    staff_notes: displayed,
    /** The best provider's transcript, one "Speaker: text" utterance per line. */
    transcript: displayed,
    /** gs:// URI of the merged recording. */
    audio: z.string().startsWith("gs://").nullable(),

    /** Rows for the labeling config's Table widget, keyed by display label. */
    meta: z.object({
      State: stateCode,
      "Recording date": z.string(),
      Duration: displayed,
      "Meeting ID": z.string(),
      "Person Display ID": displayed,
    }),
  })
  .superRefine((task, ctx) => {
    let anyFlagged = false;
    for (const { prefix } of LLMAJ_TRIAGE_SECTIONS) {
      const flagged = task[`${prefix}_flagged`];
      anyFlagged ||= flagged;
      if (flagged !== (task[`judge_${prefix}_grade`] === "BAD")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [`${prefix}_flagged`],
          message: "A section is flagged exactly when the judge graded it BAD",
        });
      }
    }
    if (!anyFlagged) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["review_reason"],
        message: "An LLMAJ triage task needs at least one BAD section",
      });
    }
  });

export type LlmajTriageTask = z.infer<typeof LlmajTriageTaskSchema>;

/**
 * Names of the labeling config's result controls for each section. Each
 * outcome and corrected-grade Choice uses the Prisma enum name as its alias,
 * so the stored value maps straight onto MeetingReviewOutcome.
 */
export const LLMAJ_TRIAGE_RESULT_FIELDS = {
  [SECTION.CASE_NOTE]: {
    outcome: "case_note_outcome",
    correctedGrade: "case_note_corrected_grade",
    notes: "case_note_notes",
  },
  [SECTION.ACTION_ITEMS]: {
    outcome: "action_items_outcome",
    correctedGrade: "action_items_corrected_grade",
    notes: "action_items_notes",
  },
  [SECTION.OVERALL]: {
    outcome: "overall_outcome",
    correctedGrade: "overall_corrected_grade",
    notes: "overall_notes",
    /**
     * A required multi-select of CASE_NOTE, ACTION_ITEMS and
     * APPLIES_TO_NEITHER. Label Studio exports nothing for an empty
     * multi-select, so "neither" needs its own choice to tell it apart from
     * an unanswered question.
     */
    appliesTo: "overall_applies_to",
  },
} as const satisfies Record<
  ReviewSection,
  { outcome: string; correctedGrade: string; notes: string; appliesTo?: string }
>;

/**
 * The overall_applies_to choice a rater picks when the problem is in neither
 * section. It exists only in the Label Studio annotation: decoding a verdict
 * turns ["NEITHER"] into an empty appliesTo, which is how
 * MeetingReviewOutcome.appliesTo records "neither".
 */
export const APPLIES_TO_NEITHER = "NEITHER";

const verdictBase = {
  section: z.nativeEnum(SECTION),
  notes: z.string().trim().max(4000).optional(),
  /** Only on an Overall verdict; empty means the problem is in neither section. */
  appliesTo: z
    .array(z.enum([SECTION.CASE_NOTE, SECTION.ACTION_ITEMS]))
    .optional(),
};

/**
 * A rater's decoded verdict on one flagged section. Unlike an admin outcome it
 * has no follow-up or overridden sources, and Not BAD always carries a
 * corrected grade because the judge always graded the section.
 */
export const LlmajTriageVerdictSchema = z
  .discriminatedUnion("outcome", [
    z.object({
      ...verdictBase,
      outcome: z.literal(OUTCOME.CONFIRMED_BAD),
    }),
    z.object({
      ...verdictBase,
      outcome: z.literal(OUTCOME.NOT_BAD),
      correctedGrade: z.nativeEnum(CORRECTED_GRADE),
    }),
    z.object({
      ...verdictBase,
      outcome: z.literal(OUTCOME.OTHER),
      notes: z.string().trim().min(1).max(4000),
    }),
  ])
  .superRefine((verdict, ctx) => {
    const needsAppliesTo =
      verdict.section === SECTION.OVERALL && verdict.outcome !== OUTCOME.OTHER;
    if (needsAppliesTo && verdict.appliesTo === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appliesTo"],
        message: "Choose which sections an Overall verdict applies to",
      });
    }
    if (!needsAppliesTo && verdict.appliesTo !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appliesTo"],
        message:
          "Only a Confirmed BAD or Not BAD Overall verdict has appliesTo",
      });
    }
  });

export type LlmajTriageVerdict = z.infer<typeof LlmajTriageVerdictSchema>;
