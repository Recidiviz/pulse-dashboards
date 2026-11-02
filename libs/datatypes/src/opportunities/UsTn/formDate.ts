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

import { isExists } from "date-fns";

const MONTH_DAY_YEAR = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})$/;
const YEAR_MONTH_DAY = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

/** Returns a TN form date as YYYY-MM-DD, or undefined if it is not a real
 * month/day/year or ISO date. Shared by the CAF export and the form inputs. */
export function parseUsTnFormDate(
  input: string | undefined,
): string | undefined {
  const trimmed = input?.trim() ?? "";

  const monthDayYear = MONTH_DAY_YEAR.exec(trimmed);
  const yearMonthDay = YEAR_MONTH_DAY.exec(trimmed);

  let year: number, month: number, day: number;
  if (monthDayYear) {
    month = Number(monthDayYear[1]);
    day = Number(monthDayYear[2]);
    year = Number(monthDayYear[3]);
    if (monthDayYear[3].length === 2) year += 2000;
  } else if (yearMonthDay) {
    year = Number(yearMonthDay[1]);
    month = Number(yearMonthDay[2]);
    day = Number(yearMonthDay[3]);
  } else {
    return undefined;
  }

  // isExists counts months from 0
  if (!isExists(year, month - 1, day)) return undefined;

  return [
    String(year),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}
