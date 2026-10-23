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

import { Temporal } from "temporal-polyfill";

import { CalendarRulesError } from "../errors";
import { MAX_YEAR, MIN_YEAR, toPlainDate } from "../plainDates";
import { DateRange } from "./types";

/**
 * Validates both ends of range and returns them in canonical form.
 *
 * Throws INVALID_DATE when either end isn't a real "YYYY-MM-DD" date, and
 * INVALID_DATE_RANGE when start is after end or either end is outside the
 * years MIN_YEAR to MAX_YEAR. Holiday sources loop over every year in the
 * range, so the year check keeps a mistyped year from running thousands of
 * lookups.
 */
export function parseDateRange(range: DateRange): DateRange {
  const start = toPlainDate(range.start);
  const end = toPlainDate(range.end);
  if (Temporal.PlainDate.compare(start, end) > 0) {
    throw new CalendarRulesError(
      "INVALID_DATE_RANGE",
      `Range start ${start} is after its end ${end}`,
    );
  }
  if (start.year < MIN_YEAR || end.year > MAX_YEAR) {
    throw new CalendarRulesError(
      "INVALID_DATE_RANGE",
      `Range ${start} to ${end} is outside the years ${MIN_YEAR} to ${MAX_YEAR}`,
    );
  }
  return { start: start.toString(), end: end.toString() };
}
