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

import { differenceInCalendarDays, isBefore, startOfDay } from "date-fns";

export type ObjectiveDueStatus = "overdue" | "dueSoon";

/**
 * Classifies an objective's end date relative to `now`:
 * - `"overdue"` when the date falls before the start of `now`'s day,
 * - `"dueSoon"` when the date is today or within the next 7 calendar days,
 * - `null` otherwise (further out, or no date).
 *
 * `now` defaults to the current time; callers (e.g. examples / tests) can pin
 * it for deterministic output.
 */
export function getObjectiveDueStatus(
  endDate: Date | null | undefined,
  now: Date = new Date(),
): ObjectiveDueStatus | null {
  if (!endDate) return null;

  const startOfToday = startOfDay(now);
  if (isBefore(endDate, startOfToday)) return "overdue";

  const daysUntilDue = differenceInCalendarDays(endDate, startOfToday);
  if (daysUntilDue <= 7) return "dueSoon";

  return null;
}
