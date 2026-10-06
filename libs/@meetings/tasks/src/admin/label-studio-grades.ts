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

import type { DecodedField } from "~@meetings/tasks/admin/label-studio-annotations";

// =============================================================================
// Turning decoded Label Studio annotations into per-dimension grades.
//
// Pure functions only — no Prisma, no network. Everything here feeds the
// decision "is this meeting flagged, and on which dimension", which is why
// it lives in the tasks lib rather than next to the route that consumes it.
// =============================================================================

export type Grade = "GOOD" | "PARTIAL" | "BAD";

/** Label Studio also allows N/A ("audio too unclear to judge") — human-only, no LLMAJ equivalent. */
export type HumanGrade = Grade | "N/A";

/** The three dimensions with a grade on both sides (LLMAJ score + LS choice field). */
export const GRADED_DIMENSIONS = [
  { key: "overall", label: "Overall" },
  { key: "caseNote", label: "Case Note" },
  { key: "actionItems", label: "Action Items" },
] as const;

export type GradedDimensionKey = (typeof GRADED_DIMENSIONS)[number]["key"];

export type GradesByDimension = Partial<Record<GradedDimensionKey, HumanGrade>>;

// Ranks a grade worst-to-best for picking the worst of several dimensions on
// one meeting/annotation; higher = worse. N/A ("audio too unclear to judge")
// isn't a quality signal, so it ranks below GOOD — a real BAD/PARTIAL
// elsewhere still wins out over it.
const GRADE_SEVERITY: Record<HumanGrade, number> = {
  BAD: 3,
  PARTIAL: 2,
  GOOD: 1,
  "N/A": 0,
};

export function worstGrade<T extends HumanGrade>(
  ...grades: (T | undefined)[]
): T | undefined {
  let worst: T | undefined;
  for (const g of grades) {
    if (g && (!worst || GRADE_SEVERITY[g] > GRADE_SEVERITY[worst])) worst = g;
  }
  return worst;
}

// A meeting/task with multiple Label Studio raters collapses to one human
// grade per dimension: worst case wins across raters, except this rater's
// grade is authoritative and overrides everyone else's on that dimension
// outright — a BAD grade this rater has since overridden away doesn't flag a
// meeting on its own.
export const LS_AUTHORITATIVE_RATER_EMAIL = "admin@recidiviz.org";

/** `from_name` choice slot -> the dimension it grades (see the label-studio-evaluation-setup config slots). */
export const LS_SLOT_TO_DIMENSION: Record<string, GradedDimensionKey> = {
  overall_grade: "overall",
  case_note_accuracy: "caseNote",
  action_items_accuracy: "actionItems",
};

export const LS_TRANSCRIPT_QUALITY_FIELD_NAME = "transcript_quality";

// Excluded from Label Studio flagging entirely — mirrors the LLMAJ side's
// exclusion of transcriptComparison from LLMAJ_TRIGGER_KEYS: a transcript
// quality signal, not a notetaking-quality one, and the authoritative rater
// typically doesn't re-grade it at all when overriding case note/action
// items, so it has no override to win against. A BAD grade here alone never
// flags a meeting on its own, though it's still shown on the card for
// context on any meeting that IS flagged for some other reason.
export const LS_NON_TRIGGER_FIELDS: ReadonlySet<string> = new Set([
  LS_TRANSCRIPT_QUALITY_FIELD_NAME,
]);

/**
 * Whether a BAD grade on this field flags a meeting all by itself.
 *
 * The graded dimensions go through collapseTaskGrades instead, where the
 * authoritative rater can override them. Fields in LS_NON_TRIGGER_FIELDS never
 * flag anything. Anything else is a slot added to the labeling config since
 * this code was written: treat a BAD there as a flag rather than ignoring a
 * signal nobody has taught us to read yet.
 */
export function isUncoveredBadGrade(field: DecodedField): boolean {
  return (
    field.value === "BAD" &&
    !(field.fromName in LS_SLOT_TO_DIMENSION) &&
    !LS_NON_TRIGGER_FIELDS.has(field.fromName)
  );
}

function isHumanGrade(value: string): value is HumanGrade {
  return (
    value === "GOOD" ||
    value === "PARTIAL" ||
    value === "BAD" ||
    value === "N/A"
  );
}

export function decodedFieldsToGrades(
  decodedFields: DecodedField[],
): GradesByDimension {
  const grades: GradesByDimension = {};
  for (const field of decodedFields) {
    const dim = LS_SLOT_TO_DIMENSION[field.fromName];
    if (!dim) continue;
    if (isHumanGrade(field.value)) {
      grades[dim] = field.value;
    }
  }
  // Some annotations have no overall grade at all — e.g. predating the
  // "overall" field's addition to the LS config, or a rater skipping it.
  // Without this, such a meeting drops out of the Overall breakdown entirely
  // even though it may still be flagged via a BAD case note/action items
  // grade. Per the rater instructions ("overall" is the worst-graded
  // dimension), reconstruct it as the worst of case note / action items
  // whenever at least one of those was actually graded.
  if (!grades.overall) {
    const reconstructed = worstGrade(grades.caseNote, grades.actionItems);
    if (reconstructed) grades.overall = reconstructed;
  }
  return grades;
}

// =============================================================================
// KNOWN BUG: LS tasks synced with blank action items
//
// buildLabelStudioTask kept reading the deprecated Meeting.structuredActionItems
// column after action items moved to MeetingActionItem rows (migration
// 20260609120000, ~2026-06-09). Every LS task synced in that window had
// `action_items: null`, so raters graded the action items field blind, and per
// the rater instructions ("overall" is the worst-graded dimension), those
// meetings also picked up a bogus BAD/PARTIAL overall grade purely from
// grading an empty field. 110 of the 326 prod tasks with completed
// annotations were affected (LS task ids 5485-5922).
//
// Fixed by #15137 (d3cf35ec99), deployed to production 2026-08-20 15:16 PT.
//
// Blankness alone does NOT identify the bug, because formatLabelStudioActionItems
// legitimately returns null for a meeting that generated no action items. So a
// blank field is only treated as "graded blind" for annotations created before
// the fix shipped; after that, blank means the meeting genuinely had none and
// the rater's grade stands.
// =============================================================================

/**
 * When the blank-`action_items` bug stopped producing new blind gradings: the
 * production deploy of #15137, not its merge. Annotations created at or after
 * this instant graded whatever the task actually showed them.
 */
export const BLANK_ACTION_ITEMS_FIXED_AT = new Date("2026-08-20T22:16:00Z");

/**
 * Mirrors patch-label-studio-tasks.ts's isEmptyActionItems: action items have
 * been both strings and lists at different points in time, so check emptiness
 * for both.
 */
export function isEmptyActionItems(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Whether this annotation graded an action-items field that was blank because
 * of the bug above, rather than because the meeting produced no action items.
 * Both conditions are required — see the KNOWN BUG block.
 */
export function wasActionItemsGradedBlind({
  taskActionItems,
  annotationCreatedAt,
}: {
  /** The task's *current* `data.action_items` value. */
  taskActionItems: unknown;
  annotationCreatedAt: Date;
}): boolean {
  return (
    annotationCreatedAt < BLANK_ACTION_ITEMS_FIXED_AT &&
    isEmptyActionItems(taskActionItems)
  );
}

/**
 * The *evaluation* view of a decoded annotation that {@link wasActionItemsGradedBlind}
 * flagged: the action-items dimension (grade + any notes sharing its `toName`)
 * is excluded, and "overall" is overwritten to match the case note grade, as
 * if action items had never been evaluated for this meeting.
 *
 * Exception: if the rater's original overall was BAD *and* they also graded
 * the transcript BAD, the BAD overall is plausibly explained by the transcript
 * issue rather than by blindly grading the empty action-items field, so it's
 * left as BAD rather than recomputed away — otherwise a meeting with a
 * genuinely bad transcript could silently disappear from the flagged list
 * just for landing in the bug window.
 *
 * Used only to compute grades and flagging; the caller keeps the original
 * decodedFields (action items included) for display, marked as ignored so
 * it's clear why a BAD action-items grade didn't flag the meeting. A no-op
 * (evaluatedFields === the input, ignoredFromName null) if the annotation has
 * no action-items field to begin with.
 */
export function stripBlindActionItemsGrading(decodedFields: DecodedField[]): {
  evaluatedFields: DecodedField[];
  ignoredFromName: string | null;
} {
  const actionItemsField = decodedFields.find(
    (f) => LS_SLOT_TO_DIMENSION[f.fromName] === "actionItems",
  );
  if (!actionItemsField) {
    return { evaluatedFields: decodedFields, ignoredFromName: null };
  }

  const caseNoteField = decodedFields.find(
    (f) => LS_SLOT_TO_DIMENSION[f.fromName] === "caseNote",
  );
  const overallField = decodedFields.find(
    (f) => LS_SLOT_TO_DIMENSION[f.fromName] === "overall",
  );
  const transcriptField = decodedFields.find(
    (f) => f.fromName === LS_TRANSCRIPT_QUALITY_FIELD_NAME,
  );
  const overallCorroboratedByBadTranscript =
    overallField?.value === "BAD" && transcriptField?.value === "BAD";

  const isActionItemsField = (f: DecodedField) =>
    f.fromName === actionItemsField.fromName ||
    (actionItemsField.toName !== "unknown" &&
      f.toName === actionItemsField.toName);

  const evaluatedFields = decodedFields
    .filter((f) => !isActionItemsField(f))
    .map((f) =>
      !overallCorroboratedByBadTranscript &&
      caseNoteField &&
      LS_SLOT_TO_DIMENSION[f.fromName] === "overall"
        ? { ...f, value: caseNoteField.value }
        : f,
    );

  return { evaluatedFields, ignoredFromName: actionItemsField.fromName };
}

/** One rater's grades on one task. */
export interface RaterAnnotationGrades {
  raterEmail: string;
  grades: GradesByDimension;
}

/**
 * Collapse one task's annotations to a single grade per dimension: the
 * authoritative rater's grade wins outright on any dimension they graded,
 * otherwise the worst grade across raters wins. Used to decide whether a task
 * flags a meeting at all, so a BAD grade an admin review has since overridden
 * away doesn't flag it on its own.
 */
export function collapseTaskGrades(
  annotations: RaterAnnotationGrades[],
): GradesByDimension {
  const collapsed: GradesByDimension = {};
  for (const { key } of GRADED_DIMENSIONS) {
    const authoritative = annotations.find(
      (a) =>
        a.raterEmail.toLowerCase() ===
          LS_AUTHORITATIVE_RATER_EMAIL.toLowerCase() && a.grades[key],
    );
    const worst = authoritative
      ? authoritative.grades[key]
      : worstGrade(...annotations.map((a) => a.grades[key]));
    if (worst) collapsed[key] = worst;
  }
  return collapsed;
}

/**
 * Whether a task's human grades alone flag its meeting.
 *
 * Mirrors the LLMAJ side: a BAD case note, action items or overall flags. A
 * BAD grade on a slot this code doesn't know about flags regardless — see
 * isUncoveredBadGrade.
 *
 * The grades passed in are the collapsed ones, so a BAD that the authoritative
 * rater has since overridden away no longer flags the meeting on its own.
 */
export function isFlaggedByLabelStudio(
  collapsed: GradesByDimension,
  hasUncoveredBadGrade: boolean,
): boolean {
  return (
    hasUncoveredBadGrade ||
    collapsed.caseNote === "BAD" ||
    collapsed.actionItems === "BAD" ||
    collapsed.overall === "BAD"
  );
}
