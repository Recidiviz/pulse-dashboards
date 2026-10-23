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

import { toPlainDate } from "../plainDates";
import { parseDateRange } from "./dateRange";
import { Holiday, HolidaySource } from "./types";

/**
 * Returns a source that serves a fixed list of holidays, filtered to each
 * requested range and sorted by date.
 *
 * Throws INVALID_DATE when a holiday's date isn't a real "YYYY-MM-DD" date, so
 * a typo in a hand-kept list fails at startup rather than dropping a holiday.
 */
export function staticHolidaySource(
  holidays: readonly Holiday[],
  id = "static",
): HolidaySource {
  const sorted = holidays
    .map(({ date, name }) => ({ date: toPlainDate(date).toString(), name }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    id,
    getHolidays(range) {
      const { start, end } = parseDateRange(range);
      return sorted
        .filter(({ date }) => date >= start && date <= end)
        .map((holiday) => ({ ...holiday }));
    },
  };
}
