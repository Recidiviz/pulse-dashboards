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

import { MAX_YEAR, MIN_YEAR } from "~@modules/Calendar/rules";

import {
  addEntryInput,
  listMonthsInput,
  publicMonthInput,
} from "../../../src/us_co/parole_board/schema";

describe("listMonthsInput", () => {
  it("defaults to 24 months, starting from the newest", () => {
    expect(listMonthsInput.parse({})).toEqual({
      limit: 24,
      direction: "backward",
    });
  });

  it("accepts a cursor and a month to centre on together", () => {
    expect(
      listMonthsInput.safeParse({
        cursor: { year: 2026, month: 9 },
        around: { year: 2026, month: 10 },
        direction: "forward",
      }).success,
    ).toBe(true);
  });

  it("accepts a limit of 100 and a month in MAX_YEAR", () => {
    expect(
      listMonthsInput.safeParse({
        limit: 100,
        around: { year: MAX_YEAR, month: 12 },
      }).success,
    ).toBe(true);
  });

  it.each([
    ["a limit of 0", { limit: 0 }],
    [
      "a cursor year after MAX_YEAR",
      { cursor: { year: MAX_YEAR + 1, month: 1 } },
    ],
    [
      "a cursor with an extra key",
      { cursor: { year: 2026, month: 1, day: 1 } },
    ],
    ["a 65-character search", { search: "x".repeat(65) }],
  ])("rejects %s", (_label, input) => {
    expect(listMonthsInput.safeParse(input).success).toBe(false);
  });
});

describe("addEntryInput", () => {
  it.each(["HEARING", "FULL_BOARD", "BUSINESS_MEETING"])(
    "accepts Colorado's kind %s",
    (kindCode) => {
      expect(
        addEntryInput.safeParse({
          monthId: "month-1",
          date: "2026-10-05",
          kindCode,
          resourceId: null,
        }).success,
      ).toBe(true);
    },
  );

  it("rejects a kind Colorado doesn't have", () => {
    expect(
      addEntryInput.safeParse({
        monthId: "month-1",
        date: "2026-10-05",
        kindCode: "SESSION",
        resourceId: null,
      }).success,
    ).toBe(false);
  });
});

describe("publicMonthInput", () => {
  it.each([{}, { month: "2026-11" }])("accepts %j", (input) => {
    expect(publicMonthInput.safeParse(input).success).toBe(true);
  });

  it.each(["2026-13", "2026-1", "November 2026"])("rejects %s", (month) => {
    expect(publicMonthInput.safeParse({ month }).success).toBe(false);
  });

  it("accepts a month in MIN_YEAR or MAX_YEAR and rejects one outside them", () => {
    const parses = (year: number) =>
      publicMonthInput.safeParse({ month: `${year}-01` }).success;

    expect(parses(MIN_YEAR)).toBe(true);
    expect(parses(MAX_YEAR)).toBe(true);
    expect(parses(MIN_YEAR - 1)).toBe(false);
    expect(parses(MAX_YEAR + 1)).toBe(false);
  });
});
