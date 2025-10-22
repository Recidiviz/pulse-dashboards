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

import { addDays } from "date-fns";
import tk from "timekeeper";

import {
  CURRENT_DATE_FIXTURE,
  relativeFixtureDate,
  relativeFixtureMonth,
  shiftFixtureDate,
} from "../fixtureDates";

describe("shift fixture date", () => {
  beforeEach(() => {
    tk.freeze(new Date(2024, 2, 25));
    onTestFinished(tk.reset);
  });

  test("by day offset", () => {
    expect(shiftFixtureDate(CURRENT_DATE_FIXTURE)).toMatchInlineSnapshot(
      `2024-03-25T00:00:00.000Z`,
    );
    expect(
      shiftFixtureDate(addDays(CURRENT_DATE_FIXTURE, -10)),
    ).toMatchInlineSnapshot(`2024-03-15T00:00:00.000Z`);

    expect(
      shiftFixtureDate(addDays(CURRENT_DATE_FIXTURE, 365)),
    ).toMatchInlineSnapshot(`2025-03-25T00:00:00.000Z`);
  });

  test("by start of month", () => {
    expect(shiftFixtureDate(new Date(2021, 8, 1))).toMatchInlineSnapshot(
      `2023-12-01T00:00:00.000Z`,
    );
  });

  test("by end of month", () => {
    expect(shiftFixtureDate(new Date(2021, 8, 30))).toMatchInlineSnapshot(
      `2023-12-31T00:00:00.000Z`,
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

describe("relative fixture month", () => {
  test("start of month", () => {
    expect(relativeFixtureMonth({ months: -7 }, "start")).toMatchInlineSnapshot(
      `"2021-05-01"`,
    );
  });

  test("end of month", () => {
    expect(relativeFixtureMonth({ months: -2 }, "end")).toMatchInlineSnapshot(
      `"2021-10-31"`,
    );
  });
});
