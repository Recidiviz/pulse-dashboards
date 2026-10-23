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

import dateHolidaysPackage from "date-holidays/package.json";

import { createDateHolidaysSource } from "./dateHolidaysSource";
import { DHR_HOLIDAYS } from "./dhrHolidays";

function rulesError(code: string) {
  return expect.objectContaining({ name: "CalendarRulesError", code });
}

describe("createDateHolidaysSource", () => {
  const coSource = createDateHolidaysSource("US-CO");

  it("matches the DHR holiday list for 2026-01-01 to 2027-06-30", () => {
    expect(
      coSource.getHolidays({ start: "2026-01-01", end: "2027-06-30" }),
    ).toEqual(DHR_HOLIDAYS);
  });

  it.each([
    ["2026-07-04", "the actual Independence Day, a Saturday"],
    ["2026-10-12", "Columbus Day, an observance"],
    ["2026-11-27", "the Day after Thanksgiving, an observance"],
    ["2026-12-24", "Christmas Eve, an optional holiday"],
    ["2027-06-19", "the actual Juneteenth, a Saturday"],
  ])("leaves out %s, %s", (date) => {
    expect(coSource.getHolidays({ start: date, end: date })).toEqual([]);
  });

  it("computes holidays past the DHR list (pending DHR FY 2027-28)", () => {
    expect(
      coSource.getHolidays({ start: "2027-07-01", end: "2027-12-31" }),
    ).toEqual([
      { date: "2027-07-05", name: "Independence Day (observed)" },
      { date: "2027-09-06", name: "Labor Day" },
      { date: "2027-10-04", name: "Frances Xavier Cabrini Day" },
      { date: "2027-11-11", name: "Veterans Day" },
      { date: "2027-11-25", name: "Thanksgiving Day" },
      { date: "2027-12-24", name: "Christmas Day (observed)" },
      { date: "2027-12-31", name: "New Year's Day (observed)" },
    ]);
  });

  it("keeps holidays on both ends of the range", () => {
    expect(
      coSource.getHolidays({ start: "2026-12-25", end: "2027-01-01" }),
    ).toEqual([
      { date: "2026-12-25", name: "Christmas Day" },
      { date: "2027-01-01", name: "New Year's Day" },
    ]);
  });

  it("names the installed package version and the region in its id", () => {
    expect(dateHolidaysPackage.version).toBe("3.37.0");
    expect(coSource.id).toBe("date-holidays@3.37.0:US-CO");
  });

  it("serves another state's holidays from its region alone", () => {
    const columbusDay = { start: "2026-10-12", end: "2026-10-12" };

    expect(createDateHolidaysSource("US-TX").getHolidays(columbusDay)).toEqual([
      { date: "2026-10-12", name: "Columbus Day" },
    ]);
    expect(coSource.getHolidays(columbusDay)).toEqual([]);
  });

  it("rejects an invalid range", () => {
    expect(() =>
      coSource.getHolidays({ start: "2026-02-01", end: "2026-01-01" }),
    ).toThrow(rulesError("INVALID_DATE_RANGE"));
  });

  it.each([
    [{ start: "1999-12-31", end: "2026-01-01" }],
    [{ start: "2026-01-01", end: "5001-01-01" }],
    [{ start: "2026-01-01", end: "9999-12-31" }],
  ])(
    "throws INVALID_DATE_RANGE for %j, outside the years 2000 to 5000",
    (range) => {
      expect(() => coSource.getHolidays(range)).toThrow(
        rulesError("INVALID_DATE_RANGE"),
      );
    },
  );

  it("accepts a range that ends in 5000", () => {
    expect(
      coSource.getHolidays({ start: "5000-12-25", end: "5000-12-31" }),
    ).toEqual([{ date: "5000-12-25", name: "Christmas Day" }]);
  });

  it.each(["us-co", "US-ZZ", "ZZ", "US-", "US-CO-X", ""])(
    "throws INVALID_SETTINGS for the region %j",
    (region) => {
      expect(() => createDateHolidaysSource(region)).toThrow(
        rulesError("INVALID_SETTINGS"),
      );
    },
  );
});
