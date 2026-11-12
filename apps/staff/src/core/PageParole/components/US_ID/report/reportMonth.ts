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

// Report fields that hold a month store it as YYYY-MM, such as "2015-03".
// These helpers build dates from the year and month parts. Parsing "2015-03"
// with new Date() would give UTC midnight, which shows as the previous month
// in US time zones.

/** Returns the first day of a YYYY-MM month, at local midnight. */
export function parseReportMonth(month: string): Date {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1);
}

/** Returns the YYYY-MM month that a date falls in, in local time. */
export function toReportMonth(date: Date): string {
  return format(date, "yyyy-MM");
}

/** Returns a YYYY-MM month as the report shows it, such as "Mar 2015". */
export function formatReportMonth(month: string): string {
  return format(parseReportMonth(month), "MMM yyyy");
}
