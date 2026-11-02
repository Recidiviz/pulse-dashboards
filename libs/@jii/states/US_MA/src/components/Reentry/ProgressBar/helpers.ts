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

/**
 * Returns completed as a whole-number percent of total, kept between 0 and 100.
 * Returns 0 when total is 0.
 */
export function getProgressPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  const percent = Math.round((completed / total) * 100);
  return Math.min(Math.max(percent, 0), 100);
}

export type SectionedProgress = {
  sectionIndex: number;
  sectionCount: number;
  stepIndex: number;
  stepCount: number;
};

/**
 * Returns the percent complete, counting each earlier section as done and the
 * current section as done up to the current step.
 *
 * Each section is an equal share of the bar, however many steps it has, so the
 * bar lines up with a "Section 3 of 7" label. Within the current section, each
 * step fills an equal part of that share. For example, on step 2 of 2 in
 * section 3 of 7, two sections are done and half of the third, so the bar
 * shows (2 + 1/2) / 7 = 36%.
 *
 * The current step counts as not yet done, so the first step shows 0% and the
 * last step stays below 100%.
 */
export function getSectionedProgressPercent({
  sectionIndex,
  sectionCount,
  stepIndex,
  stepCount,
}: SectionedProgress): number {
  const sectionsDone = sectionIndex + stepIndex / stepCount;
  return getProgressPercent(sectionsDone, sectionCount);
}
