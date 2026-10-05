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

import { startOfDay, subDays } from "date-fns";

import {
  isStaleByThreshold,
  staleCutoffSeconds,
  staleRangeFacet,
} from "../staleCutoff";

const TODAY = startOfDay(new Date(2026, 8, 14));
const THRESHOLD = 14;

function secondsOf(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

describe("the cutoff agrees with the predicate it reproduces", () => {
  // The facet counts a record when its timestamp falls below the cutoff. The
  // component counts it when `differenceInDays >= threshold`. These must agree
  // on every day near the boundary, or the count is quietly off by a few.
  test.each([0, 1, 12, 13, 14, 15, 30])(
    "a record %i days old lands on the same side of both",
    (age) => {
      const clockStart = subDays(TODAY, age);
      const cutoff = staleCutoffSeconds(THRESHOLD, TODAY);

      expect(secondsOf(clockStart) < cutoff).toBe(
        isStaleByThreshold(clockStart, THRESHOLD, TODAY),
      );
    },
  );

  test("a record exactly on the boundary is stale", () => {
    // `differenceInDays` truncates, so 14 days old meets `>= 14`.
    const boundary = subDays(TODAY, THRESHOLD);

    expect(isStaleByThreshold(boundary, THRESHOLD, TODAY)).toBe(true);
    expect(secondsOf(boundary)).toBeLessThan(
      staleCutoffSeconds(THRESHOLD, TODAY),
    );
  });

  test("a record one day short of the boundary is not stale", () => {
    const justInside = subDays(TODAY, THRESHOLD - 1);

    expect(isStaleByThreshold(justInside, THRESHOLD, TODAY)).toBe(false);
    expect(secondsOf(justInside)).toBeGreaterThanOrEqual(
      staleCutoffSeconds(THRESHOLD, TODAY),
    );
  });
});

describe("the emitted range facet", () => {
  test("carries the field, a zero floor, and the cutoff", () => {
    const cutoff = staleCutoffSeconds(THRESHOLD, TODAY);

    expect(staleRangeFacet("lastViewedTimestamp", THRESHOLD, TODAY)).toBe(
      `lastViewedTimestamp(stale:[0, ${cutoff}])`,
    );
  });

  test("is in seconds, not milliseconds", () => {
    // A milliseconds value against a seconds field makes every record look
    // ancient, or none of them, with no error and no failing assertion
    // anywhere else in the suite.
    const cutoff = staleCutoffSeconds(THRESHOLD, TODAY);

    expect(cutoff).toBeLessThan(secondsOf(TODAY) + 1);
    expect(String(cutoff)).toHaveLength(10);
  });
});
