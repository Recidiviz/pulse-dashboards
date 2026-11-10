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
  buildPaginatedResult,
  buildPaginationArgs,
  paginationSchema,
} from "../pagination";

describe("pagination helpers", () => {
  it("defaults pageSize via Zod and builds take without cursor", () => {
    const parsed = paginationSchema.parse({});
    expect(parsed.pageSize).toBe(7);
    expect(buildPaginationArgs(parsed)).toEqual({ take: 8 });
  });

  it("includes skip+cursor when a cursor is provided", () => {
    expect(buildPaginationArgs({ pageSize: 7, cursor: "app-123" })).toEqual({
      take: 8,
      skip: 1,
      cursor: { id: "app-123" },
    });
  });

  it("returns nextCursor null when items fit on one page", () => {
    const items = [{ id: "a" }, { id: "b" }];
    expect(buildPaginatedResult(items, 2, 7)).toEqual({
      items,
      nextCursor: null,
      total: 2,
    });
  });

  it("slices overflow and sets nextCursor to the last kept id", () => {
    const raw = [
      { id: "1" },
      { id: "2" },
      { id: "3" },
      { id: "4" },
      { id: "5" },
      { id: "6" },
      { id: "7" },
      { id: "8" },
    ];
    expect(buildPaginatedResult(raw, 20, 7)).toEqual({
      items: raw.slice(0, 7),
      nextCursor: "7",
      total: 20,
    });
  });

  it("handles an empty list", () => {
    expect(buildPaginatedResult([], 0, 7)).toEqual({
      items: [],
      nextCursor: null,
      total: 0,
    });
  });
});
