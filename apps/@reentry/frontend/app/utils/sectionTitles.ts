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

// Non-actionable sections that appear in every plan but carry no resources.
// Matched case-insensitively against the start of each H1 title.
const NON_ACTIONABLE_PREFIXES = [
  "overview",
  "immediate need",
  "quick summary of circumstances",
];

const isActionable = (title: string) => {
  const lower = title.toLowerCase();
  return !NON_ACTIONABLE_PREFIXES.some((prefix) => lower.startsWith(prefix));
};

/**
 * Parses H1 headings from a markdown string and returns them as an ordered list
 * of actionable section titles, excluding fixed non-actionable sections
 * (overview, immediate need, quick summary of circumstances, etc.).
 *
 * Example:
 *   getSectionTitles("# Immediate Need\n\n...\n# Housing Stability")
 *   // => ["Housing Stability"]
 */
export const getSectionTitles = (markdown: string): string[] =>
  markdown
    .split("\n")
    .filter((line) => line.startsWith("# "))
    .map((line) => line.slice(2).trim())
    .filter(isActionable);
