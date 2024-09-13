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

import { hasDifferentValuesAtKeys } from "./hasDifferentValuesAtKeys";

const OBJECTS = [
  { a: 1, b: 2, c: 3 },
  { a: 1, b: 2, c: 3 },
  { a: 1, b: 2, c: 3 },
];

describe("function: hasDifferentValuesAtKeys", () => {
  test("should return false", () => {
    expect(hasDifferentValuesAtKeys(OBJECTS)).toBe(false);
  });

  test("should return false even if some keys are varied", () => {
    expect(hasDifferentValuesAtKeys([...OBJECTS, { a: 1, b: 2, c: 4 }])).toBe(
      false,
    );
  });

  test("should return true when keys with duplicates are excluded", () => {
    expect(
      hasDifferentValuesAtKeys([...OBJECTS, { a: 1, b: 2, c: 4 }], ["a", "b"]),
    ).toBe(true);
  });

  test("should return true when every key is varied", () => {
    expect(
      hasDifferentValuesAtKeys([
        { a: 2, b: 3, c: 5 },
        { a: 1, b: 2, c: 4 },
      ]),
    ).toBe(true);
  });

  test("should return false even with a missing key", () => {
    expect(hasDifferentValuesAtKeys([...OBJECTS, { a: 1, b: 2 }])).toBe(false);
  });
});
