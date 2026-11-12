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

import type { YearMonthOption } from "~@parole-board/common";

import { toYearMonthParam } from "./month";

/**
 * The public calendar's page for a month, such as
 * "https://public-calendar.test/2026-09" for September 2026, or null when
 * there's no valid address to build it on. The public site takes the month as
 * "YYYY-MM" in its path, as the admin does.
 *
 * Args:
 *   publicCalendarUrl: The public calendar site's address, from the host's
 *     publicCalendarUrl. The staff app reads it from the build env value
 *     VITE_US_CO_PUBLIC_CALENDAR_URL, which differs per environment. It must
 *     be an https:// origin, with no path, query, hash or credentials;
 *     anything else, or no value, gives null.
 *   yearMonth: The month to link to.
 */
export function publicMonthUrl(
  publicCalendarUrl: string | undefined,
  yearMonth: YearMonthOption,
): string | null {
  if (!publicCalendarUrl) return null;
  let base: URL;
  try {
    base = new URL(publicCalendarUrl);
  } catch {
    return null;
  }
  if (base.protocol !== "https:" || base.href !== `${base.origin}/`) {
    return null;
  }
  return new URL(toYearMonthParam(yearMonth), base).href;
}
