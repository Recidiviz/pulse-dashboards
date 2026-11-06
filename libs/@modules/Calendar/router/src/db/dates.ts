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

import { IsoDate, parseIsoDate } from "~@modules/Calendar/rules";

/**
 * Converts a "YYYY-MM-DD" date to the Date that Prisma writes to a @db.Date
 * column: UTC midnight on that day. Throws INVALID_DATE for anything that
 * isn't a real date.
 */
export function toDbDate(iso: IsoDate): Date {
  return new Date(`${parseIsoDate(iso)}T00:00:00.000Z`);
}

/**
 * Converts a Date read from a @db.Date column back to "YYYY-MM-DD". Prisma
 * returns those columns as UTC midnight, so the UTC date is the stored date
 * whatever the host time zone is.
 */
export function fromDbDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}
