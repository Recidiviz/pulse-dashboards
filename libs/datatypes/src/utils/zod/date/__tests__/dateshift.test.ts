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

import { setDateshift, shouldDateshift, withDateshift } from "../dateshift";

test("is off by default", () => {
  expect(shouldDateshift()).toBe(false);
});

describe("withDateshift", () => {
  beforeEach(() => {
    setDateshift(false);
  });

  test("turns the flag on for the duration of fn", () => {
    expect.assertions(3);

    expect(shouldDateshift()).toBe(false);
    withDateshift(() => {
      expect(shouldDateshift()).toBe(true);
    });
    expect(shouldDateshift()).toBe(false);
  });

  test("returns the result of fn", () => {
    expect(withDateshift(() => "hello")).toBe("hello");
  });

  test("restores a previously enabled flag rather than forcing it off", () => {
    setDateshift(true);

    withDateshift(() => undefined);

    expect(shouldDateshift()).toBe(true);
  });

  test("restores the flag when fn throws", () => {
    expect(() =>
      withDateshift(() => {
        throw new Error("boom");
      }),
    ).toThrow("boom");

    expect(shouldDateshift()).toBe(false);
  });

  test("stays on through nested calls", () => {
    expect.assertions(3);

    withDateshift(() => {
      withDateshift(() => {
        expect(shouldDateshift()).toBe(true);
      });

      // the inner call must not turn it off on the way out
      expect(shouldDateshift()).toBe(true);
    });

    expect(shouldDateshift()).toBe(false);
  });
});
