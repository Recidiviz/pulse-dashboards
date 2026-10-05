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

import { differenceInDays, startOfToday, subDays } from "date-fns";

/**
 * The exclusive upper bound, in epoch SECONDS, for a Typesense range facet that
 * counts records at least `thresholdDays` old.
 *
 * Reproduces `differenceInDays(startOfToday(), clockStart) >= thresholdDays`,
 * which `OpportunityBase` evaluates per record. Four properties decide whether
 * the count matches:
 *
 *   1. Measured from `startOfToday()`, not `now`, which would move records in
 *      and out between two renders on the same day.
 *   2. `startOfToday()` is LOCAL, so the conversion belongs on the client.
 *   3. `differenceInDays` truncates, so a record on the boundary counts.
 *   4. A range facet's end is EXCLUSIVE, so the bound is one day later.
 *
 * Returns SECONDS. A milliseconds value against a seconds field makes every
 * record look ancient, or none of them, with no error.
 */
export function staleCutoffSeconds(
  thresholdDays: number,
  today: Date = startOfToday(),
): number {
  // The oldest instant that is NOT yet stale, so the exclusive bound lands one
  // day past the last stale record.
  const boundary = subDays(today, thresholdDays - 1);
  return Math.floor(boundary.getTime() / 1000);
}

/** The range-facet expression counting records at least `thresholdDays` old. */
export function staleRangeFacet(
  field: string,
  thresholdDays: number,
  today: Date = startOfToday(),
): string {
  return `${field}(stale:[0, ${staleCutoffSeconds(thresholdDays, today)}])`;
}

/**
 * True when a record whose clock started at `clockStart` is stale today. The
 * predicate the cutoff reproduces, kept beside it so a test can assert the two
 * agree rather than trusting the arithmetic.
 */
export function isStaleByThreshold(
  clockStart: Date,
  thresholdDays: number,
  today: Date = startOfToday(),
): boolean {
  return differenceInDays(today, clockStart) >= thresholdDays;
}
