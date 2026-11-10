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
  formatDobWithAge,
  joinOrUndefined,
  normalizeStringList,
} from "../ApplicationDetailsView.utils";

describe("normalizeStringList", () => {
  it("filters blank and nullish string tokens", () => {
    expect(
      normalizeStringList(["Idaho", " ", "null", "undefined", "Boise"]),
    ).toEqual(["Idaho", "Boise"]);
  });

  it("wraps a single string value", () => {
    expect(normalizeStringList("District 3")).toEqual(["District 3"]);
  });

  it("returns an empty list for nullish input", () => {
    expect(normalizeStringList(null)).toEqual([]);
    expect(normalizeStringList(undefined)).toEqual([]);
  });
});

describe("joinOrUndefined", () => {
  it("joins non-empty values with commas", () => {
    expect(joinOrUndefined(["A", "B"])).toBe("A, B");
  });

  it("returns undefined when nothing remains after filtering", () => {
    expect(joinOrUndefined([" ", "null"])).toBeUndefined();
    expect(joinOrUndefined([])).toBeUndefined();
  });
});

describe("formatDobWithAge", () => {
  it("formats DOB with age in parentheses", () => {
    expect(formatDobWithAge("04/20/1990", 36)).toBe("04/20/1990 (36)");
  });

  it("returns only DOB or only age when one side is missing", () => {
    expect(formatDobWithAge("04/20/1990", null)).toBe("04/20/1990");
    expect(formatDobWithAge(null, 36)).toBe("36");
  });

  it("returns undefined when both DOB and age are missing", () => {
    expect(formatDobWithAge(null, null)).toBeUndefined();
    expect(formatDobWithAge("", "")).toBeUndefined();
  });

  it("formats Date objects as MM/dd/yyyy", () => {
    expect(formatDobWithAge(new Date(1990, 3, 20), 36)).toBe("04/20/1990 (36)");
  });
});
