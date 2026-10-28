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

import {
  isInMonth,
  monthStartIso,
  toIsoDate,
  weekdayOf,
  weekStartsOnToFirstDay,
} from "../dates";

const september = { year: 2026, month: 9 };

describe("isInMonth", () => {
  test.each([
    ["2026-08-31", false],
    ["2026-09-01", true],
    ["2026-09-30", true],
    ["2026-10-01", false],
    ["2025-09-15", false],
  ])("%s is in September 2026: %s", (date, expected) => {
    expect(isInMonth(date, september)).toBe(expected);
  });

  test("handles a leap day and December", () => {
    expect(isInMonth("2028-02-29", { year: 2028, month: 2 })).toBeTrue();
    expect(isInMonth("2026-12-31", { year: 2026, month: 12 })).toBeTrue();
    expect(isInMonth("2027-01-01", { year: 2026, month: 12 })).toBeFalse();
  });
});

describe("monthStartIso", () => {
  test("pads the month", () => {
    expect(monthStartIso(september)).toBe("2026-09-01");
    expect(monthStartIso({ year: 2026, month: 12 })).toBe("2026-12-01");
  });
});

describe("toIsoDate", () => {
  test("reads the date in the calendar's time zone", () => {
    // Midnight on September 1 in Denver (MDT, UTC-6), as FullCalendar passes it.
    const startOfSeptember1 = new Date("2026-09-01T06:00:00Z");
    expect(toIsoDate(startOfSeptember1, "America/Denver")).toBe("2026-09-01");
  });

  test("gives the day before when the instant is still the previous evening there", () => {
    expect(toIsoDate(new Date("2026-09-01T05:59:00Z"), "America/Denver")).toBe(
      "2026-08-31",
    );
  });

  test("uses standard time after daylight saving ends", () => {
    // Midnight on November 2 in Denver is MST, UTC-7.
    expect(toIsoDate(new Date("2026-11-02T07:00:00Z"), "America/Denver")).toBe(
      "2026-11-02",
    );
  });
});

describe("weekStartsOnToFirstDay", () => {
  test.each([
    ["SUNDAY", 0],
    ["MONDAY", 1],
    ["TUESDAY", 2],
    ["WEDNESDAY", 3],
    ["THURSDAY", 4],
    ["FRIDAY", 5],
    ["SATURDAY", 6],
  ] as const)("%s gives %i", (weekday, firstDay) => {
    expect(weekStartsOnToFirstDay(weekday)).toBe(firstDay);
  });
});

describe("weekdayOf", () => {
  test.each([
    ["2026-09-13", "SUNDAY"],
    ["2026-09-14", "MONDAY"],
    ["2026-09-18", "FRIDAY"],
    ["2026-09-19", "SATURDAY"],
  ])("gives %s as %s", (date, weekday) => {
    expect(weekdayOf(date)).toBe(weekday);
  });
});
