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

import { describePatternRules } from "./describePattern";
import { PatternRule, Weekday, WeekOfMonth } from "./types";

function weekRule(week: WeekOfMonth, weekday: Weekday): PatternRule {
  return { type: "weekOfMonth", week, weekday };
}

const FULL_BOARD: PatternRule = { type: "everyWeekday", weekday: "FRIDAY" };
const BUSINESS_MEETING: PatternRule = {
  type: "everyNWeeks",
  weekday: "FRIDAY",
  intervalWeeks: 3,
  anchorDate: "2026-09-04",
};

describe("describePatternRules", () => {
  it.each<[PatternRule[], string]>([
    [[weekRule(1, "MONDAY"), weekRule(2, "MONDAY")], "1st and 2nd Monday"],
    [
      [weekRule(2, "TUESDAY"), weekRule(2, "WEDNESDAY")],
      "2nd Tuesday and Wednesday",
    ],
    [
      [weekRule(3, "WEDNESDAY"), weekRule(3, "THURSDAY")],
      "3rd Wednesday and Thursday",
    ],
    [[weekRule(4, "MONDAY"), weekRule(4, "TUESDAY")], "4th Monday and Tuesday"],
    [[weekRule(1, "MONDAY")], "1st Monday"],
    [
      [weekRule(1, "MONDAY"), weekRule(2, "TUESDAY")],
      "1st Monday, 2nd Tuesday",
    ],
    [[FULL_BOARD], "Every Friday"],
    [[BUSINESS_MEETING], "Every 3 weeks on Friday from Sep 4, 2026"],
  ])("describes %j as %j", (rules, text) => {
    expect(describePatternRules(rules)).toBe(text);
  });

  it("orders weeks and weekdays regardless of input order", () => {
    expect(
      describePatternRules([
        weekRule(2, "WEDNESDAY"),
        weekRule(1, "WEDNESDAY"),
        weekRule(2, "MONDAY"),
        weekRule(1, "MONDAY"),
      ]),
    ).toBe("1st and 2nd Monday and Wednesday");
  });

  it("joins three or more weeks with commas", () => {
    expect(
      describePatternRules([
        weekRule(1, "FRIDAY"),
        weekRule(2, "FRIDAY"),
        weekRule(3, "FRIDAY"),
      ]),
    ).toBe("1st, 2nd and 3rd Friday");
  });

  it("lists each rule when a week is missing one of the weekdays", () => {
    expect(
      describePatternRules([
        weekRule(2, "TUESDAY"),
        weekRule(1, "MONDAY"),
        weekRule(1, "TUESDAY"),
      ]),
    ).toBe("1st Monday, 1st Tuesday, 2nd Tuesday");
  });

  it("puts weekOfMonth rules first when rule types mix", () => {
    expect(
      describePatternRules([
        BUSINESS_MEETING,
        FULL_BOARD,
        weekRule(2, "MONDAY"),
      ]),
    ).toBe(
      "2nd Monday, Every Friday, Every 3 weeks on Friday from Sep 4, 2026",
    );
  });

  it("lists each rule when a full grid is mixed with another rule type", () => {
    expect(
      describePatternRules([
        weekRule(1, "MONDAY"),
        weekRule(2, "MONDAY"),
        FULL_BOARD,
      ]),
    ).toBe("1st Monday, 2nd Monday, Every Friday");
  });

  it("prints a duplicate rule once", () => {
    expect(
      describePatternRules([weekRule(1, "MONDAY"), weekRule(1, "MONDAY")]),
    ).toBe("1st Monday");
  });

  it("returns an empty string for no rules", () => {
    expect(describePatternRules([])).toBe("");
  });

  it("throws INVALID_RULE for a malformed rule", () => {
    expect(() =>
      describePatternRules([
        {
          type: "weekOfMonth",
          week: 5,
          weekday: "MONDAY",
        } as unknown as PatternRule,
      ]),
    ).toThrow(expect.objectContaining({ code: "INVALID_RULE" }));
  });
});
