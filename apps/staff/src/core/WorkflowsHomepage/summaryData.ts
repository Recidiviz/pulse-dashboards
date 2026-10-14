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

// What one opportunity type's homepage card renders, however it was arrived at.
//
// The card has two sources: a hydrated opportunity list, and the counts a
// Typesense search returned without fetching the caseload. Both resolve to this
// shape in a presenter, so no component branches on which one it got.

import { countBy } from "lodash";

import type { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { OpportunityTabGroup } from "../../WorkflowsStore";
import { countOpportunities } from "../../WorkflowsStore/Opportunity/utils/generateHeadersUtils";

/** The two numbers `OutstandingItemsAlerts` reports. */
export type AlertCounts = {
  eligibleStale: number;
  pendingOverdue: number;
};

export type OpportunitySummaryData = {
  /** Per tab title, how many records sit on it. */
  tabCounts: Record<string, number>;
  /**
   * The card's headline number, and NOT the sum of `tabCounts`: a type may
   * configure its own `countByFunction`, and the default drops submitted,
   * denied and ineligible records.
   */
  totalCount: number;
  /** The people whose avatars the card shows. */
  people: JusticeInvolvedPerson[];
  alerts: AlertCounts;
};

const NO_ALERTS: AlertCounts = { eligibleStale: 0, pendingOverdue: 0 };

export const EMPTY_SUMMARY: OpportunitySummaryData = {
  tabCounts: {},
  totalCount: 0,
  people: [],
  alerts: NO_ALERTS,
};

/** One type's summary, from a hydrated list of its opportunities. */
export function summaryFromOpportunities(
  opportunities: Opportunity[],
): OpportunitySummaryData {
  if (opportunities.length === 0) return EMPTY_SUMMARY;

  const tabGroup = Object.keys(
    opportunities[0].config.tabGroups,
  )[0] as OpportunityTabGroup;

  return {
    tabCounts: countBy(opportunities, (opp) => opp.tabTitle(tabGroup)),
    totalCount: countOpportunities(opportunities),
    people: opportunities.map((opp) => opp.person),
    alerts: {
      eligibleStale: opportunities.filter((o) => o.isEligibleStaleViewed)
        .length,
      pendingOverdue: opportunities.filter((o) => o.isPendingOverdue).length,
    },
  };
}

/**
 * One type's summary, from a search that never fetched the caseload.
 *
 * `totalCount` is passed in rather than summed from `tabCounts`: the census
 * already dropped what `countOpportunities` would. See `reconstructTabCounts`.
 */
export function summaryFromCounts(
  tabCounts: Record<string, number>,
  totalCount: number,
  people: JusticeInvolvedPerson[] = [],
  alerts: AlertCounts = NO_ALERTS,
): OpportunitySummaryData {
  return {
    tabCounts,
    totalCount,
    people,
    alerts,
  };
}

/**
 * Whether a type's card would render anything.
 *
 * Filtered to the FIRST tab group, the one the card displays: counts parked on
 * any other tab show the user nothing.
 */
export function hasDisplayableTabs(
  { tabCounts }: OpportunitySummaryData,
  tabGroups: Partial<Record<OpportunityTabGroup, readonly string[]>>,
): boolean {
  const displayedTabs = Object.values(tabGroups)[0] ?? [];
  return Object.entries(tabCounts).some(
    ([tab, count]) => count > 0 && displayedTabs.includes(tab),
  );
}
