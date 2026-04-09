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

import { describe, expect, it } from "vitest";

import { CHAR_LIMIT, exceedsCharLimit } from "../../src/hooks/useGuardrails";

describe("CHAR_LIMIT", () => {
  it("is 2500", () => {
    expect(CHAR_LIMIT).toBe(2500);
  });
});

describe("exceedsCharLimit", () => {
  it("returns false for empty string", () => {
    expect(exceedsCharLimit("")).toBe(false);
  });

  it("returns false for message under the limit", () => {
    expect(exceedsCharLimit("a".repeat(CHAR_LIMIT - 1))).toBe(false);
  });

  it("returns false at exactly the limit", () => {
    expect(exceedsCharLimit("a".repeat(CHAR_LIMIT))).toBe(false);
  });

  it("returns true for message over the limit", () => {
    expect(exceedsCharLimit("a".repeat(CHAR_LIMIT + 1))).toBe(true);
  });
});
