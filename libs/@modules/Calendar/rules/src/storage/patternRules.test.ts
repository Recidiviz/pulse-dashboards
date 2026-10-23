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

import { CalendarRulesError } from "../errors";
import { WEEKDAYS, WEEKS_OF_MONTH } from "../types";
import { parsePatternRules } from "./patternRules";

const EVERY_THIRD_FRIDAY = {
  type: "everyNWeeks",
  weekday: "FRIDAY",
  intervalWeeks: 3,
  anchorDate: "2026-09-04",
};

describe("parsePatternRules", () => {
  it("accepts FCF's 1st and 2nd Monday", () => {
    const rules = [
      { type: "weekOfMonth", week: 1, weekday: "MONDAY" },
      { type: "weekOfMonth", week: 2, weekday: "MONDAY" },
    ];
    expect(parsePatternRules(rules)).toEqual(rules);
  });

  it("accepts Full Board's every Friday", () => {
    const rules = [{ type: "everyWeekday", weekday: "FRIDAY" }];
    expect(parsePatternRules(rules)).toEqual(rules);
  });

  it("accepts every third Friday from Sep 4, 2026", () => {
    expect(parsePatternRules([EVERY_THIRD_FRIDAY])).toEqual([
      EVERY_THIRD_FRIDAY,
    ]);
  });

  it("accepts 28 rules, every week and weekday combination", () => {
    const rules = WEEKS_OF_MONTH.flatMap((week) =>
      WEEKDAYS.map((weekday) => ({ type: "weekOfMonth", week, weekday })),
    );
    expect(parsePatternRules(rules)).toHaveLength(28);
  });

  it.each([
    ["week 5", [{ type: "weekOfMonth", week: 5, weekday: "MONDAY" }]],
    ["an unknown weekday", [{ type: "everyWeekday", weekday: "FUNDAY" }]],
    ["an unknown type", [{ type: "rrule", weekday: "MONDAY" }]],
    ["intervalWeeks 1", [{ ...EVERY_THIRD_FRIDAY, intervalWeeks: 1 }]],
    ["intervalWeeks 9", [{ ...EVERY_THIRD_FRIDAY, intervalWeeks: 9 }]],
    ["intervalWeeks 2.5", [{ ...EVERY_THIRD_FRIDAY, intervalWeeks: 2.5 }]],
    [
      "a Thursday anchor",
      [{ ...EVERY_THIRD_FRIDAY, anchorDate: "2026-09-03" }],
    ],
    [
      "an anchor that isn't a date",
      [{ ...EVERY_THIRD_FRIDAY, anchorDate: "2026-02-30" }],
    ],
    [
      "a repeated rule",
      [
        { type: "weekOfMonth", week: 1, weekday: "MONDAY" },
        { type: "weekOfMonth", week: 1, weekday: "MONDAY" },
      ],
    ],
    ["an empty list", []],
    [
      "29 rules",
      [
        ...WEEKS_OF_MONTH.flatMap((week) =>
          WEEKDAYS.map((weekday) => ({ type: "weekOfMonth", week, weekday })),
        ),
        { type: "everyWeekday", weekday: "FRIDAY" },
      ],
    ],
    ["an extra key", [{ type: "everyWeekday", weekday: "FRIDAY", week: 1 }]],
    ["a value that isn't a list", { type: "everyWeekday", weekday: "FRIDAY" }],
  ])("rejects %s", (_name, json) => {
    expect(() => parsePatternRules(json)).toThrow(
      expect.objectContaining({ code: "INVALID_RULE" }),
    );
  });

  it("names the failing path in the message", () => {
    expect(() =>
      parsePatternRules([
        { type: "everyWeekday", weekday: "FRIDAY" },
        { type: "weekOfMonth", week: 5, weekday: "MONDAY" },
      ]),
    ).toThrow(/1\.week/);
  });

  it("throws a CalendarRulesError", () => {
    expect(() => parsePatternRules([])).toThrow(CalendarRulesError);
  });
});
