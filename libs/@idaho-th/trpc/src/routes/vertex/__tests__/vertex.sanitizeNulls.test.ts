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

import { sanitizeNulls } from "../vertex.sanitizeNulls";

describe("sanitizeNulls", () => {
  it("converts null-equivalent strings to null", () => {
    expect(sanitizeNulls("null")).toBeNull();
    expect(sanitizeNulls("N/A")).toBeNull();
    expect(sanitizeNulls("  none  ")).toBeNull();
    expect(sanitizeNulls("--")).toBeNull();
    expect(sanitizeNulls("unknown")).toBeNull();
  });

  it("preserves real string values", () => {
    expect(sanitizeNulls("Jane Doe")).toBe("Jane Doe");
  });

  it("returns null for nullish roots and leaves non-string primitives alone", () => {
    expect(sanitizeNulls(null)).toBeNull();
    expect(sanitizeNulls(undefined)).toBeNull();
    expect(sanitizeNulls(42)).toBe(42);
    expect(sanitizeNulls(true)).toBe(true);
  });

  it("sanitizes nested objects and arrays in place of clones", () => {
    const input = {
      name: "null",
      nested: { note: "N/A", keep: "ok" },
      list: ["none", "real", null],
    };

    expect(sanitizeNulls(input)).toEqual({
      name: null,
      nested: { note: null, keep: "ok" },
      list: [null, "real", null],
    });
  });
});
