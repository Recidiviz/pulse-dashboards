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

import { UsMaTFunction } from "~@jii/translation";

/**
 * A filter option. The id is what the URL stores, and match is what
 * matchesFilters checks a resource against.
 */
export type FilterOption<Match> = {
  id: string;
  label: (t: UsMaTFunction) => string;
  match: Match;
};

/**
 * A (gt, lte] band. Omit gt for no lower bound or lte for no upper bound.
 */
export type RangeBand = { gt?: number; lte?: number };

export type RentOption =
  | { kind: "band"; band: RangeBand }
  | { kind: "free" }
  | { kind: "basedOnIncome" }
  | { kind: "notListed" };

/**
 * The selected options in each filter group. An empty group doesn't filter
 * anything, and a resource has to match every group that isn't empty.
 */
export type SelectedFilters = {
  // A resource matches if it matches any of these.
  rent: FilterOption<RentOption>[];
};
