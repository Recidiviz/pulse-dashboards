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

import { parseDateRange } from "./dateRange";
import { DateRange, Holiday, HolidaySource } from "./types";

/**
 * Returns one row per holiday date within range, sorted by date.
 *
 * When the source has two holidays on one date, the row joins their names in
 * source order: "Christmas Day" and "Hanukkah" on 2027-12-25 become
 * "Christmas Day / Hanukkah".
 *
 * Throws INVALID_DATE when either end isn't a real date, and INVALID_DATE_RANGE
 * when start is after end.
 */
export function getHolidays(
  source: HolidaySource,
  range: DateRange,
): Holiday[] {
  const namesByDate = new Map<string, string[]>();
  for (const { date, name } of source.getHolidays(parseDateRange(range))) {
    const names = namesByDate.get(date);
    if (names) {
      names.push(name);
    } else {
      namesByDate.set(date, [name]);
    }
  }
  return [...namesByDate]
    .map(([date, names]) => ({ date, name: names.join(" / ") }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
