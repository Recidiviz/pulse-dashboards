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

import type { LabelConfig } from "~@meetings/tasks/admin/label-studio-annotations";
import {
  type GradedDimensionKey,
  LS_SLOT_TO_DIMENSION,
} from "~@meetings/tasks/admin/label-studio-grades";
import type { LabelStudioResult } from "~@meetings/tasks/label-studio-client";

/** The grades a review can set; BAD is never a correction. */
export type OverrideGrade = "GOOD" | "PARTIAL";

/**
 * The annotation result with one dimension's grade replaced, every other entry
 * (other grades, notes) left as it was.
 *
 * The grade is stored as the choice's alias when it has one, which is what
 * Label Studio stores for new annotations and what decodeAnnotationResults
 * reads back. Throws when the labeling config has no field or choice for it,
 * rather than writing a result Label Studio or the decoder would not
 * understand.
 */
export function withOverriddenGrade({
  config,
  result,
  dimension,
  grade,
}: {
  config: LabelConfig;
  result: LabelStudioResult[];
  dimension: GradedDimensionKey;
  grade: OverrideGrade;
}): LabelStudioResult[] {
  const field = config.choiceFields.find(
    (f) => LS_SLOT_TO_DIMENSION[f.name] === dimension,
  );
  if (!field) {
    throw new Error(
      `The Label Studio labeling config has no grade field for "${dimension}"`,
    );
  }
  const choice = [...field.aliasByValue.values()].find((a) => a === grade);
  if (!choice) {
    throw new Error(
      `The Label Studio "${field.name}" field has no "${grade}" choice`,
    );
  }

  const replacement: LabelStudioResult = {
    from_name: field.name,
    to_name: field.toName,
    type: "choices",
    value: { choices: [choice] },
  };
  const existing = result.findIndex((r) => r.from_name === field.name);
  if (existing === -1) return [...result, replacement];
  return result.map((r, i) =>
    i === existing ? { ...replacement, to_name: r.to_name ?? field.toName } : r,
  );
}
