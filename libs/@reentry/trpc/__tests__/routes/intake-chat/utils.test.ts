// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { parseAddress } from "~@reentry/trpc/routes/intake-chat/utils";

describe("parseAddress", () => {
  test("should return undefined for null input", () => {
    const result = parseAddress(null);
    expect(result).toBeUndefined();
  });

  test("should return undefined for undefined input", () => {
    const result = parseAddress(undefined);
    expect(result).toBeUndefined();
  });

  test("should return undefined for empty string", () => {
    const result = parseAddress("");
    expect(result).toBeUndefined();
  });

  test("should parse city and state (2 parts)", () => {
    const result = parseAddress("New York, NY");
    expect(result).toEqual({
      city: "New York",
      state: "NY",
    });
  });

  test("should parse street address, city, and state (3 parts)", () => {
    const result = parseAddress("123 Main St, New York, NY");
    expect(result).toEqual({
      street_address: "123 Main St",
      city: "New York",
      state: "NY",
    });
  });

  test("should handle street address with comma (4 parts)", () => {
    const result = parseAddress("123 Fake St, Apt 2, New York, NY");
    expect(result).toEqual({
      street_address: "123 Fake St, Apt 2",
      city: "New York",
      state: "NY",
    });
  });

  test("should handle street address with multiple commas (5+ parts)", () => {
    const result = parseAddress(
      "Building A, 123 Main St, Suite 200, Los Angeles, CA",
    );
    expect(result).toEqual({
      street_address: "Building A, 123 Main St, Suite 200",
      city: "Los Angeles",
      state: "CA",
    });
  });

  test("should trim whitespace from all parts", () => {
    const result = parseAddress("  123 Main St  ,  New York  ,  NY  ");
    expect(result).toEqual({
      street_address: "123 Main St",
      city: "New York",
      state: "NY",
    });
  });

  test("should throw error for single part (missing city or state)", () => {
    expect(() => parseAddress("New York")).toThrow(
      "Invalid address format. Expected at least 2 parts (city, state), got 1.",
    );
  });
});
