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

import { renderHook } from "@testing-library/react";
import { Temporal } from "temporal-polyfill";

import { expectedEntriesPerDay, useMonthSkeleton } from "../useMonthSkeleton";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI"] as const;

// Colorado's entries on the Nth Monday to Friday of a month: the hearing
// patterns, the Full Board every Friday, the Business Meeting on the 3rd
// Friday and the Full Board on the 3rd Thursday, among the 3rd Thursday's
// eleven hearings.
const EXPECTED_BY_WEEK: Record<number, number[]> = {
  1: [2, 2, 2, 3, 1],
  2: [2, 2, 2, 2, 1],
  3: [0, 2, 2, 12, 2],
  4: [2, 3, 2, 4, 1],
  5: [0, 0, 0, 0, 1],
};

/** The month's counts as week of month (Nth weekday) then Monday to Friday. */
function countsByWeek(year: number, month: number) {
  const counts = expectedEntriesPerDay({ year, month });
  const first = Temporal.PlainDate.from({ year, month, day: 1 });
  const byWeek: Record<number, (number | null)[]> = {};
  for (let week = 1; week <= 5; week++) {
    byWeek[week] = WEEKDAYS.map(() => null);
  }
  for (let day = 1; day <= first.daysInMonth; day++) {
    const date = first.with({ day });
    if (date.dayOfWeek > 5) continue;
    const week = Math.ceil(day / 7);
    byWeek[week][date.dayOfWeek - 1] = counts.get(date.toString()) ?? 0;
  }
  return byWeek;
}

describe("expectedEntriesPerDay", () => {
  const months = Array.from({ length: 24 }, (_, i) => ({
    year: 2026 + Math.floor(i / 12),
    month: (i % 12) + 1,
  }));

  test.each(months)(
    "gives each Nth weekday of $year-$month Colorado's entries",
    ({ year, month }) => {
      const byWeek = countsByWeek(year, month);
      for (const [week, expected] of Object.entries(EXPECTED_BY_WEEK)) {
        byWeek[Number(week)].forEach((count, i) => {
          // A 5th weekday the month doesn't have.
          if (count === null) return;
          expect([week, WEEKDAYS[i], count]).toEqual([
            week,
            WEEKDAYS[i],
            expected[i],
          ]);
        });
      }
    },
  );

  test("puts nothing on weekends", () => {
    const counts = expectedEntriesPerDay({ year: 2026, month: 8 });

    expect(counts.get("2026-08-01")).toBeUndefined();
    expect(counts.get("2026-08-02")).toBeUndefined();
  });
});

describe("useMonthSkeleton", () => {
  test("passes the month and its counts, in the month view on a wide screen", () => {
    const { result } = renderHook(() =>
      useMonthSkeleton({ year: 2026, month: 9 }),
    );

    expect(result.current.month).toEqual({ year: 2026, month: 9 });
    expect(result.current.view).toBe("month");
    // The 3rd Thursday of September 2026.
    expect(result.current.chipsOn("2026-09-17")).toBe(12);
    expect(result.current.chipsOn("2026-09-06")).toBe(0);
  });

  test("keeps the same props across renders of one month", () => {
    const { result, rerender } = renderHook(() =>
      useMonthSkeleton({ year: 2026, month: 9 }),
    );
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
