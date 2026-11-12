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
  formatReportMonth,
  parseReportMonth,
  toReportMonth,
} from "../reportMonth";

describe("report months", () => {
  // new Date("2015-03") reads as UTC midnight, the last day of February in
  // US time zones, so run these where that mistake would show.
  const originalTimeZone = process.env["TZ"];
  beforeAll(() => {
    process.env["TZ"] = "America/Los_Angeles";
  });
  afterAll(() => {
    process.env["TZ"] = originalTimeZone;
  });

  it("formats a month as its short name and year", () => {
    expect(formatReportMonth("2015-03")).toBe("Mar 2015");
  });

  it("parses a month as its first day, in local time", () => {
    const date = parseReportMonth("2015-12");

    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([
      2015, 11, 1,
    ]);
  });

  it("returns the month a date falls in", () => {
    expect(toReportMonth(new Date(2015, 2, 31, 23, 59))).toBe("2015-03");
  });

  it("returns the same month after a round trip", () => {
    expect(toReportMonth(parseReportMonth("2026-01"))).toBe("2026-01");
  });
});
