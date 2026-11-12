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

import { addMonths, YearMonth } from "~@modules/Calendar/rules";

/**
 * How many months after the current one the Add month modal offers: the next
 * 12, as the Public Calendar spec says.
 */
export const ADD_MONTHS_AHEAD = 12;

/**
 * Returns the months the Add month modal may offer: the current month and the
 * next ADD_MONTHS_AHEAD months, in ascending order. The current month is in
 * the window so an empty calendar can start with it; once it exists, the
 * options are exactly the next 12, as in the spec.
 */
export function addMonthWindow(current: YearMonth): YearMonth[] {
  return Array.from({ length: ADD_MONTHS_AHEAD + 1 }, (_, i) =>
    addMonths(current, i),
  );
}

/**
 * Returns the window's months that don't exist yet, in ascending order. With
 * October 2026 current and October 2026 existing, that's November 2026 to
 * October 2027.
 */
export function addMonthOptions(
  current: YearMonth,
  existing: readonly YearMonth[],
): YearMonth[] {
  const taken = new Set(existing.map(({ year, month }) => `${year}-${month}`));
  return addMonthWindow(current).filter(
    ({ year, month }) => !taken.has(`${year}-${month}`),
  );
}
