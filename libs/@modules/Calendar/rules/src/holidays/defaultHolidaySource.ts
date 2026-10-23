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

// Server-only. Import it through ~@modules/Calendar/rules/holidays/defaultHolidaySource,
// and keep it out of index.ts. Browsers get holidays from the calendar API, and
// once CO-851 switches this module to date-holidays, exporting it from index.ts
// would pull that package's holiday data for every country into client bundles.

import { CalendarRulesError } from "../errors";
import { DHR_HOLIDAYS } from "./dhrHolidays";
import { staticHolidaySource } from "./staticHolidaySource";
import { HolidaySource } from "./types";

/**
 * Returns the holiday source for a calendar's holidayRegion column.
 *
 * "US-CO" gets the static DHR list for 2026-01-01 to 2027-06-30, and null gets
 * a source with no holidays. Any other region throws INVALID_SETTINGS, because
 * no source covers it.
 *
 * The US-CO source is a stopgap: CO-851 replaces it with date-holidays 3.37.0
 * (RFC B). Until then, dates after 2027-06-30 get no holidays, so drafts for
 * July 2027 or later show no holiday flags.
 */
export function getDefaultHolidaySource(
  holidayRegion: string | null,
): HolidaySource {
  if (holidayRegion === null) {
    return staticHolidaySource([], "none");
  }
  if (holidayRegion === "US-CO") {
    return staticHolidaySource(
      DHR_HOLIDAYS,
      "dhr-static:2026-01-01..2027-06-30",
    );
  }
  throw new CalendarRulesError(
    "INVALID_SETTINGS",
    `No holiday source covers holidayRegion ${JSON.stringify(holidayRegion)}`,
  );
}
