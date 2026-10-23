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
// and keep it out of index.ts. Browsers get holidays from the calendar API;
// exporting this from index.ts would pull date-holidays' data for every
// country into client bundles.

import { createDateHolidaysSource } from "./dateHolidaysSource";
import { staticHolidaySource } from "./staticHolidaySource";
import { HolidaySource } from "./types";

/**
 * Returns the holiday source for a calendar's holidayRegion column.
 *
 * Any region date-holidays knows, such as "US-CO", gets that region's public
 * weekday holidays, and null gets a source with no holidays. The region alone
 * picks the holidays, so no state needs code of its own here (D30). Any other
 * region throws INVALID_SETTINGS.
 */
export function getDefaultHolidaySource(
  holidayRegion: string | null,
): HolidaySource {
  if (holidayRegion === null) {
    return staticHolidaySource([], "none");
  }
  return createDateHolidaysSource(holidayRegion);
}
