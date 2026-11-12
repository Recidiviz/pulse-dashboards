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
  september2026Config,
  september2026MonthDetailWithHolidayHearings,
} from "../september2026Month";

describe("september2026MonthDetailWithHolidayHearings", () => {
  const { entries, counts, holidays } =
    september2026MonthDetailWithHolidayHearings;

  test("names Labor Day on the two hearings added on it, and on no other entry", () => {
    const named = entries.filter((e) => e.holidayName);
    expect(named.map((e) => [e.date, e.label, e.holidayName])).toEqual([
      ["2026-09-07", "FCF", "Labor Day"],
      ["2026-09-07", "CTCF", "Labor Day"],
    ]);
    expect(named.every((e) => e.source === "MANUAL")).toBe(true);
    expect(holidays).toEqual([{ date: "2026-09-07", name: "Labor Day" }]);
  });

  test("counts the hearings and hearing days its entries hold", () => {
    const hearings = entries.filter((e) => e.kind.countsTowardTotal);
    expect(counts).toEqual({
      entryCount: hearings.length,
      entryDays: new Set(hearings.map((e) => e.date)).size,
    });
  });

  test("has every hearing location in the config", () => {
    const resourceIds = new Set(september2026Config.resources.map((r) => r.id));
    for (const entry of entries) {
      if (entry.resource) expect(resourceIds).toContain(entry.resource.id);
    }
  });
});
