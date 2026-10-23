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

// Server-only, like defaultHolidaySource.ts.
// date-holidays bundles holiday data for every country and pulls in
// moment-timezone, so this file must stay out of index.ts and client bundles.

import Holidays from "date-holidays";

import { CalendarRulesError } from "../errors";
import { toPlainDate } from "../plainDates";
import { parseDateRange } from "./dateRange";
import { Holiday, HolidaySource } from "./types";

// The exact version pinned in the root package.json, so the source id names
// the data that produced a holiday list. A test fails if the two drift.
const DATE_HOLIDAYS_VERSION = "3.37.0";

// "US" or "US-CO": an ISO 3166-1 country code, optionally followed by an
// ISO 3166-2 subdivision code. date-holidays accepts lowercase codes and
// silently ignores a subdivision it doesn't know, so the source checks the
// region itself rather than serving the wrong holidays.
const REGION_PATTERN = /^([A-Z]{2})(?:-([A-Z0-9]{1,3}))?$/;

// date-holidays words some US holiday names differently from Colorado DHR's
// published list, which is the wording editors know.
const RENAMES: Readonly<Record<string, string>> = {
  "Washington-Lincoln Day": "Presidents' Day",
};
const SUBSTITUTE_SUFFIX = " (substitute day)";
const OBSERVED_SUFFIX = " (observed)";

function displayName(name: string): string {
  const renamed = RENAMES[name] ?? name;
  return renamed.endsWith(SUBSTITUTE_SUFFIX)
    ? renamed.slice(0, -SUBSTITUTE_SUFFIX.length) + OBSERVED_SUFFIX
    : renamed;
}

/**
 * Returns a source that computes public holidays for holidayRegion, such as
 * "US-CO", with the date-holidays package (RFC B).
 *
 * Only holidays of type "public" count, so observances such as Columbus Day
 * and optional days such as Christmas Eve are left out. Holidays that fall on
 * a Saturday or Sunday are dropped too: date-holidays also returns the weekday
 * they're observed on, named with " (observed)", and that's the day offices
 * close. For US-CO this matches the DHR list in dhrHolidays.ts.
 *
 * Throws INVALID_SETTINGS when holidayRegion isn't an uppercase "CC" or
 * "CC-SUB" code that date-holidays knows.
 */
export function createDateHolidaysSource(holidayRegion: string): HolidaySource {
  const match = REGION_PATTERN.exec(holidayRegion);
  const [, country, state] = match ?? [];
  const catalog = new Holidays();
  if (
    !country ||
    !catalog.getCountries()[country] ||
    (state !== undefined && !catalog.getStates(country)?.[state])
  ) {
    throw new CalendarRulesError(
      "INVALID_SETTINGS",
      `No holiday source covers holidayRegion ${JSON.stringify(holidayRegion)}`,
    );
  }
  const holidays = new Holidays(country, state);

  return {
    id: `date-holidays@${DATE_HOLIDAYS_VERSION}:${holidayRegion}`,
    getHolidays(range) {
      const { start, end } = parseDateRange(range);
      const result: Holiday[] = [];
      for (
        let year = toPlainDate(start).year;
        year <= toPlainDate(end).year;
        year++
      ) {
        for (const holiday of holidays.getHolidays(year)) {
          // date is a local "YYYY-MM-DD hh:mm:ss" string in the region's time
          // zone. holiday.start is the same moment as a Date instant, whose
          // calendar day depends on the host's time zone.
          const date = holiday.date.slice(0, 10);
          if (
            holiday.type === "public" &&
            date >= start &&
            date <= end &&
            toPlainDate(date).dayOfWeek <= 5
          ) {
            result.push({ date, name: displayName(holiday.name) });
          }
        }
      }
      return result.sort((a, b) => a.date.localeCompare(b.date));
    },
  };
}
