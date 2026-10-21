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

import { addMonths } from "./dates";
import {
  everyNWeeksDates,
  everyWeekdayDates,
  expandPatternRules,
} from "./recurring";
import {
  PatternRule,
  PatternRuleDate,
  Weekday,
  WeekOfMonth,
  WeekSettings,
  YearMonth,
} from "./types";

const SUNDAY_WEEKS: WeekSettings = {
  weekStartsOn: "SUNDAY",
  weekNumbering: "FIRST_FULL_WEEK",
};
const ALL_WEEK_SETTINGS: WeekSettings[] = [
  SUNDAY_WEEKS,
  { weekStartsOn: "MONDAY", weekNumbering: "FIRST_FULL_WEEK" },
  { weekStartsOn: "SUNDAY", weekNumbering: "NTH_WEEKDAY_IN_MONTH" },
  { weekStartsOn: "MONDAY", weekNumbering: "NTH_WEEKDAY_IN_MONTH" },
];

// Test-only fixture: the real Business Meeting anchor is open question 6.
const BUSINESS_MEETING = {
  type: "everyNWeeks",
  weekday: "FRIDAY",
  intervalWeeks: 3,
  anchorDate: "2026-09-04",
} satisfies PatternRule;
const FULL_BOARD = {
  type: "everyWeekday",
  weekday: "FRIDAY",
} satisfies PatternRule;

function ym(value: string): YearMonth {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

function weekRule(week: WeekOfMonth, weekday: Weekday): PatternRule {
  return { type: "weekOfMonth", week, weekday };
}

// Every weekOfMonth rule the 37 Colorado hearing locations use.
const HEARING_RULES: PatternRule[] = [
  weekRule(1, "MONDAY"),
  weekRule(1, "TUESDAY"),
  weekRule(1, "WEDNESDAY"),
  weekRule(1, "THURSDAY"),
  weekRule(2, "MONDAY"),
  weekRule(2, "TUESDAY"),
  weekRule(2, "WEDNESDAY"),
  weekRule(2, "THURSDAY"),
  weekRule(3, "TUESDAY"),
  weekRule(3, "WEDNESDAY"),
  weekRule(3, "THURSDAY"),
  weekRule(4, "MONDAY"),
  weekRule(4, "TUESDAY"),
  weekRule(4, "WEDNESDAY"),
  weekRule(4, "THURSDAY"),
];

describe("everyWeekdayDates", () => {
  it.each([
    ["2026-09", ["2026-09-04", "2026-09-11", "2026-09-18", "2026-09-25"]],
    [
      "2026-10",
      ["2026-10-02", "2026-10-09", "2026-10-16", "2026-10-23", "2026-10-30"],
    ],
  ])("gives every Friday in %s", (month, dates) => {
    expect(everyWeekdayDates(ym(month), FULL_BOARD)).toEqual(dates);
  });
});

describe("everyNWeeksDates", () => {
  it.each([
    ["2026-07", ["2026-07-03", "2026-07-24"]],
    ["2026-08", ["2026-08-14"]],
    ["2026-09", ["2026-09-04", "2026-09-25"]],
    ["2026-10", ["2026-10-16"]],
    ["2026-11", ["2026-11-06", "2026-11-27"]],
    ["2026-12", ["2026-12-18"]],
    ["2027-01", ["2027-01-08", "2027-01-29"]],
  ])(
    "gives the Business Meeting Fridays in %s, before and after the anchor",
    (month, dates) => {
      expect(everyNWeeksDates(ym(month), BUSINESS_MEETING)).toEqual(dates);
    },
  );

  it("throws ANCHOR_WEEKDAY_MISMATCH when the anchor isn't on the weekday", () => {
    expect(() =>
      everyNWeeksDates(ym("2026-09"), {
        ...BUSINESS_MEETING,
        anchorDate: "2026-09-03",
      }),
    ).toThrow(expect.objectContaining({ code: "ANCHOR_WEEKDAY_MISMATCH" }));
  });

  it.each([1, 9, 2.5])(
    "throws INVALID_RULE for intervalWeeks %d",
    (interval) => {
      expect(() =>
        everyNWeeksDates(ym("2026-09"), {
          ...BUSINESS_MEETING,
          intervalWeeks: interval,
        }),
      ).toThrow(expect.objectContaining({ code: "INVALID_RULE" }));
    },
  );

  it("throws INVALID_DATE for an anchor that isn't a real date", () => {
    expect(() =>
      everyNWeeksDates(ym("2026-09"), {
        ...BUSINESS_MEETING,
        anchorDate: "2026-09-31",
      }),
    ).toThrow(expect.objectContaining({ code: "INVALID_DATE" }));
  });
});

describe("expandPatternRules", () => {
  it("matches the September 2026 design with Sunday weeks", () => {
    const rows = expandPatternRules(ym("2026-09"), HEARING_RULES, SUNDAY_WEEKS);
    expect(rows.map(({ date, inMonth }) => [date, inMonth])).toEqual([
      ["2026-09-07", true],
      ["2026-09-08", true],
      ["2026-09-09", true],
      ["2026-09-10", true],
      ["2026-09-14", true],
      ["2026-09-15", true],
      ["2026-09-16", true],
      ["2026-09-17", true],
      ["2026-09-22", true],
      ["2026-09-23", true],
      ["2026-09-24", true],
      ["2026-09-28", true],
      ["2026-09-29", true],
      ["2026-09-30", true],
      ["2026-10-01", false],
    ]);
    expect(rows[rows.length - 1].rule).toEqual(weekRule(4, "THURSDAY"));
  });

  it("finds hearing dates past month end only in the expected 2026 and 2027 months, with Sunday weeks", () => {
    const pastMonthEnd: Record<string, string[]> = {};
    for (let i = 0; i < 24; i += 1) {
      const month = addMonths(ym("2026-01"), i);
      const dates = expandPatternRules(month, HEARING_RULES, SUNDAY_WEEKS)
        .filter((row) => !row.inMonth)
        .map((row) => row.date);
      if (dates.length > 0) {
        pastMonthEnd[`${month.year}-${String(month.month).padStart(2, "0")}`] =
          dates;
      }
    }
    expect(pastMonthEnd).toEqual({
      "2026-06": ["2026-07-01", "2026-07-02"],
      "2026-09": ["2026-10-01"],
      "2027-02": ["2027-03-01", "2027-03-02", "2027-03-03", "2027-03-04"],
      "2027-03": ["2027-04-01"],
      "2027-06": ["2027-07-01"],
      "2027-11": ["2027-12-01", "2027-12-02"],
    });
  });

  it("sorts every rule type together by date, keeping both rules on a shared day", () => {
    const rows = expandPatternRules(
      ym("2026-09"),
      [BUSINESS_MEETING, weekRule(2, "MONDAY"), FULL_BOARD],
      SUNDAY_WEEKS,
    );
    expect(rows).toEqual<PatternRuleDate[]>([
      { rule: BUSINESS_MEETING, date: "2026-09-04", inMonth: true },
      { rule: FULL_BOARD, date: "2026-09-04", inMonth: true },
      { rule: FULL_BOARD, date: "2026-09-11", inMonth: true },
      { rule: weekRule(2, "MONDAY"), date: "2026-09-14", inMonth: true },
      { rule: FULL_BOARD, date: "2026-09-18", inMonth: true },
      { rule: BUSINESS_MEETING, date: "2026-09-25", inMonth: true },
      { rule: FULL_BOARD, date: "2026-09-25", inMonth: true },
    ]);
  });

  it("collapses duplicate rules to one row", () => {
    const rows = expandPatternRules(
      ym("2026-09"),
      [
        weekRule(1, "MONDAY"),
        weekRule(1, "MONDAY"),
        { ...BUSINESS_MEETING },
        BUSINESS_MEETING,
      ],
      SUNDAY_WEEKS,
    );
    expect(rows.map((row) => row.date)).toEqual([
      "2026-09-04",
      "2026-09-07",
      "2026-09-25",
    ]);
  });

  it.each<[string, WeekSettings, string[]]>([
    [
      "2026-10",
      ALL_WEEK_SETTINGS[0],
      ["2026-10-05", "2026-10-08", "2026-10-26", "2026-10-29"],
    ],
    [
      "2026-10",
      ALL_WEEK_SETTINGS[1],
      ["2026-10-05", "2026-10-08", "2026-10-26", "2026-10-29"],
    ],
    [
      "2026-10",
      ALL_WEEK_SETTINGS[2],
      ["2026-10-05", "2026-10-01", "2026-10-26", "2026-10-22"],
    ],
    [
      "2026-10",
      ALL_WEEK_SETTINGS[3],
      ["2026-10-05", "2026-10-01", "2026-10-26", "2026-10-22"],
    ],
    [
      "2027-02",
      ALL_WEEK_SETTINGS[0],
      ["2027-02-08", "2027-02-11", "2027-03-01", "2027-03-04"],
    ],
    [
      "2027-02",
      ALL_WEEK_SETTINGS[1],
      ["2027-02-01", "2027-02-04", "2027-02-22", "2027-02-25"],
    ],
    [
      "2027-02",
      ALL_WEEK_SETTINGS[2],
      ["2027-02-01", "2027-02-04", "2027-02-22", "2027-02-25"],
    ],
    [
      "2027-02",
      ALL_WEEK_SETTINGS[3],
      ["2027-02-01", "2027-02-04", "2027-02-22", "2027-02-25"],
    ],
  ])(
    "gives the 1st and 4th Monday and Thursday of %s with %j, flagging dates past month end",
    (month, settings, dates) => {
      const rules = [
        weekRule(1, "MONDAY"),
        weekRule(1, "THURSDAY"),
        weekRule(4, "MONDAY"),
        weekRule(4, "THURSDAY"),
      ];
      expect(
        expandPatternRules(ym(month), rules, settings),
      ).toIncludeSameMembers(
        rules.map((rule, i) => ({
          rule,
          date: dates[i],
          inMonth: dates[i].startsWith(month),
        })),
      );
    },
  );

  it("gives the same everyWeekday and everyNWeeks dates under every week setting", () => {
    const expected = expandPatternRules(
      ym("2026-10"),
      [FULL_BOARD, BUSINESS_MEETING],
      SUNDAY_WEEKS,
    );
    for (const settings of ALL_WEEK_SETTINGS) {
      expect(
        expandPatternRules(
          ym("2026-10"),
          [FULL_BOARD, BUSINESS_MEETING],
          settings,
        ),
      ).toEqual(expected);
    }
  });

  it("returns an empty list for no rules", () => {
    expect(expandPatternRules(ym("2026-10"), [], SUNDAY_WEEKS)).toEqual([]);
  });

  it.each([
    [{ type: "weekOfMonth", week: 5, weekday: "MONDAY" }, "INVALID_RULE"],
    [{ type: "everyWeekday", weekday: "FRI" }, "INVALID_RULE"],
    [{ type: "rrule", weekday: "FRIDAY" }, "INVALID_RULE"],
    [
      { ...BUSINESS_MEETING, anchorDate: "2026-09-03" },
      "ANCHOR_WEEKDAY_MISMATCH",
    ],
  ])("rejects %j with %s", (rule, code) => {
    expect(() =>
      expandPatternRules(ym("2026-10"), [rule as PatternRule], SUNDAY_WEEKS),
    ).toThrow(expect.objectContaining({ code }));
  });
});
