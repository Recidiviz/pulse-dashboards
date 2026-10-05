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

import { describe, expect, test } from "vitest";

import {
  type ActedOnTab,
  type CensusBucket,
  reconstructTabCounts,
} from "../reconstructTabCounts";

function bucket(
  untouchedTab: string,
  count: number,
  opportunityType = "usTnLSU",
): CensusBucket {
  return { opportunityType, untouchedTab, count };
}

function acted(
  untouchedTab: string,
  tab: string,
  opportunityType = "usTnLSU",
): ActedOnTab {
  return { opportunityType, untouchedTab, tab };
}

function run(buckets: CensusBucket[], actedOn: ActedOnTab[] = []) {
  return reconstructTabCounts({ buckets, actedOn });
}

describe("with nobody having acted", () => {
  test("the census counts pass straight through", () => {
    expect(
      run([bucket("Eligible Now", 12), bucket("Almost Eligible", 3)]),
    ).toEqual({
      countsByType: { usTnLSU: { "Eligible Now": 12, "Almost Eligible": 3 } },
      unreconstructable: [],
    });
  });

  test("buckets sharing a label are summed, not overwritten", () => {
    // The MI reviews fold DUE and UPCOMING into one "Due" tab, so two census
    // groups arrive carrying the same label.
    expect(run([bucket("Due", 4), bucket("Due", 6)]).countsByType).toEqual({
      usTnLSU: { Due: 10 },
    });
  });

  test("keeps types apart", () => {
    const result = run([
      bucket("Eligible Now", 2, "usTnLSU"),
      bucket("Overdue", 5, "usMiPastFTRD"),
    ]);

    expect(result.countsByType).toEqual({
      usTnLSU: { "Eligible Now": 2 },
      usMiPastFTRD: { Overdue: 5 },
    });
  });
});

describe("moving an acted-on record", () => {
  test("leaves its untouched bucket and joins its real tab", () => {
    // THE subtraction. The census counted this record as untouched because its
    // exemplar carried no overlay; the record itself has a denial.
    const result = run(
      [bucket("Eligible Now", 10)],
      [acted("Eligible Now", "Marked Ineligible")],
    );

    expect(result.countsByType).toEqual({
      usTnLSU: { "Eligible Now": 9, "Marked Ineligible": 1 },
    });
  });

  test("the total is unchanged — a record moves, it does not vanish", () => {
    const result = run(
      [bucket("Eligible Now", 10), bucket("Almost Eligible", 5)],
      [acted("Eligible Now", "Submitted"), acted("Almost Eligible", "Denied")],
    );

    const total = Object.values(result.countsByType["usTnLSU"]).reduce(
      (a, b) => a + b,
      0,
    );
    expect(total).toBe(15);
  });

  test("a tab emptied by the move is dropped, not left at zero", () => {
    // A zero would render as a populated tab with no rows behind it.
    const result = run(
      [bucket("Eligible Now", 1)],
      [acted("Eligible Now", "Submitted")],
    );

    expect(result.countsByType).toEqual({ usTnLSU: { Submitted: 1 } });
  });

  test("a record can move INTO a tab the census also populated", () => {
    const result = run(
      [bucket("Eligible Now", 4), bucket("Almost Eligible", 2)],
      [acted("Eligible Now", "Almost Eligible")],
    );

    expect(result.countsByType["usTnLSU"]).toEqual({
      "Eligible Now": 3,
      "Almost Eligible": 3,
    });
  });
});

describe("an inconsistency", () => {
  test("drops the ONE type whose exemplar did not speak for its bucket", () => {
    // What `usIaCompleteSupervisionLevelDowngrade` does: its untouched tab
    // reads the companion opportunity's denial, so records in one census
    // bucket land on different tabs and the subtraction goes negative.
    const result = run(
      [
        bucket(
          "Pending Eligibility",
          1,
          "usIaCompleteSupervisionLevelDowngrade",
        ),
      ],
      [
        acted(
          "Almost Eligible",
          "Submitted",
          "usIaCompleteSupervisionLevelDowngrade",
        ),
      ],
    );

    expect(result.countsByType).toEqual({});
    expect(result.unreconstructable).toEqual([
      "usIaCompleteSupervisionLevelDowngrade",
    ]);
  });

  test("does not take the other types down with it", () => {
    // One bad type must not blank the homepage.
    const result = run(
      [
        bucket("Eligible Now", 7, "usTnLSU"),
        bucket(
          "Pending Eligibility",
          1,
          "usIaCompleteSupervisionLevelDowngrade",
        ),
      ],
      [
        acted(
          "Almost Eligible",
          "Submitted",
          "usIaCompleteSupervisionLevelDowngrade",
        ),
      ],
    );

    expect(result.countsByType).toEqual({ usTnLSU: { "Eligible Now": 7 } });
    expect(result.unreconstructable).toEqual([
      "usIaCompleteSupervisionLevelDowngrade",
    ]);
  });

  test("reports a type the census never saw", () => {
    // Counting it alone would report a total below the truth, because there is
    // no bucket to move the record out of.
    const result = run(
      [bucket("Eligible Now", 3, "usTnLSU")],
      [acted("Eligible Now", "Denied", "usTnExpiration")],
    );

    expect(result.unreconstructable).toEqual(["usTnExpiration"]);
    expect(result.countsByType).toEqual({ usTnLSU: { "Eligible Now": 3 } });
  });
});
