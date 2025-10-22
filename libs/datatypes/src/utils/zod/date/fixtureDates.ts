// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import {
  add,
  addDays,
  differenceInCalendarMonths,
  differenceInDays,
  Duration,
  endOfMonth,
  formatISO,
  isFirstDayOfMonth,
  isLastDayOfMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

/**
 * dates in demo fixtures will be shifted relative to this date
 */
export const CURRENT_DATE_STRING_FIXTURE = "2021-12-16";
export const CURRENT_DATE_FIXTURE = parseISO(CURRENT_DATE_STRING_FIXTURE);

/**
 * Returns an ISO date string representing the "fixture current" date
 * plus the specified duration. Use negative values for past dates, and
 * positive values for future dates. Pass multiple difference objects and
 * they will be applied in order.
 */
export function relativeFixtureDate(...differences: Array<Duration>) {
  const finalDate = differences.reduce((date, difference) => {
    return add(date, difference);
  }, CURRENT_DATE_FIXTURE);

  return formatISO(finalDate, {
    representation: "date",
  });
}

/**
 * Returns an ISO date string representing the "fixture current" date
 * plus the specified duration and then adjusted to either the start or end
 * of the month as specified . Use negative values for past dates, and
 * positive values for future dates.
 */
export function relativeFixtureMonth(
  difference: Duration,
  endpoint: "start" | "end",
) {
  const baseDate = add(CURRENT_DATE_FIXTURE, difference);

  let finalDate: Date;

  switch (endpoint) {
    case "start":
      finalDate = startOfMonth(baseDate);
      break;
    case "end":
      finalDate = endOfMonth(baseDate);
      break;
  }

  return formatISO(finalDate, { representation: "date" });
}

/**
 * This class is functionally identical to Date, it just serves
 * to "brand" dates as already shifted for inspection at runtime
 */
class ShiftedDate extends Date {}

/**
 * Shifts a given date forward by the difference between the current date
 * and the static "current date" used for fixture data, bringing the dates
 * in fixtures up to date relative to today.
 */
export function shiftFixtureDate(storedDate: Date | ShiftedDate): ShiftedDate {
  if (storedDate instanceof ShiftedDate) return storedDate;

  let adjustedDate: Date;

  // special case for month starts and ends: align them to the month of the adjusted date
  if (isFirstDayOfMonth(storedDate) || isLastDayOfMonth(storedDate)) {
    // count by months instead of days to avoid off-by-one errors
    adjustedDate = subMonths(
      new Date(),
      // earlier stores dates are positive, later dates negative, which is why we subtract
      differenceInCalendarMonths(CURRENT_DATE_FIXTURE, storedDate),
    );

    adjustedDate = isFirstDayOfMonth(storedDate)
      ? startOfMonth(adjustedDate)
      : startOfDay(endOfMonth(adjustedDate));
  } else {
    // normal case: just calculate a day offset
    const offsetDays = differenceInDays(new Date(), CURRENT_DATE_FIXTURE);

    adjustedDate = addDays(storedDate, offsetDays);
  }

  return new ShiftedDate(adjustedDate);
}
