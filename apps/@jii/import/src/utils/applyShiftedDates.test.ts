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

import { applyShiftedDates } from "./applyShiftedDates";

const shiftedTo = new Date(2027, 9, 1);

test("writes the shifted value as a bare date string", () => {
  expect(
    applyShiftedDates({ releaseDate: "2021-12-16" }, [
      { path: ["releaseDate"], value: shiftedTo },
    ]),
  ).toEqual({ releaseDate: "2027-10-01" });
});

test("writes into nested objects and arrays", () => {
  const raw = {
    stateCode: "US_XX",
    nested: { inner: "2021-12-16" },
    creditActivity: [
      { creditDate: "2021-12-16", amount: 1 },
      { creditDate: "2021-12-16", amount: 2 },
    ],
    hearingDates: ["2021-12-16"],
  };

  expect(
    applyShiftedDates(raw, [
      { path: ["nested", "inner"], value: shiftedTo },
      { path: ["creditActivity", 0, "creditDate"], value: shiftedTo },
      { path: ["creditActivity", 1, "creditDate"], value: shiftedTo },
      { path: ["hearingDates", 0], value: shiftedTo },
    ]),
  ).toEqual({
    stateCode: "US_XX",
    nested: { inner: "2027-10-01" },
    creditActivity: [
      { creditDate: "2027-10-01", amount: 1 },
      { creditDate: "2027-10-01", amount: 2 },
    ],
    hearingDates: ["2027-10-01"],
  });
});

test("leaves unrelated fields alone", () => {
  const raw = {
    stateCode: "US_XX",
    externalId: "RES001",
    count: 3,
    flag: false,
    missing: null,
    releaseDate: "2021-12-16",
  };

  expect(
    applyShiftedDates(raw, [{ path: ["releaseDate"], value: shiftedTo }]),
  ).toEqual({
    ...raw,
    releaseDate: "2027-10-01",
  });
});

test("does not mutate its input, including nested values", () => {
  const nested = { inner: "2021-12-16" };
  const listEntry = { creditDate: "2021-12-16" };
  const raw = { nested, creditActivity: [listEntry] };

  applyShiftedDates(raw, [
    { path: ["nested", "inner"], value: shiftedTo },
    { path: ["creditActivity", 0, "creditDate"], value: shiftedTo },
  ]);

  // a shallow copy would pass the top-level check but corrupt these
  expect(nested.inner).toBe("2021-12-16");
  expect(listEntry.creditDate).toBe("2021-12-16");
  expect(raw).toEqual({
    nested: { inner: "2021-12-16" },
    creditActivity: [{ creditDate: "2021-12-16" }],
  });
});

test("returns an equal object when there is nothing to shift", () => {
  const raw = { stateCode: "US_XX", releaseDate: "2021-12-16" };

  expect(applyShiftedDates(raw, [])).toEqual(raw);
});

test("throws when a recorded path does not resolve to a date string", () => {
  // a schema transform that restructures an ancestor of a date field via z.preprocess
  // would produce a path that the raw object does not have. that should fail the import
  // rather than silently writing a date into a field nobody asked for
  expect(() =>
    applyShiftedDates({ stateCode: "US_XX" }, [
      { path: ["notARealField"], value: shiftedTo },
    ]),
  ).toThrow(/notARealField/);
});

test("throws when a recorded path resolves through a missing ancestor", () => {
  expect(() =>
    applyShiftedDates({ stateCode: "US_XX" }, [
      { path: ["missingParent", 0, "creditDate"], value: shiftedTo },
    ]),
  ).toThrow(/missingParent\.0\.creditDate/);
});

test("throws when a recorded path resolves to a non-string value", () => {
  // writing a bare date string over a value the schema had coerced from some other
  // type would change what gets stored, and could fail the parse at read time
  expect(() =>
    applyShiftedDates({ creditActivity: [{ creditDate: 20211216 }] }, [
      { path: ["creditActivity", 0, "creditDate"], value: shiftedTo },
    ]),
  ).toThrow(/found number/);
});
