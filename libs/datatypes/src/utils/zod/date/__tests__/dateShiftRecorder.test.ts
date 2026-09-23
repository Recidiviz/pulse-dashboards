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

import { collectShiftedDates, recordShiftedDate } from "../dateShiftRecorder";

const dateA = new Date(2021, 11, 16);
const dateB = new Date(2022, 0, 1);
const dateC = new Date(2023, 5, 15);

test("returns the result of fn", () => {
  expect(collectShiftedDates(() => "hello").result).toBe("hello");
});

test("collects dates recorded while fn runs", () => {
  const { shiftedDates } = collectShiftedDates(() => {
    recordShiftedDate(["sentences", 0, "startDate"], dateA);
    recordShiftedDate(["releaseDate"], dateB);
  });

  expect(shiftedDates).toEqual([
    { path: ["sentences", 0, "startDate"], value: dateA },
    { path: ["releaseDate"], value: dateB },
  ]);
});

test("collects nothing when fn records no dates", () => {
  expect(collectShiftedDates(() => undefined).shiftedDates).toEqual([]);
});

test("recording outside a collection is a no-op", () => {
  expect(() => recordShiftedDate(["orphan"], dateA)).not.toThrow();

  // the orphaned record must not leak into the next collection
  expect(collectShiftedDates(() => undefined).shiftedDates).toEqual([]);
});

test("stops recording once the collection ends", () => {
  const { shiftedDates } = collectShiftedDates(() => {
    recordShiftedDate(["during"], dateA);
  });

  recordShiftedDate(["after"], dateB);

  // if the collector were still pointed at this array rather than restored to
  // undefined, "after" would have landed in it
  expect(shiftedDates).toEqual([{ path: ["during"], value: dateA }]);
});

test("keeps nested collections separate", () => {
  const { shiftedDates: outer } = collectShiftedDates(() => {
    recordShiftedDate(["outer", "before"], dateA);

    const { shiftedDates: inner } = collectShiftedDates(() => {
      recordShiftedDate(["inner"], dateB);
    });

    expect(inner).toEqual([{ path: ["inner"], value: dateB }]);

    // the outer collection resumes once the inner one returns
    recordShiftedDate(["outer", "after"], dateC);
  });

  expect(outer).toEqual([
    { path: ["outer", "before"], value: dateA },
    { path: ["outer", "after"], value: dateC },
  ]);
});

test("propagates errors from fn", () => {
  expect(() =>
    collectShiftedDates(() => {
      throw new Error("boom");
    }),
  ).toThrow("boom");
});

test("restores the outer collector when fn throws", () => {
  const { shiftedDates } = collectShiftedDates(() => {
    expect(() =>
      collectShiftedDates(() => {
        recordShiftedDate(["inner"], dateA);
        throw new Error("boom");
      }),
    ).toThrow("boom");

    recordShiftedDate(["after"], dateB);
  });

  expect(shiftedDates).toEqual([{ path: ["after"], value: dateB }]);
});
