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

import { getProgressPercent, getSectionedProgressPercent } from "../helpers";

describe("getProgressPercent", () => {
  test("rounds to a whole percent", () => {
    expect(getProgressPercent(1, 3)).toBe(33);
  });

  test("caps at 100 when completed exceeds total", () => {
    expect(getProgressPercent(5, 4)).toBe(100);
  });

  test("floors at 0 when completed is negative", () => {
    expect(getProgressPercent(-1, 4)).toBe(0);
  });

  test("returns 0 when total is 0", () => {
    expect(getProgressPercent(0, 0)).toBe(0);
  });
});

describe("getSectionedProgressPercent", () => {
  test("the first step of the first section is empty", () => {
    expect(
      getSectionedProgressPercent({
        sectionIndex: 0,
        sectionCount: 4,
        stepIndex: 0,
        stepCount: 2,
      }),
    ).toBe(0);
  });

  test("counts earlier sections as done", () => {
    expect(
      getSectionedProgressPercent({
        sectionIndex: 2,
        sectionCount: 4,
        stepIndex: 0,
        stepCount: 1,
      }),
    ).toBe(50);
  });

  test("moves forward with each step in the current section", () => {
    expect(
      getSectionedProgressPercent({
        sectionIndex: 1,
        sectionCount: 4,
        stepIndex: 1,
        stepCount: 2,
      }),
    ).toBe(38);
  });

  test("the last step of the last section stays below 100", () => {
    expect(
      getSectionedProgressPercent({
        sectionIndex: 3,
        sectionCount: 4,
        stepIndex: 1,
        stepCount: 2,
      }),
    ).toBe(88);
  });
});
