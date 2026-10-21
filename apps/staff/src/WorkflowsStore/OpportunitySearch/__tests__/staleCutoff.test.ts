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

import { addHours, startOfDay, subDays } from "date-fns";

import {
  isStaleByThreshold,
  staleCutoffSeconds,
  staleRangeFacet,
  utcMidnightSeconds,
} from "../staleCutoff";

const TODAY = startOfDay(new Date(2026, 8, 14));
const THRESHOLD = 14;

function secondsOf(date: Date) {
  return Math.floor(date.getTime() / 1000);
}

describe("an `timestamp` field, holding a real moment", () => {
  // The facet counts a record when its timestamp falls below the cutoff. The
  // component counts it when `differenceInDays >= threshold`. These must agree
  // on every day near the boundary, or the count is quietly off by a few.
  test.each([0, 1, 12, 13, 14, 15, 30])(
    "a record %i days old lands on the same side of both",
    (age) => {
      const clockStart = subDays(TODAY, age);
      const cutoff = staleCutoffSeconds(THRESHOLD, "timestamp", TODAY);

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
      staleCutoffSeconds(THRESHOLD, "timestamp", TODAY),
    );
  });

  test("a record one day short of the boundary is not stale", () => {
    const justInside = subDays(TODAY, THRESHOLD - 1);

    expect(isStaleByThreshold(justInside, THRESHOLD, TODAY)).toBe(false);
    expect(secondsOf(justInside)).toBeGreaterThanOrEqual(
      staleCutoffSeconds(THRESHOLD, "timestamp", TODAY),
    );
  });

  // A viewed-at or submitted-at carries a time of day, which a midnight-only
  // suite never exercises. The old cutoff sat a whole day late and counted
  // every one of these.
  test.each([1, 6, 13, 23])(
    "a record viewed %i hours into the boundary day is NOT yet stale",
    (hours) => {
      const viewedAt = addHours(subDays(TODAY, THRESHOLD), hours);

      expect(isStaleByThreshold(viewedAt, THRESHOLD, TODAY)).toBe(false);
      expect(secondsOf(viewedAt)).toBeGreaterThanOrEqual(
        staleCutoffSeconds(THRESHOLD, "timestamp", TODAY),
      );
    },
  );
});

describe("a `date` field, indexed at UTC midnight", () => {
  // The bug this file now pins: the app reads the date as LOCAL midnight and
  // the index wrote it as UTC midnight, so a cutoff built from `startOfToday()`
  // met the indexed value an offset early. West of UTC that counted every
  // date-only record a day sooner than the component did.
  //
  // Each case therefore holds the app's value and the index's side by side:
  // `subDays(TODAY, age)` is what the app parses, and `utcMidnightSeconds` of
  // it is what the backfill stored.
  test.each([0, 1, 12, 13, 14, 15, 30])(
    "a record %i days old lands on the same side of both",
    (age) => {
      const appValue = subDays(TODAY, age);
      const cutoff = staleCutoffSeconds(THRESHOLD, "date", TODAY);

      expect(utcMidnightSeconds(appValue) < cutoff).toBe(
        isStaleByThreshold(appValue, THRESHOLD, TODAY),
      );
    },
  );

  test("a record exactly on the boundary is stale", () => {
    const boundary = subDays(TODAY, THRESHOLD);

    expect(isStaleByThreshold(boundary, THRESHOLD, TODAY)).toBe(true);
    expect(utcMidnightSeconds(boundary)).toBeLessThan(
      staleCutoffSeconds(THRESHOLD, "date", TODAY),
    );
  });

  test("a record one day short of the boundary is not stale", () => {
    const justInside = subDays(TODAY, THRESHOLD - 1);

    expect(isStaleByThreshold(justInside, THRESHOLD, TODAY)).toBe(false);
    expect(utcMidnightSeconds(justInside)).toBeGreaterThanOrEqual(
      staleCutoffSeconds(THRESHOLD, "date", TODAY),
    );
  });

  // NOTE: this suite runs in UTC, where local midnight and UTC midnight are
  // the same moment, so the two kinds coincide and these assertions pass
  // whichever anchor the cutoff uses. That is precisely how the bug shipped.
  // Run the file with `TZ=America/Los_Angeles` to exercise the real case.
  test("the gap between the two kinds is the UTC offset", () => {
    const dateCutoff = staleCutoffSeconds(THRESHOLD, "date", TODAY);
    const timestampCutoff = staleCutoffSeconds(THRESHOLD, "timestamp", TODAY);

    // Written as an addition rather than a difference: `toBe` distinguishes
    // `-0` from `0`, and negating a zero offset produces the first.
    expect(dateCutoff).toBe(timestampCutoff - TODAY.getTimezoneOffset() * 60);
  });
});

describe("the emitted range facet", () => {
  test("carries the field, a zero floor, and the cutoff", () => {
    const cutoff = staleCutoffSeconds(THRESHOLD, "timestamp", TODAY);

    expect(
      staleRangeFacet("lastViewedTimestamp", THRESHOLD, "timestamp", TODAY),
    ).toBe(`lastViewedTimestamp(stale:[0, ${cutoff}])`);
  });

  test("passes the kind through, so the two fields differ off UTC", () => {
    const asDate = staleRangeFacet(
      "eligibleDateTimestamp",
      THRESHOLD,
      "date",
      TODAY,
    );
    const asInstant = staleRangeFacet(
      "eligibleDateTimestamp",
      THRESHOLD,
      "timestamp",
      TODAY,
    );

    if (TODAY.getTimezoneOffset() === 0) {
      expect(asDate).toBe(asInstant);
    } else {
      expect(asDate).not.toBe(asInstant);
    }
  });

  test("is in seconds, not milliseconds", () => {
    // A milliseconds value against a seconds field makes every record look
    // ancient, or none of them, with no error and no failing assertion
    // anywhere else in the suite.
    const cutoff = staleCutoffSeconds(THRESHOLD, "timestamp", TODAY);

    expect(cutoff).toBeLessThan(secondsOf(TODAY) + 1);
    expect(String(cutoff)).toHaveLength(10);
  });
});
