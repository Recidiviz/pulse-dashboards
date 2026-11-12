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
  monthOutsideAddWindowError,
  monthsAlreadyExistError,
} from "../../src/calendar.errors";

const october = { year: 2026, month: 10 };
const november = { year: 2026, month: 11 };
const december = { year: 2026, month: 12 };

describe("monthsAlreadyExistError", () => {
  it.each([
    [[october], "October 2026 already exists. Refresh to see it."],
    [
      [october, november],
      "October 2026 and November 2026 already exist. Refresh to see them.",
    ],
    [
      [october, november, december],
      "October 2026, November 2026 and December 2026 already exist. Refresh to see them.",
    ],
  ])("names %j", (months, message) => {
    expect(monthsAlreadyExistError(months)).toMatchObject({
      code: "CONFLICT",
      message,
    });
  });
});

describe("monthOutsideAddWindowError", () => {
  it("names the first and last months of the window", () => {
    expect(
      monthOutsideAddWindowError(october, { year: 2027, month: 10 }),
    ).toMatchObject({
      code: "BAD_REQUEST",
      message: "You can add October 2026 to October 2027 only.",
    });
  });
});
