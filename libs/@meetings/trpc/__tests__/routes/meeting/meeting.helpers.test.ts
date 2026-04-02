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

import { describe, expect, test } from "vitest";

import { getPersonNameTokens } from "~@meetings/trpc/routes/meeting.helpers";

describe("getPersonNameTokens", () => {
  test("returns given name and surname as tokens", () => {
    expect(
      getPersonNameTokens({ givenNames: "John", surname: "Smith" }),
    ).toEqual(["John", "Smith"]);
  });

  test("splits multi-word given names into separate tokens", () => {
    expect(
      getPersonNameTokens({ givenNames: "Mary Jane", surname: "Watson" }),
    ).toEqual(["Mary", "Jane", "Watson"]);
  });

  test("includes middle name when present", () => {
    expect(
      getPersonNameTokens({
        givenNames: "John",
        middleNames: "Paul",
        surname: "Jones",
      }),
    ).toEqual(["John", "Paul", "Jones"]);
  });

  test("splits multi-word middle names into separate tokens", () => {
    expect(
      getPersonNameTokens({
        givenNames: "John",
        middleNames: "Paul George",
        surname: "PeteBest",
      }),
    ).toEqual(["John", "Paul", "George", "PeteBest"]);
  });

  test("omits middle name when null", () => {
    expect(
      getPersonNameTokens({
        givenNames: "John",
        middleNames: null,
        surname: "Smith",
      }),
    ).toEqual(["John", "Smith"]);
  });

  test("omits middle name when undefined", () => {
    expect(
      getPersonNameTokens({
        givenNames: "John",
        middleNames: undefined,
        surname: "Smith",
      }),
    ).toEqual(["John", "Smith"]);
  });

  test("filters out empty strings from blank middle name", () => {
    expect(
      getPersonNameTokens({
        givenNames: "John",
        middleNames: "",
        surname: "Smith",
      }),
    ).toEqual(["John", "Smith"]);
  });
});
