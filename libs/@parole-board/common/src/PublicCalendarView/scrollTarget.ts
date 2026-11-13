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

import type { PublicCalendarMonth } from "./types";

/**
 * The day a narrow screen scrolls into view when a month opens, so the
 * horizontally scrolling grid starts on the days that matter. In the current
 * month that's today, which brings this week's row and today's column into
 * view. In any other month it's the first day with sessions, which skips the
 * empty Sunday column. Null when the month has neither, and nothing scrolls.
 *
 * @param today "YYYY-MM-DD" in the calendar's time zone.
 */
export function initialScrollDate(
  month: PublicCalendarMonth,
  today: string,
): string | null {
  if (month.days.some((day) => day.date === today)) return today;
  return month.days.find((day) => day.entries.length > 0)?.date ?? null;
}
