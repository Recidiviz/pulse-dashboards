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

import { getDefaultHolidaySource } from "./defaultHolidaySource";
import { getHolidays } from "./getHolidays";

function rulesError(code: string) {
  return expect.objectContaining({ name: "CalendarRulesError", code });
}

const DHR_RANGE = { start: "2026-01-01", end: "2027-06-30" };

describe("getDefaultHolidaySource", () => {
  it("serves the DHR holiday table for US-CO", () => {
    const source = getDefaultHolidaySource("US-CO");

    expect(source.id).toBe("dhr-static:2026-01-01..2027-06-30");
    expect(getHolidays(source, DHR_RANGE)).toEqual([
      { date: "2026-01-01", name: "New Year's Day" },
      { date: "2026-01-19", name: "Martin Luther King Jr. Day" },
      { date: "2026-02-16", name: "Presidents' Day" },
      { date: "2026-05-25", name: "Memorial Day" },
      { date: "2026-06-19", name: "Juneteenth" },
      { date: "2026-07-03", name: "Independence Day (observed)" },
      { date: "2026-09-07", name: "Labor Day" },
      { date: "2026-10-05", name: "Frances Xavier Cabrini Day" },
      { date: "2026-11-11", name: "Veterans Day" },
      { date: "2026-11-26", name: "Thanksgiving Day" },
      { date: "2026-12-25", name: "Christmas Day" },
      { date: "2027-01-01", name: "New Year's Day" },
      { date: "2027-01-18", name: "Martin Luther King Jr. Day" },
      { date: "2027-02-15", name: "Presidents' Day" },
      { date: "2027-05-31", name: "Memorial Day" },
      { date: "2027-06-18", name: "Juneteenth (observed)" },
    ]);
  });

  it("serves no holidays when the calendar has no region", () => {
    const source = getDefaultHolidaySource(null);

    expect(source.id).toBe("none");
    expect(getHolidays(source, DHR_RANGE)).toEqual([]);
  });

  it.each(["US-TX", "us-co", ""])(
    "throws INVALID_SETTINGS for the region %j",
    (region) => {
      expect(() => getDefaultHolidaySource(region)).toThrow(
        rulesError("INVALID_SETTINGS"),
      );
    },
  );
});
