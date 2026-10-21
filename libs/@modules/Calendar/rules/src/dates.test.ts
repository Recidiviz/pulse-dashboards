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
  addMonths,
  currentYearMonth,
  daysInMonth,
  isDateInMonth,
  parseIsoDate,
  todayIn,
  weekdayOf,
} from "./dates";

function rulesError(code: string) {
  return expect.objectContaining({ name: "CalendarRulesError", code });
}

describe("parseIsoDate", () => {
  it("returns a valid date unchanged", () => {
    expect(parseIsoDate("2026-10-08")).toBe("2026-10-08");
    expect(parseIsoDate("2028-02-29")).toBe("2028-02-29");
  });

  it.each([
    "2026-02-30",
    "2027-02-29",
    "2026-13-01",
    "2026-1-1",
    "2026-10-08T00:00:00",
    "",
    "not a date",
  ])("throws INVALID_DATE for %j", (value) => {
    expect(() => parseIsoDate(value)).toThrow(rulesError("INVALID_DATE"));
  });
});

describe("weekdayOf", () => {
  it.each([
    ["2026-10-01", "THURSDAY"],
    ["2026-10-04", "SUNDAY"],
    ["2026-10-05", "MONDAY"],
    ["2026-08-01", "SATURDAY"],
    ["2027-02-01", "MONDAY"],
  ])("%s is a %s", (date, weekday) => {
    expect(weekdayOf(date)).toBe(weekday);
  });
});

describe("daysInMonth", () => {
  it.each([
    [{ year: 2026, month: 2 }, 28],
    [{ year: 2028, month: 2 }, 29],
    [{ year: 2026, month: 9 }, 30],
    [{ year: 2026, month: 10 }, 31],
  ])("%j has %i days", (ym, days) => {
    expect(daysInMonth(ym)).toBe(days);
  });
});

describe("isDateInMonth", () => {
  it("checks year and month", () => {
    const september = { year: 2026, month: 9 };
    expect(isDateInMonth("2026-09-01", september)).toBeTrue();
    expect(isDateInMonth("2026-09-30", september)).toBeTrue();
    expect(isDateInMonth("2026-10-01", september)).toBeFalse();
    expect(isDateInMonth("2027-09-15", september)).toBeFalse();
  });
});

describe("addMonths", () => {
  it.each([
    [{ year: 2026, month: 10 }, 0, { year: 2026, month: 10 }],
    [{ year: 2026, month: 10 }, 3, { year: 2027, month: 1 }],
    [{ year: 2026, month: 1 }, -1, { year: 2025, month: 12 }],
    [{ year: 2026, month: 10 }, -22, { year: 2024, month: 12 }],
  ])("%j plus %i months is %j", (ym, n, expected) => {
    expect(addMonths(ym, n)).toEqual(expected);
  });

  it("accepts results up to the end of 5000 and rejects anything later", () => {
    expect(addMonths({ year: 4999, month: 12 }, 1)).toEqual({
      year: 5000,
      month: 1,
    });
    expect(() => addMonths({ year: 5000, month: 12 }, 1)).toThrow(
      rulesError("INVALID_YEAR_MONTH"),
    );
  });

  it("rejects a result before 2000", () => {
    expect(() => addMonths({ year: 2000, month: 1 }, -1)).toThrow(
      rulesError("INVALID_YEAR_MONTH"),
    );
  });

  it("rejects a fractional offset", () => {
    expect(() => addMonths({ year: 2026, month: 10 }, 1.5)).toThrow(
      rulesError("INVALID_YEAR_MONTH"),
    );
  });
});

describe("year and month validation", () => {
  it.each([
    { year: 2026, month: 13 },
    { year: 2026, month: 0 },
    { year: 1999, month: 12 },
    { year: 5001, month: 1 },
    { year: 2026.5, month: 1 },
  ])("throws INVALID_YEAR_MONTH for %j", (ym) => {
    expect(() => daysInMonth(ym)).toThrow(rulesError("INVALID_YEAR_MONTH"));
  });
});

describe("todayIn and currentYearMonth", () => {
  const now = new Date("2026-10-01T05:30:00Z");

  it("returns the date in the given zone, not the host's", () => {
    expect(todayIn("America/Denver", now)).toBe("2026-09-30");
    expect(todayIn("UTC", now)).toBe("2026-10-01");
    expect(currentYearMonth("America/Denver", now)).toEqual({
      year: 2026,
      month: 9,
    });
    expect(currentYearMonth("UTC", now)).toEqual({ year: 2026, month: 10 });
  });

  it("reads the system clock when now is omitted", () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      expect(todayIn("America/Denver")).toBe("2026-09-30");
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws INVALID_TIME_ZONE for an unknown zone", () => {
    expect(() => todayIn("Mars/Base", now)).toThrow(
      rulesError("INVALID_TIME_ZONE"),
    );
    expect(() => currentYearMonth("Mars/Base", now)).toThrow(
      rulesError("INVALID_TIME_ZONE"),
    );
  });
});
