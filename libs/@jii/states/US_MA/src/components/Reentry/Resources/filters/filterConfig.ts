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

import { RentOption, SelectedFilters } from "./matching";

/**
 * A filter option. The id is what the URL stores, and match is what
 * matchesFilters checks a resource against.
 */
export type FilterOption<Match> = {
  id: string;
  label: (t: UsMaTFunction) => string;
  match: Match;
};

// TODO(REE-25): Confirm the rent bands once the content
// review finishes.
export const RENT_OPTIONS: FilterOption<RentOption>[] = [
  {
    id: "free",
    label: (t) => t(($) => $.reentry.resources.filters.rent.free),
    match: { kind: "free" },
  },
  {
    id: "upTo150",
    label: (t) => t(($) => $.reentry.resources.filters.rent.upTo150),
    match: { kind: "band", band: { gt: 0, lte: 150 } },
  },
  {
    id: "from151To175",
    label: (t) => t(($) => $.reentry.resources.filters.rent.from151To175),
    match: { kind: "band", band: { gt: 150, lte: 175 } },
  },
  {
    id: "from176To200",
    label: (t) => t(($) => $.reentry.resources.filters.rent.from176To200),
    match: { kind: "band", band: { gt: 175, lte: 200 } },
  },
  {
    id: "over200",
    label: (t) => t(($) => $.reentry.resources.filters.rent.over200),
    match: { kind: "band", band: { gt: 200 } },
  },
  {
    id: "basedOnIncome",
    label: (t) => t(($) => $.reentry.resources.filters.rent.basedOnIncome),
    match: { kind: "basedOnIncome" },
  },
  {
    id: "notListed",
    label: (t) => t(($) => $.reentry.resources.filters.rent.notListed),
    match: { kind: "notListed" },
  },
];

/** The ResourceExplorer.CategoryResults search params the MA filters use. */
export type FilterSearchParams = {
  rent: string[];
};

/** The filter groups in display order. */
export const FILTER_GROUPS: {
  id: string;
  param: keyof FilterSearchParams;
  label: (t: UsMaTFunction) => string;
  options: FilterOption<unknown>[];
}[] = [
  {
    id: "rent",
    param: "rent",
    label: (t) => t(($) => $.reentry.resources.filters.groups.rent),
    options: RENT_OPTIONS,
  },
];

function matchesFor<Match>(
  options: FilterOption<Match>[],
  ids: string[],
): Match[] {
  return options
    .filter((option) => ids.includes(option.id))
    .map((option) => option.match);
}

/**
 * Returns the filters selected by the search params. Option IDs that aren't in
 * the config are dropped, so a stale or hand-edited URL can't break the page.
 * For example, ?rent=free&rent=upTo150 selects
 * [{kind: "free"}, {kind: "band", band: {gt: 0, lte: 150}}].
 */
export function parseSelectedFilters(
  params: FilterSearchParams,
): SelectedFilters {
  return { rent: matchesFor(RENT_OPTIONS, params.rent) };
}
