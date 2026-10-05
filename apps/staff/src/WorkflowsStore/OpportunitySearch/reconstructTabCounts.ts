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

// The per-type tab histogram the homepage renders, WITHOUT fetching the
// caseload.
//
// The census returns each bucket's size plus one real document from it; the
// acted-on records arrive in full. Both sides are LABELLED by the real
// `tabTitle()` before they reach this file, so this is arithmetic only.

/** One census group, already labelled by an exemplar's `tabTitle()`. */
export type CensusBucket = {
  opportunityType: string;
  /** What `tabTitle()` returned for an exemplar carrying no overlay. */
  untouchedTab: string;
  /** Every record in the bucket, including those someone has acted on. */
  count: number;
};

/** One acted-on document, labelled twice by the real `tabTitle()`. */
export type ActedOnTab = {
  opportunityType: string;
  /** Where it actually belongs, with its overlay applied. */
  tab: string;
  /** Where the census counted it, so the same record is not counted twice. */
  untouchedTab: string;
};

export type ReconstructTabCountsInput = {
  buckets: CensusBucket[];
  /**
   * Restricted to records the census also counted.
   *
   * The caller checks that its search was not under-fetched before calling —
   * it is the one that knows the page size, and `found` there counts the whole
   * acted-on set rather than this scoped subset.
   */
  actedOn: ActedOnTab[];
};

export type TabCounts = Record<string, number>;

export type ReconstructTabCountsResult = {
  /** Per opportunity type, the count for each tab that has one. */
  countsByType: Record<string, TabCounts>;
  /**
   * Types whose arithmetic did not hold, excluded from `countsByType`.
   *
   * Nothing reads this, so the homepage renders no card for them. That is a
   * launch blocker, not a steady state: this has to come back empty for every
   * tenant before the gate opens. See OBT-53660.
   */
  unreconstructable: string[];
};

function add(counts: TabCounts, tab: string, delta: number): void {
  counts[tab] = (counts[tab] ?? 0) + delta;
}

/**
 * The per-type histogram, from the census buckets and the acted-on documents.
 *
 * A per-type contradiction is REPORTED rather than thrown, so one bad type
 * does not take the other twenty down with it.
 */
export function reconstructTabCounts({
  buckets,
  actedOn,
}: ReconstructTabCountsInput): ReconstructTabCountsResult {
  const countsByType: Record<string, TabCounts> = {};

  // Several buckets can carry one label — the MI reviews fold DUE and UPCOMING
  // into "Due" — so this accumulates rather than assigns.
  for (const bucket of buckets) {
    countsByType[bucket.opportunityType] ??= {};
    add(
      countsByType[bucket.opportunityType],
      bucket.untouchedTab,
      bucket.count,
    );
  }

  const contradictory = new Set<string>();

  for (const record of actedOn) {
    const counts = countsByType[record.opportunityType];
    if (!counts) {
      // The census never saw this type, so there is nothing to move the record
      // out of. Counting it alone would report a total below the truth.
      contradictory.add(record.opportunityType);
      continue;
    }
    add(counts, record.untouchedTab, -1);
    add(counts, record.tab, 1);
  }

  for (const [opportunityType, counts] of Object.entries(countsByType)) {
    if (Object.values(counts).some((count) => count < 0)) {
      // A negative is impossible against consistent inputs: it means an
      // exemplar did not speak for its bucket.
      contradictory.add(opportunityType);
    }
  }

  for (const opportunityType of contradictory) {
    delete countsByType[opportunityType];
  }

  // A tab at zero is not rendered, and carrying it would make an empty type
  // look like a populated one.
  for (const counts of Object.values(countsByType)) {
    for (const [tab, count] of Object.entries(counts)) {
      if (count === 0) delete counts[tab];
    }
  }

  return {
    countsByType,
    unreconstructable: [...contradictory].sort(),
  };
}
