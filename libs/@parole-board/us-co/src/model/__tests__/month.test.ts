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

import { currentYearMonth } from "~@modules/Calendar/rules";
import {
  december2026Summary,
  monthListPage,
  monthSummary,
  november2026Summary,
  september2026Summary,
} from "~@parole-board/common/fixtures";

import {
  canEditMonth,
  canEditPublishedMonth,
  daysBeforeMonthStart,
  formatMonthDay,
  formatMonthName,
  formatMonthYear,
  monthDays,
  monthOptionLabel,
  monthOptions,
  neighborMonths,
  parseYearMonthParam,
  toYearMonthParam,
} from "../month";

const DENVER = "America/Denver";
// 2026-10-08, 7pm in Denver, when it's already 2026-10-09 in UTC.
const OCT_8_DENVER_EVENING = new Date("2026-10-09T01:00:00Z");

const ym = (year: number, month: number) => ({ year, month });

describe("monthDays", () => {
  test.each([
    [ym(2026, 9), 30, "2026-09-30"],
    [ym(2027, 2), 28, "2027-02-28"],
    [ym(2028, 2), 29, "2028-02-29"],
    [ym(2026, 12), 31, "2026-12-31"],
  ])("lists every day of %o, zero-padded", (month, count, last) => {
    const days = monthDays(month);

    expect(days).toHaveLength(count);
    expect(days[0]).toBe(`${toYearMonthParam(month)}-01`);
    expect(days[8]).toBe(`${toYearMonthParam(month)}-09`);
    expect(days.at(-1)).toBe(last);
  });
});

describe("formatMonthName", () => {
  test("names the month alone", () => {
    expect(formatMonthName(ym(2026, 9))).toBe("September");
    expect(formatMonthName(ym(2027, 2))).toBe("February");
  });
});

describe("formatMonthYear", () => {
  test("names the month and year", () => {
    expect(formatMonthYear(ym(2026, 9))).toBe("September 2026");
    expect(formatMonthYear(ym(2027, 1))).toBe("January 2027");
    expect(formatMonthYear(ym(2026, 12))).toBe("December 2026");
  });
});

describe("formatMonthDay", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("names the month and day of a calendar date", () => {
    expect(formatMonthDay("2026-09-14")).toBe("September 14");
    expect(formatMonthDay("2026-01-01")).toBe("January 1");
    expect(formatMonthDay("2026-12-31")).toBe("December 31");
  });

  test("keeps the date on a Denver evening, when UTC is already the next day", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-15T03:00:00Z"));

    expect(formatMonthDay("2026-09-14")).toBe("September 14");
  });
});

describe("parseYearMonthParam and toYearMonthParam", () => {
  test("reads a valid month", () => {
    expect(parseYearMonthParam("2026-10")).toEqual(ym(2026, 10));
    expect(parseYearMonthParam("2027-01")).toEqual(ym(2027, 1));
  });

  test.each([
    ["2026-13"],
    ["2026-00"],
    ["2026-1"],
    ["abc"],
    ["2026-10-01"],
    [""],
    [undefined],
  ])("rejects %s", (param) => {
    expect(parseYearMonthParam(param)).toBeNull();
  });

  test("rejects a year outside the calendar API's range", () => {
    expect(parseYearMonthParam("1999-12")).toBeNull();
    expect(parseYearMonthParam("2000-01")).toEqual(ym(2000, 1));
  });

  test("writes a zero-padded month that parses back", () => {
    expect(toYearMonthParam(ym(2026, 9))).toBe("2026-09");
    expect(parseYearMonthParam(toYearMonthParam(ym(2026, 9)))).toEqual(
      ym(2026, 9),
    );
  });
});

describe("monthOptionLabel", () => {
  test("adds ' · past' only to months before the current month in Denver", () => {
    const current = currentYearMonth(DENVER, OCT_8_DENVER_EVENING);

    expect(monthOptionLabel(ym(2026, 9), current)).toBe(
      "September 2026 · past",
    );
    expect(monthOptionLabel(ym(2026, 10), current)).toBe("October 2026");
    expect(monthOptionLabel(ym(2026, 11), current)).toBe("November 2026");
    expect(monthOptionLabel(ym(2025, 12), current)).toBe(
      "December 2025 · past",
    );
  });
});

describe("monthOptions", () => {
  const earlier = monthListPage([september2026Summary]);
  const later = monthListPage([november2026Summary, december2026Summary]);

  test("lists the stored months from every page in ascending order", () => {
    expect(monthOptions([later, earlier], null)).toEqual([
      ym(2026, 9),
      ym(2026, 11),
      ym(2026, 12),
    ]);
  });

  test("inserts the viewed month in date order when it isn't stored", () => {
    expect(monthOptions([earlier, later], ym(2026, 10))).toEqual([
      ym(2026, 9),
      ym(2026, 10),
      ym(2026, 11),
      ym(2026, 12),
    ]);
  });

  test("lists a stored viewed month once", () => {
    expect(monthOptions([earlier, later], ym(2026, 11))).toHaveLength(3);
  });

  test("lists only the viewed month when nothing is stored", () => {
    expect(monthOptions([monthListPage([])], ym(2026, 10))).toEqual([
      ym(2026, 10),
    ]);
  });
});

describe("canEditMonth", () => {
  const current = currentYearMonth(DENVER, OCT_8_DENVER_EVENING);

  const draft = (year: number, month: number) =>
    monthSummary({ year, month, status: "DRAFT" });

  test("allows a draft in the current month and later ones", () => {
    expect(canEditMonth(draft(2026, 10), current)).toBe(true);
    expect(canEditMonth(draft(2026, 11), current)).toBe(true);
    expect(canEditMonth(draft(2027, 1), current)).toBe(true);
  });

  test("allows a month back in draft", () => {
    expect(canEditMonth(december2026Summary, current)).toBe(true);
  });

  test("published month is not editable", () => {
    expect(canEditMonth(november2026Summary, current)).toBe(false);
    expect(
      canEditMonth(
        monthSummary({ year: 2026, month: 10, status: "PUBLISHED" }),
        current,
      ),
    ).toBe(false);
  });

  test("makes past months read-only", () => {
    expect(canEditMonth(draft(2026, 9), current)).toBe(false);
    expect(canEditMonth(draft(2025, 12), current)).toBe(false);
  });
});

describe("canEditPublishedMonth", () => {
  const current = currentYearMonth(DENVER, OCT_8_DENVER_EVENING);
  const published = (year: number, month: number) =>
    monthSummary({ year, month, status: "PUBLISHED" });

  test("allows a published month from the current month on", () => {
    expect(canEditPublishedMonth(published(2026, 10), current)).toBe(true);
    expect(canEditPublishedMonth(published(2026, 11), current)).toBe(true);
  });

  test("refuses a draft, including one that was published before", () => {
    expect(canEditPublishedMonth(monthSummary({ month: 11 }), current)).toBe(
      false,
    );
    expect(
      canEditPublishedMonth(
        monthSummary({
          month: 12,
          latestPublication: {
            publishedAt: new Date("2026-10-06T17:00:00Z"),
            publishedByEmail: "editor-a@example.com",
          },
        }),
        current,
      ),
    ).toBe(false);
  });

  test("refuses a past published month, which is read-only", () => {
    expect(canEditPublishedMonth(published(2026, 9), current)).toBe(false);
    expect(canEditPublishedMonth(published(2025, 12), current)).toBe(false);
  });
});

describe("neighborMonths", () => {
  const page = monthListPage([
    september2026Summary,
    november2026Summary,
    december2026Summary,
  ]);

  test("skips the gap between stored months", () => {
    expect(neighborMonths([page], ym(2026, 11))).toEqual({
      previous: ym(2026, 9),
      next: ym(2026, 12),
    });
    expect(neighborMonths([page], ym(2026, 9))).toEqual({
      previous: null,
      next: ym(2026, 11),
    });
  });

  test("returns null at the first and last stored month", () => {
    expect(neighborMonths([page], ym(2026, 9)).previous).toBeNull();
    expect(neighborMonths([page], ym(2026, 12)).next).toBeNull();
  });

  test("finds both sides of a viewed month that isn't stored", () => {
    expect(neighborMonths([page], ym(2026, 10))).toEqual({
      previous: ym(2026, 9),
      next: ym(2026, 11),
    });
  });

  test("returns null on both sides when nothing is stored", () => {
    expect(neighborMonths([monthListPage([])], ym(2026, 10))).toEqual({
      previous: null,
      next: null,
    });
  });
});

describe("daysBeforeMonthStart", () => {
  test("counts the days to the 1st, 0 on the 1st and negative after it", () => {
    expect(daysBeforeMonthStart(ym(2026, 11), "2026-10-08")).toBe(24);
    expect(daysBeforeMonthStart(ym(2026, 11), "2026-11-01")).toBe(0);
    expect(daysBeforeMonthStart(ym(2026, 11), "2026-11-05")).toBe(-4);
  });

  test("counts whole days across a daylight saving change and a new year", () => {
    // Denver's clocks go back on 2026-11-01.
    expect(daysBeforeMonthStart(ym(2026, 12), "2026-10-31")).toBe(31);
    expect(daysBeforeMonthStart(ym(2027, 1), "2026-12-31")).toBe(1);
  });
});
