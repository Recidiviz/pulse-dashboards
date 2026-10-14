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

import type { Opportunity } from "../../../WorkflowsStore";
import {
  EMPTY_SUMMARY,
  hasDisplayableTabs,
  summaryFromCounts,
  summaryFromOpportunities,
} from "../summaryData";

const CONFIG = {
  tabGroups: { "ELIGIBILITY STATUS": ["Eligible Now", "Almost Eligible"] },
};

function opp(
  tab: string,
  overrides: Partial<Record<string, unknown>> = {},
): Opportunity {
  return {
    type: "usNeGoodTimeRestoration",
    config: CONFIG,
    tabTitle: () => tab,
    person: { recordId: `r-${tab}-${JSON.stringify(overrides)}` },
    isSubmitted: false,
    denial: undefined,
    isIneligible: false,
    isEligibleStaleViewed: false,
    isPendingOverdue: false,
    ...overrides,
  } as unknown as Opportunity;
}

describe("summaryFromOpportunities", () => {
  test("counts each tab by the class's own tabTitle()", () => {
    const summary = summaryFromOpportunities([
      opp("Eligible Now"),
      opp("Eligible Now"),
      opp("Almost Eligible"),
    ]);

    expect(summary.tabCounts).toEqual({
      "Eligible Now": 2,
      "Almost Eligible": 1,
    });
  });

  test("the headline is NOT the sum of the tabs", () => {
    // `countOpportunities` drops submitted, denied and ineligible records,
    // which still occupy a tab. Summing here would over-report the headline.
    const summary = summaryFromOpportunities([
      opp("Eligible Now"),
      opp("Eligible Now", { isSubmitted: true }),
      opp("Eligible Now", { isIneligible: true }),
    ]);

    expect(summary.tabCounts["Eligible Now"]).toBe(3);
    expect(summary.totalCount).toBe(1);
  });

  test("carries one person per opportunity, undeduplicated", () => {
    expect(
      summaryFromOpportunities([opp("Eligible Now"), opp("Almost Eligible")])
        .people,
    ).toHaveLength(2);
  });

  test("counts the two alert rows off the records", () => {
    const summary = summaryFromOpportunities([
      opp("Eligible Now", { isEligibleStaleViewed: true }),
      opp("Eligible Now", { isPendingOverdue: true }),
      opp("Eligible Now"),
    ]);

    expect(summary.alerts).toEqual({ eligibleStale: 1, pendingOverdue: 1 });
  });

  test("an empty list yields the empty summary, not a throw", () => {
    expect(summaryFromOpportunities([])).toBe(EMPTY_SUMMARY);
  });
});

describe("summaryFromCounts", () => {
  test("takes the headline given, rather than summing the tabs", () => {
    // THE point of OBT-52517: summing would say 15 and count three
    // ineligible records the card must not.
    expect(
      summaryFromCounts({ "Eligible Now": 12, "Marked Ineligible": 3 }, 12)
        .totalCount,
    ).toBe(12);
  });

  test("defaults people and alerts rather than leaving them undefined", () => {
    const summary = summaryFromCounts({ "Eligible Now": 1 }, 1);

    expect(summary.people).toEqual([]);
    expect(summary.alerts).toEqual({ eligibleStale: 0, pendingOverdue: 0 });
  });
});

describe("hasDisplayableTabs", () => {
  test("ignores a count parked on a tab the card never renders", () => {
    expect(
      hasDisplayableTabs(summaryFromCounts({ Other: 9 }, 9), CONFIG.tabGroups),
    ).toBe(false);
  });

  test("is true for a populated tab in the first group", () => {
    expect(
      hasDisplayableTabs(
        summaryFromCounts({ "Eligible Now": 1 }, 1),
        CONFIG.tabGroups,
      ),
    ).toBe(true);
  });

  test("a zeroed tab does not count", () => {
    expect(
      hasDisplayableTabs(
        summaryFromCounts({ "Eligible Now": 0 }, 0),
        CONFIG.tabGroups,
      ),
    ).toBe(false);
  });
});
