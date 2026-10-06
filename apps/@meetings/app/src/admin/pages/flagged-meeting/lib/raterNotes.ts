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

import type { FlaggedMeetingDetails } from "~@meetings/app/admin/api/flaggedMeetings";

type Rater = NonNullable<
  FlaggedMeetingDetails["labelStudio"]
>["raters"][number];
type Field = Rater["fields"][number];

/** The Label Studio choice slot behind each graded dimension. */
const GRADE_SLOTS = [
  {
    label: "Overall",
    fromName: "overall_grade",
    grade: (r: Rater) => r.grades.overall,
  },
  {
    label: "Case note",
    fromName: "case_note_accuracy",
    grade: (r: Rater) => r.grades.caseNote,
  },
  {
    label: "Action items",
    fromName: "action_items_accuracy",
    grade: (r: Rater) => r.grades.actionItems,
  },
  {
    label: "Transcript",
    fromName: "transcript_quality",
    grade: (r: Rater) => r.transcriptGrade,
  },
];

export type RaterItem = {
  label: string;
  grade: string | null;
  notes: string[];
};

// Choice fields decode to a short alias such as BAD or N/A; anything else is a
// free-text note.
function isGradeLike(value: string): boolean {
  return value === "N/A" || (/^[A-Z_]+$/.test(value) && value.length <= 20);
}

const isNote = (field: Field) =>
  field.value.length > 0 && !isGradeLike(field.value);

/**
 * One item per dimension the rater graded, carrying the notes that share the
 * grade field's target, plus a General notes item for notes attached to
 * nothing graded.
 */
export function buildRaterItems(rater: Rater): RaterItem[] {
  const noteFields = rater.fields.filter(isNote);
  const claimed = new Set<Field>();
  const items: RaterItem[] = [];

  for (const slot of GRADE_SLOTS) {
    const grade = slot.grade(rater);
    if (!grade) continue;
    const gradeField = rater.fields.find((f) => f.fromName === slot.fromName);
    const notes = noteFields.filter(
      (f) => gradeField && f.toName === gradeField.toName && !claimed.has(f),
    );
    notes.forEach((f) => claimed.add(f));
    items.push({ label: slot.label, grade, notes: notes.map((f) => f.value) });
  }

  const general = noteFields.filter((f) => !claimed.has(f));
  if (general.length > 0) {
    items.push({
      label: "General notes",
      grade: null,
      notes: general.map((f) => f.value),
    });
  }
  return items;
}
