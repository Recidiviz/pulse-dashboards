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

import { DHR_HOLIDAYS } from "./dhrHolidays";
import { getHolidays } from "./getHolidays";
import { staticHolidaySource } from "./staticHolidaySource";
import { HolidaySource } from "./types";

function rulesError(code: string) {
  return expect.objectContaining({ name: "CalendarRulesError", code });
}

const dhr = staticHolidaySource(DHR_HOLIDAYS, "dhr");

describe("getHolidays", () => {
  it("returns only Labor Day for September 2026", () => {
    expect(
      getHolidays(dhr, { start: "2026-09-01", end: "2026-09-30" }),
    ).toEqual([{ date: "2026-09-07", name: "Labor Day" }]);
  });

  it("joins the names of two holidays on one date into one row", () => {
    const source = staticHolidaySource([
      { date: "2027-12-25", name: "Christmas Day" },
      { date: "2027-12-24", name: "Christmas Eve" },
      { date: "2027-12-25", name: "Hanukkah" },
    ]);

    expect(
      getHolidays(source, { start: "2027-12-01", end: "2027-12-31" }),
    ).toEqual([
      { date: "2027-12-24", name: "Christmas Eve" },
      { date: "2027-12-25", name: "Christmas Day / Hanukkah" },
    ]);
  });

  it("sorts the rows even when the source doesn't", () => {
    const unsorted: HolidaySource = {
      id: "unsorted",
      getHolidays: () => [
        { date: "2026-11-26", name: "Thanksgiving Day" },
        { date: "2026-11-11", name: "Veterans Day" },
      ],
    };

    expect(
      getHolidays(unsorted, { start: "2026-11-01", end: "2026-11-30" }).map(
        ({ date }) => date,
      ),
    ).toEqual(["2026-11-11", "2026-11-26"]);
  });

  it("includes holidays on both ends of the range", () => {
    expect(
      getHolidays(dhr, { start: "2026-11-11", end: "2026-11-26" }),
    ).toEqual([
      { date: "2026-11-11", name: "Veterans Day" },
      { date: "2026-11-26", name: "Thanksgiving Day" },
    ]);
  });

  it("returns a one-day range's holiday", () => {
    expect(
      getHolidays(dhr, { start: "2026-10-05", end: "2026-10-05" }),
    ).toEqual([{ date: "2026-10-05", name: "Frances Xavier Cabrini Day" }]);
  });

  it("returns nothing for a range with no holidays", () => {
    expect(
      getHolidays(dhr, { start: "2026-08-01", end: "2026-08-31" }),
    ).toEqual([]);
  });

  it("throws INVALID_DATE_RANGE when start is after end", () => {
    expect(() =>
      getHolidays(dhr, { start: "2026-09-30", end: "2026-09-01" }),
    ).toThrow(rulesError("INVALID_DATE_RANGE"));
  });

  it("throws INVALID_DATE_RANGE for a range past the year 5000", () => {
    expect(() =>
      getHolidays(dhr, { start: "2026-09-01", end: "5001-01-01" }),
    ).toThrow(rulesError("INVALID_DATE_RANGE"));
  });

  it.each([
    { start: "2026-09-31", end: "2026-10-31" },
    { start: "2026-09-01", end: "2026-9-30" },
  ])("throws INVALID_DATE for the malformed range %j", (range) => {
    expect(() => getHolidays(dhr, range)).toThrow(rulesError("INVALID_DATE"));
  });
});

describe("staticHolidaySource", () => {
  it("defaults its id to static", () => {
    expect(staticHolidaySource([]).id).toBe("static");
  });

  it("throws INVALID_DATE when a listed holiday has a bad date", () => {
    expect(() =>
      staticHolidaySource([{ date: "2026-02-30", name: "Not a day" }]),
    ).toThrow(rulesError("INVALID_DATE"));
  });

  it("returns copies, so callers can't change the list", () => {
    const source = staticHolidaySource(DHR_HOLIDAYS);
    const range = { start: "2026-09-01", end: "2026-09-30" };

    source.getHolidays(range)[0].name = "Edited";

    expect(source.getHolidays(range)[0].name).toBe("Labor Day");
  });
});
