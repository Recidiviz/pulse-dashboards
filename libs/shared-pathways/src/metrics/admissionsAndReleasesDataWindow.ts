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

import { format } from "date-fns";

const ALL_YEARS = "ALL";
const MONTH_LABEL_PATTERN = "MMM yyyy";
const UPLOAD_DATE_PATTERN = "MMM d, yyyy";

/**
 * Returns copy saying when the data was last uploaded, such as "Data last
 * updated Oct 1, 2026", or undefined before the metric has loaded.
 */
export function formatUploadDateLabel(lastUpdated?: Date): string | undefined {
  if (!lastUpdated) return undefined;
  return `Data last updated ${format(lastUpdated, UPLOAD_DATE_PATTERN)}`;
}

/** Returns "Jan 2023" for the month key "2023-01". */
function formatMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return format(new Date(year, month - 1, 1), MONTH_LABEL_PATTERN);
}

/**
 * Returns the first and last month the reader's data covers, as a label such
 * as "Jan 2023 - Dec 2025", or undefined when no movement date falls in the
 * selected years. A reader who selects no particular years sees every year.
 *
 * @param movementDates ISO dates ("2024-02-17") the backend has data for
 * @param selectedYears the calendar year filter values, e.g. ["2024", "ALL"]
 */
export function formatDataWindowLabel(
  movementDates: readonly string[],
  selectedYears: readonly string[],
): string | undefined {
  const includesEveryYear =
    !selectedYears.length || selectedYears.includes(ALL_YEARS);

  // An ISO date's first seven characters are its "YYYY-MM" month, which sorts
  // in date order as plain text.
  const monthKeys = movementDates
    .filter(
      (date) => includesEveryYear || selectedYears.includes(date.slice(0, 4)),
    )
    .map((date) => date.slice(0, 7))
    .sort();

  if (!monthKeys.length) return undefined;

  const first = formatMonthKey(monthKeys[0]);
  const last = formatMonthKey(monthKeys[monthKeys.length - 1]);
  return first === last ? first : `${first} - ${last}`;
}
