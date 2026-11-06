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

import type { ReviewSection } from "~@meetings/prisma/client";
import type { DecodedField } from "~@meetings/tasks/admin/label-studio-annotations";
import {
  APPLIES_TO_NEITHER,
  LLMAJ_TRIAGE_RESULT_FIELDS,
  LLMAJ_TRIAGE_SECTIONS,
  type LlmajTriageTask,
  type LlmajTriageVerdict,
  LlmajTriageVerdictSchema,
} from "~@meetings/tasks/label-studio-llmaj-triage";

// =============================================================================
// Turning a decoded LLMAJ triage annotation into a per-section QA grade, and
// (on a section the judge flagged) the verdict it decodes to.
//
// Pure functions only — no Prisma, no network. The triage-project mirror of
// label-studio-grades.ts, which does the same job for the full-review
// project's `*_accuracy`/`overall_grade` slots.
// =============================================================================

export type LlmajTriageGrade = "BAD" | "PARTIAL" | "GOOD" | "OTHER";

export type LlmajTriageFindingsAccuracy =
  | "ALL_ACCURATE"
  | "SOME_INACCURATE"
  | "ALL_INACCURATE";

function isLlmajTriageGrade(value: string): value is LlmajTriageGrade {
  return (
    value === "BAD" ||
    value === "PARTIAL" ||
    value === "GOOD" ||
    value === "OTHER"
  );
}

function isFindingsAccuracy(
  value: string,
): value is LlmajTriageFindingsAccuracy {
  return (
    value === "ALL_ACCURATE" ||
    value === "SOME_INACCURATE" ||
    value === "ALL_INACCURATE"
  );
}

export interface LlmajTriageSectionResult {
  section: ReviewSection;
  /** Whether the judge flagged this section on the task, not whether the rater graded it. */
  flagged: boolean;
  /** Null when the rater left this (optional, unflagged) section ungraded. */
  grade: LlmajTriageGrade | null;
  findingsAccuracy: LlmajTriageFindingsAccuracy | null;
  notes: string | null;
  /** Only ever set for OVERALL graded BAD or PARTIAL; empty means "neither section". */
  appliesTo: ReviewSection[] | null;
  /**
   * The admin-outcome-shaped verdict this grade decodes to, set only when
   * `flagged` and graded. Null on an unflagged section, where a QA grade is
   * shown to admins but is not a verdict on the judge's call.
   * Also null when the rater's data doesn't parse (e.g. a blank "Can't grade"
   * note) — a malformed annotation drops its verdict rather than crashing.
   */
  verdict: LlmajTriageVerdict | null;
}

function valuesFor(fields: DecodedField[], fromName: string): string[] {
  return fields.filter((f) => f.fromName === fromName).map((f) => f.value);
}

export type LlmajTriageTaskFlags = Pick<
  LlmajTriageTask,
  "case_note_flagged" | "action_items_flagged" | "overall_flagged"
>;

function verdictCandidate(
  grade: LlmajTriageGrade,
  base: { section: ReviewSection; notes?: string; appliesTo?: ReviewSection[] },
) {
  if (grade === "BAD") return { ...base, outcome: "CONFIRMED_BAD" as const };
  if (grade === "OTHER") return { ...base, outcome: "OTHER" as const };
  return { ...base, outcome: "NOT_BAD" as const, correctedGrade: grade };
}

function decodeVerdict(
  section: ReviewSection,
  grade: LlmajTriageGrade,
  notes: string | null,
  appliesTo: ReviewSection[] | null,
): LlmajTriageVerdict | null {
  const base = {
    section,
    ...(notes ? { notes } : {}),
    ...(appliesTo ? { appliesTo } : {}),
  };
  const parsed = LlmajTriageVerdictSchema.safeParse(
    verdictCandidate(grade, base),
  );
  return parsed.success ? parsed.data : null;
}

/** Decodes one rater's annotation into a result per section the task carries. */
export function decodeLlmajTriageAnnotation(
  decodedFields: DecodedField[],
  task: LlmajTriageTaskFlags,
): LlmajTriageSectionResult[] {
  return LLMAJ_TRIAGE_SECTIONS.map(({ section, prefix }) => {
    const resultFields = LLMAJ_TRIAGE_RESULT_FIELDS[section];
    const flagged = task[`${prefix}_flagged`];

    const rawGrade = valuesFor(decodedFields, resultFields.grade)[0];
    const grade = rawGrade && isLlmajTriageGrade(rawGrade) ? rawGrade : null;

    const rawAccuracy = valuesFor(
      decodedFields,
      resultFields.findingsAccuracy,
    )[0];
    const findingsAccuracy =
      rawAccuracy && isFindingsAccuracy(rawAccuracy) ? rawAccuracy : null;

    const notes = valuesFor(decodedFields, resultFields.notes)[0] ?? null;

    const appliesToField =
      "appliesTo" in resultFields ? resultFields.appliesTo : undefined;
    const rawAppliesTo = appliesToField
      ? valuesFor(decodedFields, appliesToField)
      : [];
    const decodedAppliesTo =
      rawAppliesTo.length > 0
        ? rawAppliesTo.filter(
            (v): v is ReviewSection =>
              v !== APPLIES_TO_NEITHER &&
              (v === "CASE_NOTE" || v === "ACTION_ITEMS"),
          )
        : null;
    // The template hides overall_applies_to for a GOOD grade (nothing to
    // apply to), so an unanswered control there still decodes as "neither"
    // rather than "unanswered" — see APPLIES_TO_NEITHER's docstring.
    const appliesTo =
      section === "OVERALL" && grade === "GOOD" && decodedAppliesTo === null
        ? []
        : decodedAppliesTo;

    const verdict =
      flagged && grade ? decodeVerdict(section, grade, notes, appliesTo) : null;

    return {
      section,
      flagged,
      grade,
      findingsAccuracy,
      notes,
      appliesTo,
      verdict,
    };
  });
}

/**
 * Whether a QAer graded this section BAD, which is what puts it in the admin
 * queue. That covers both a Confirmed BAD on a section the judge flagged and a
 * BAD the QAer found on a section the judge didn't. This reads the grade
 * rather than the decoded verdict so a malformed annotation (an Overall BAD
 * with no appliesTo answer) still flags the section.
 */
export function isLlmajTriageGradedBad(
  result: LlmajTriageSectionResult,
): boolean {
  return result.grade === "BAD";
}

/** Whether a QAer graded any section of a triage task BAD, which decides whether the task flags its meeting. */
export function isLlmajTriageTaskGradedBad(
  collapsed: Partial<Record<ReviewSection, LlmajTriageSectionResult>>,
): boolean {
  return Object.values(collapsed).some(
    (result) => result !== undefined && isLlmajTriageGradedBad(result),
  );
}

const GRADE_SEVERITY: Record<LlmajTriageGrade, number> = {
  BAD: 3,
  PARTIAL: 2,
  GOOD: 1,
  OTHER: 0,
};

function worseResult(
  a: LlmajTriageSectionResult,
  b: LlmajTriageSectionResult,
): LlmajTriageSectionResult {
  if (!a.grade) return b;
  if (!b.grade) return a;
  return GRADE_SEVERITY[a.grade] >= GRADE_SEVERITY[b.grade] ? a : b;
}

/** One rater's decoded triage annotation. */
export interface LlmajTriageRaterGrades {
  raterEmail: string;
  sections: LlmajTriageSectionResult[];
}

/**
 * Collapse a task's rater annotations to one result per section: the
 * mirror of collapseTaskGrades for the triage project. The authoritative
 * rater's grade wins outright on any section they graded, otherwise the
 * worst grade across raters wins (OTHER/"Can't grade" never outranks a real
 * grade, the same way N/A never outranks one on the full-review side).
 */
export function collapseLlmajTriageGrades(
  raters: LlmajTriageRaterGrades[],
  authoritativeRaterEmail: string,
): Partial<Record<ReviewSection, LlmajTriageSectionResult>> {
  const collapsed: Partial<Record<ReviewSection, LlmajTriageSectionResult>> =
    {};
  for (const { section } of LLMAJ_TRIAGE_SECTIONS) {
    const graded = raters
      .map((r) => r.sections.find((s) => s.section === section))
      .filter(
        (s): s is LlmajTriageSectionResult =>
          s !== undefined && s.grade !== null,
      );
    if (graded.length === 0) continue;

    const authoritative = raters.find(
      (r) =>
        r.raterEmail.toLowerCase() === authoritativeRaterEmail.toLowerCase() &&
        r.sections.some((s) => s.section === section && s.grade !== null),
    );
    const authoritativeResult = authoritative?.sections.find(
      (s) => s.section === section,
    );
    collapsed[section] = authoritativeResult ?? graded.reduce(worseResult);
  }
  return collapsed;
}
