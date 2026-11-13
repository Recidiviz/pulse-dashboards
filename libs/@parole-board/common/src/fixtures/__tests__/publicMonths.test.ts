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
  publicJanuary2027,
  publicNovember2026,
  publicNovember2026WithCancelledMeeting,
} from "../publicMonths";

const months = [publicNovember2026, publicDecember2026, publicJanuary2027];

describe("public months", () => {
  test.each(months)("$title lists every date of its month in order", (m) => {
    const dates = m.days.map((d) => d.date);
    expect(dates[0]).toBe(`${m.month}-01`);
    expect(dates).toEqual([...dates].sort());
    expect(new Set(dates).size).toBe(dates.length);
    const lastDay = Number(dates[dates.length - 1].slice(-2));
    expect(dates).toHaveLength(lastDay);
  });

  test("link to each other in order, with null at either end", () => {
    expect(months.map((m) => [m.previous, m.month, m.next])).toEqual([
      [null, "2026-11", "2026-12"],
      ["2026-11", "2026-12", "2027-01"],
      ["2026-12", "2027-01", null],
    ]);
  });

  test("cancels only the Full Board meeting on November 13th in the cancelled variant", () => {
    const cancelled = publicNovember2026WithCancelledMeeting.days.flatMap((d) =>
      d.entries.filter((e) => e.cancelled).map((e) => `${d.date} ${e.label}`),
    );
    expect(cancelled).toEqual(["2026-11-13 Full Board"]);
  });
});
