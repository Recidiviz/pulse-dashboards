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

import type { CalendarWeekday } from "~@parole-board/common";

import { isAllowedDay } from "../isAllowedDay";

const WEEKDAYS_ONLY: CalendarWeekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

describe("isAllowedDay", () => {
  it.each([
    ["2026-09-14", "Monday"],
    ["2026-09-16", "Wednesday"],
    ["2026-09-18", "Friday"],
  ])("allows %s, a %s, on a Monday-to-Friday calendar", (date) => {
    expect(isAllowedDay(date, WEEKDAYS_ONLY)).toBe(true);
  });

  it.each([
    ["2026-09-12", "Saturday"],
    ["2026-09-13", "Sunday"],
  ])("rejects %s, a %s, on a Monday-to-Friday calendar", (date) => {
    expect(isAllowedDay(date, WEEKDAYS_ONLY)).toBe(false);
  });

  it("follows the list it is given rather than a fixed weekend", () => {
    expect(isAllowedDay("2026-09-13", ["SUNDAY"])).toBe(true);
    expect(isAllowedDay("2026-09-14", ["SUNDAY"])).toBe(false);
  });

  it("allows nothing when no weekday is allowed", () => {
    expect(isAllowedDay("2026-09-14", [])).toBe(false);
  });

  it("reads the weekday from the date's own calendar day across a leap day", () => {
    // 2028-02-29 is a Tuesday and 2028-03-04 a Saturday.
    expect(isAllowedDay("2028-02-29", WEEKDAYS_ONLY)).toBe(true);
    expect(isAllowedDay("2028-03-04", WEEKDAYS_ONLY)).toBe(false);
  });
});
