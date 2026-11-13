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
  publicDecember2026,
  publicNovember2026,
} from "~@parole-board/common/fixtures";

import { initialScrollDate } from "../scrollTarget";

describe("initialScrollDate", () => {
  test("picks today in the current month, for this week's row and today's column", () => {
    expect(initialScrollDate(publicNovember2026, "2026-11-19")).toBe(
      "2026-11-19",
    );
  });

  test("picks today even when today has no sessions", () => {
    expect(initialScrollDate(publicNovember2026, "2026-11-21")).toBe(
      "2026-11-21",
    );
  });

  test("picks the first day with sessions in another month", () => {
    expect(initialScrollDate(publicNovember2026, "2026-10-15")).toBe(
      "2026-11-02",
    );
    expect(initialScrollDate(publicDecember2026, "2026-11-03")).toBe(
      "2026-12-01",
    );
  });

  test("picks nothing in another month with no sessions", () => {
    const empty = {
      ...publicDecember2026,
      days: publicDecember2026.days.map((day) => ({ ...day, entries: [] })),
    };
    expect(initialScrollDate(empty, "2026-11-03")).toBeNull();
  });
});
