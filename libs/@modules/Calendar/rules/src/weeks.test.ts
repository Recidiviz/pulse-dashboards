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

import { Temporal } from "temporal-polyfill";

import { addMonths, isDateInMonth } from "./dates";
import {
  PatternRule,
  Weekday,
  WEEKDAYS,
  WeekNumbering,
  WeekOfMonth,
  WEEKS_OF_MONTH,
  WeekSettings,
  YearMonth,
} from "./types";
import { firstFullWeekStart, resolvePatternRule } from "./weeks";

const SUNDAY_WEEKS: WeekSettings = {
  weekStartsOn: "SUNDAY",
  weekNumbering: "FIRST_FULL_WEEK",
};
const MONDAY_WEEKS: WeekSettings = {
  weekStartsOn: "MONDAY",
  weekNumbering: "FIRST_FULL_WEEK",
};

const MONDAY_TO_SATURDAY: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function ym(value: string): YearMonth {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

function monthsFrom(start: YearMonth, count: number): YearMonth[] {
  return Array.from({ length: count }, (_, i) => addMonths(start, i));
}

type WeekOfMonthRule = Extract<PatternRule, { type: "weekOfMonth" }>;

function weekRule(week: WeekOfMonth, weekday: Weekday): WeekOfMonthRule {
  return { type: "weekOfMonth", week, weekday };
}

describe("firstFullWeekStart", () => {
  it.each([
    ["2026-06", "2026-06-07", "2026-06-01"],
    ["2026-08", "2026-08-02", "2026-08-03"],
    ["2026-09", "2026-09-06", "2026-09-07"],
    ["2026-10", "2026-10-04", "2026-10-05"],
    ["2026-11", "2026-11-01", "2026-11-02"],
    ["2027-02", "2027-02-07", "2027-02-01"],
    ["2027-03", "2027-03-07", "2027-03-01"],
    ["2027-11", "2027-11-07", "2027-11-01"],
  ])(
    "%s starts on %s with Sunday weeks and %s with Monday weeks",
    (month, sunday, monday) => {
      expect(firstFullWeekStart(ym(month), "SUNDAY")).toBe(sunday);
      expect(firstFullWeekStart(ym(month), "MONDAY")).toBe(monday);
    },
  );

  it("throws INVALID_RULE for an unknown week start", () => {
    expect(() =>
      firstFullWeekStart(ym("2026-10"), "FUNDAY" as Weekday),
    ).toThrow(expect.objectContaining({ code: "INVALID_RULE" }));
  });
});

describe("resolvePatternRule under FIRST_FULL_WEEK", () => {
  it("puts the 1st Thursday of October 2026 on Oct 8 with either week start (the patterns sheet's example)", () => {
    const rule = weekRule(1, "THURSDAY");
    expect(resolvePatternRule(ym("2026-10"), rule, SUNDAY_WEEKS)).toBe(
      "2026-10-08",
    );
    expect(resolvePatternRule(ym("2026-10"), rule, MONDAY_WEEKS)).toBe(
      "2026-10-08",
    );
  });

  it.each([
    ["2026-06", "2026-06-08", "2026-06-01"],
    ["2027-02", "2027-02-08", "2027-02-01"],
    ["2027-03", "2027-03-08", "2027-03-01"],
    ["2027-11", "2027-11-08", "2027-11-01"],
  ])(
    "moves the 1st Monday of %s from %s (Sunday weeks) to %s (Monday weeks)",
    (month, sunday, monday) => {
      const rule = weekRule(1, "MONDAY");
      expect(resolvePatternRule(ym(month), rule, SUNDAY_WEEKS)).toBe(sunday);
      expect(resolvePatternRule(ym(month), rule, MONDAY_WEEKS)).toBe(monday);
    },
  );

  it("gives the same Monday-to-Saturday dates under both week starts except in months that begin on a Monday", () => {
    const mondayMonths = ["2026-06", "2027-02", "2027-03", "2027-11"];
    for (const month of monthsFrom(ym("2026-01"), 24)) {
      const label = `${month.year}-${String(month.month).padStart(2, "0")}`;
      const moves = mondayMonths.includes(label);
      for (const week of WEEKS_OF_MONTH) {
        for (const weekday of MONDAY_TO_SATURDAY) {
          const rule = weekRule(week, weekday);
          const sunday = resolvePatternRule(month, rule, SUNDAY_WEEKS);
          const monday = resolvePatternRule(month, rule, MONDAY_WEEKS);
          if (moves) {
            expect(sunday).toBe(
              Temporal.PlainDate.from(monday).add({ days: 7 }).toString(),
            );
          } else {
            expect({ label, week, weekday, date: sunday }).toEqual({
              label,
              week,
              weekday,
              date: monday,
            });
          }
        }
      }
    }
  });
});

describe("week numbering modes", () => {
  const NTH_SUNDAY: WeekSettings = {
    weekStartsOn: "SUNDAY",
    weekNumbering: "NTH_WEEKDAY_IN_MONTH",
  };
  const NTH_MONDAY: WeekSettings = {
    weekStartsOn: "MONDAY",
    weekNumbering: "NTH_WEEKDAY_IN_MONTH",
  };

  // [month, settings, 1st Monday, 1st Thursday, 4th Monday, 4th Thursday]
  const cases: Array<[string, WeekSettings[], string, string, string, string]> =
    [
      [
        "2026-10",
        [SUNDAY_WEEKS],
        "2026-10-05",
        "2026-10-08",
        "2026-10-26",
        "2026-10-29",
      ],
      [
        "2026-10",
        [MONDAY_WEEKS],
        "2026-10-05",
        "2026-10-08",
        "2026-10-26",
        "2026-10-29",
      ],
      [
        "2026-10",
        [NTH_SUNDAY, NTH_MONDAY],
        "2026-10-05",
        "2026-10-01",
        "2026-10-26",
        "2026-10-22",
      ],
      [
        "2027-02",
        [SUNDAY_WEEKS],
        "2027-02-08",
        "2027-02-11",
        "2027-03-01",
        "2027-03-04",
      ],
      [
        "2027-02",
        [MONDAY_WEEKS],
        "2027-02-01",
        "2027-02-04",
        "2027-02-22",
        "2027-02-25",
      ],
      [
        "2027-02",
        [NTH_SUNDAY, NTH_MONDAY],
        "2027-02-01",
        "2027-02-04",
        "2027-02-22",
        "2027-02-25",
      ],
    ];

  describe.each(cases)(
    "%s with %j",
    (
      month,
      settingsList,
      firstMonday,
      firstThursday,
      fourthMonday,
      fourthThursday,
    ) => {
      const expected: Array<[WeekOfMonthRule, string]> = [
        [weekRule(1, "MONDAY"), firstMonday],
        [weekRule(1, "THURSDAY"), firstThursday],
        [weekRule(4, "MONDAY"), fourthMonday],
        [weekRule(4, "THURSDAY"), fourthThursday],
      ];

      it.each(settingsList)(
        "resolvePatternRule gives the expected dates (%j)",
        (settings) => {
          for (const [rule, date] of expected) {
            expect(resolvePatternRule(ym(month), rule, settings)).toBe(date);
          }
        },
      );
    },
  );

  it("keeps every NTH_WEEKDAY_IN_MONTH date in days 7(N-1)+1 to 7N, for either week start, 2026 to 2035", () => {
    for (const month of monthsFrom(ym("2026-01"), 120)) {
      for (const week of WEEKS_OF_MONTH) {
        for (const weekday of WEEKDAYS) {
          const rule = weekRule(week, weekday);
          const date = resolvePatternRule(month, rule, NTH_SUNDAY);
          expect(resolvePatternRule(month, rule, NTH_MONDAY)).toBe(date);
          const [year, monthNumber, day] = date.split("-").map(Number);
          expect({ year, month: monthNumber }).toEqual(month);
          expect(day).toBeGreaterThanOrEqual(7 * (week - 1) + 1);
          expect(day).toBeLessThanOrEqual(7 * week);
        }
      }
    }
  });

  it("throws INVALID_RULE for an unknown week numbering", () => {
    expect(() =>
      resolvePatternRule(ym("2026-10"), weekRule(1, "MONDAY"), {
        weekStartsOn: "SUNDAY",
        weekNumbering: "LAST_WEEK" as WeekNumbering,
      }),
    ).toThrow(expect.objectContaining({ code: "INVALID_RULE" }));
  });
});

describe("dates past month end under FIRST_FULL_WEEK", () => {
  it("are always before the next month's first full week, 2026 to 2035, for either week start", () => {
    for (const settings of [SUNDAY_WEEKS, MONDAY_WEEKS]) {
      for (const month of monthsFrom(ym("2026-01"), 120)) {
        const nextWeekStart = firstFullWeekStart(
          addMonths(month, 1),
          settings.weekStartsOn,
        );
        for (const weekday of WEEKDAYS) {
          const date = resolvePatternRule(
            month,
            weekRule(4, weekday),
            settings,
          );
          if (!isDateInMonth(date, month)) {
            expect(date < nextWeekStart).toBeTrue();
          }
        }
      }
    }
  });
});

describe("resolvePatternRule validation", () => {
  it.each([
    [{ type: "weekOfMonth", week: 5, weekday: "MONDAY" }],
    [{ type: "weekOfMonth", week: 0, weekday: "MONDAY" }],
    [{ type: "weekOfMonth", week: 1, weekday: "MON" }],
    [{ type: "everyWeekday", weekday: "FRIDAY" }],
    [{ type: "nthDay", week: 1, weekday: "MONDAY" }],
  ])("throws INVALID_RULE for %j", (rule) => {
    expect(() =>
      resolvePatternRule(ym("2026-10"), rule as WeekOfMonthRule, SUNDAY_WEEKS),
    ).toThrow(expect.objectContaining({ code: "INVALID_RULE" }));
  });

  it("rejects other rule types at compile time", () => {
    expect(() =>
      resolvePatternRule(
        ym("2026-10"),
        // @ts-expect-error resolvePatternRule takes only weekOfMonth rules.
        { type: "everyWeekday", weekday: "FRIDAY" },
        SUNDAY_WEEKS,
      ),
    ).toThrow(expect.objectContaining({ code: "INVALID_RULE" }));
  });

  it("throws INVALID_YEAR_MONTH for month 13", () => {
    expect(() =>
      resolvePatternRule(
        { year: 2026, month: 13 },
        weekRule(1, "MONDAY"),
        SUNDAY_WEEKS,
      ),
    ).toThrow(expect.objectContaining({ code: "INVALID_YEAR_MONTH" }));
  });
});
