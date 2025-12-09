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

import { isDemoMode, isOfflineMode } from "~client-env-utils";

import {
  dateStringSchema,
  dateStringSchemaWithoutTimeShift,
  toDateList,
} from "../dateStringSchema";

vi.mock("~client-env-utils");

test("parses valid ISO date", () => {
  expect(dateStringSchemaWithoutTimeShift.parse("2024-03-20")).toEqual(
    new Date(2024, 2, 20),
  );
});

test("fails on invalid string", () => {
  expect(dateStringSchemaWithoutTimeShift.safeParse("garbage"))
    .toMatchInlineSnapshot(`
    {
      "error": [ZodError: [
      {
        "code": "invalid_string",
        "message": "Invalid ISO date string",
        "validation": "datetime",
        "path": []
      }
    ]],
      "success": false,
    }
  `);
});

test("no time shift", () => {
  expect(dateStringSchema.parse("2024-03-20")).toEqual(new Date(2024, 2, 20));
});

test("fails on non-ISO date format", () => {
  expect(dateStringSchemaWithoutTimeShift.safeParse("3/20/2024"))
    .toMatchInlineSnapshot(`
    {
      "error": [ZodError: [
      {
        "code": "invalid_string",
        "message": "Invalid ISO date string",
        "validation": "datetime",
        "path": []
      }
    ]],
      "success": false,
    }
  `);
});

describe("toDateList", () => {
  test("single entry", () => {
    expect(toDateList("2024-03-20")).toEqual([new Date(2024, 2, 20)]);
  });

  test("multiple entries, no whitespace", () => {
    expect(toDateList("2024-03-20,2024-04-21")).toEqual([
      new Date(2024, 2, 20),
      new Date(2024, 3, 21),
    ]);
  });

  test("multiple entries, whitespace", () => {
    expect(toDateList("2024-03-20, 2024-04-21")).toEqual([
      new Date(2024, 2, 20),
      new Date(2024, 3, 21),
    ]);
  });

  test("invalid date", () => {
    expect(() =>
      toDateList("2024-03-20,4/21/2024"),
    ).toThrowErrorMatchingInlineSnapshot(`
      [ZodError: [
        {
          "code": "invalid_string",
          "message": "Invalid ISO date string",
          "validation": "datetime",
          "path": []
        }
      ]]
    `);
  });
});

describe.each(["demo", "offline"] as const)("in %s mode", (mode) => {
  beforeEach(() => {
    tk.freeze(new Date(2024, 2, 25));
    if (mode === "demo") {
      vi.mocked(isDemoMode).mockReturnValue(true);
    }
    if (mode === "offline") {
      vi.mocked(isOfflineMode).mockReturnValue(true);
    }
  });

  afterEach(() => {
    tk.reset();
  });

  test("parses valid ISO date", () => {
    expect(dateStringSchemaWithoutTimeShift.parse("2024-03-20")).toEqual(
      new Date(2024, 2, 20),
    );
  });

  test("time shifted date", () => {
    expect(dateStringSchema.parse("2021-12-16")).toEqual(new Date(2024, 2, 25));
  });
});
