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
  differenceInDays,
  Duration,
  formatISO,
  parseISO,
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

  const offsetDays = differenceInDays(new Date(), CURRENT_DATE_FIXTURE);
  return new ShiftedDate(addDays(storedDate, offsetDays));
}
