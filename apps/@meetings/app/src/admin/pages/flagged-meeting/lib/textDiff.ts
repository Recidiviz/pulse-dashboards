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

import { diffWordsWithSpace } from "diff";

export type TextDiffPart = {
  value: string;
  type: "unchanged" | "added" | "removed";
};

export interface TextDiffResult {
  parts: TextDiffPart[];
  /** True when the inputs were too long to diff and are shown side by side instead. */
  tooLarge: boolean;
}

/**
 * Above this many characters on either side, skip the diff. Word diffing is
 * superlinear in the worst case, and a case note long enough to matter here is
 * one nobody reads as a diff anyway — better to show both versions than to
 * lock up the tab.
 */
const MAX_DIFF_CHARS = 40_000;

/**
 * Word-level diff between the generated case note and the staff member's
 * edited version, for showing what they changed.
 */
export function diffText(before: string, after: string): TextDiffResult {
  if (before.length > MAX_DIFF_CHARS || after.length > MAX_DIFF_CHARS) {
    return { parts: [], tooLarge: true };
  }

  const parts = diffWordsWithSpace(before, after).map((change) => {
    let type: TextDiffPart["type"] = "unchanged";
    if (change.added) type = "added";
    else if (change.removed) type = "removed";
    return { value: change.value, type };
  });

  return { parts, tooLarge: false };
}
