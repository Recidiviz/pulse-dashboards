// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import tk from "timekeeper";

import { relativeFixtureDate, shiftFixtureDate } from "../fixtureDates";

test("shift fixture date", () => {
  tk.withFreeze(new Date(2024, 2, 25), () => {
    // this is "today" in fixture-land
    expect(shiftFixtureDate(new Date(2021, 11, 16))).toEqual(
      new Date(2024, 2, 25),
    );

    expect(shiftFixtureDate(new Date(2021, 8, 1))).toEqual(
      new Date(2023, 11, 10),
    );
  });
});

describe("relative fixture date", () => {
  test("past", () => {
    expect(
      relativeFixtureDate({ years: -3, months: -2, days: -9 }),
    ).toMatchInlineSnapshot(`"2018-10-07"`);
  });

  test("future", () => {
    expect(
      relativeFixtureDate({
        months: 33,
        days: 5,
      }),
    ).toMatchInlineSnapshot(`"2024-09-21"`);
  });

  test("chained", () => {
    expect(
      relativeFixtureDate(
        {
          months: 33,
          days: 5,
        },
        { days: 1 },
      ),
    ).toMatchInlineSnapshot(`"2024-09-22"`);
  });
});
