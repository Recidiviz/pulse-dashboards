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

import type { Weekday, WeekOfMonth } from "../../types";
import { resolvePatternRule } from "../../weeks";
import {
  US_CO_PAROLE_BOARD_RULES,
  US_CO_PAROLE_BOARD_SETTINGS,
} from "./calendar";

describe("US_CO_PAROLE_BOARD_SETTINGS", () => {
  it("has Colorado's settings", () => {
    expect(US_CO_PAROLE_BOARD_SETTINGS).toEqual({
      timezone: "America/Denver",
      weekStartsOn: "MONDAY",
      weekNumbering: "NTH_WEEKDAY_IN_MONTH",
      holidayRegion: "US-CO",
      holidayPolicy: "WARN",
      editorRoute: "publicCalendar",
      allowedWeekdays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    });
  });
});

describe("Colorado's week numbering", () => {
  // The Board's March and April 2027 drafts count "Nth Thursday" from the
  // month's first Thursday. April 1, 2027 is a Thursday.
  it.each<[number, WeekOfMonth, Weekday, string]>([
    [3, 1, "MONDAY", "2027-03-01"],
    [3, 4, "THURSDAY", "2027-03-25"],
    [4, 1, "THURSDAY", "2027-04-01"],
    [4, 1, "MONDAY", "2027-04-05"],
    [4, 4, "THURSDAY", "2027-04-22"],
  ])("puts month %i's week-%i %s on %s", (month, week, weekday, date) => {
    expect(
      resolvePatternRule(
        { year: 2027, month },
        { type: "weekOfMonth", week, weekday },
        US_CO_PAROLE_BOARD_SETTINGS,
      ),
    ).toBe(date);
  });
});

describe("US_CO_PAROLE_BOARD_RULES", () => {
  it("lists each entry type's behaviour, with Business Meetings cancel-only", () => {
    expect(
      US_CO_PAROLE_BOARD_RULES.entryTypes.map((type) => [
        type.code,
        type.requiresResource,
        type.cancellable,
        type.deletable,
        type.isPublic,
        type.countsTowardTotal,
      ]),
    ).toEqual([
      ["HEARING", true, false, true, true, true],
      ["FULL_BOARD", false, true, true, true, false],
      ["BUSINESS_MEETING", false, true, false, true, false],
    ]);
  });
});
