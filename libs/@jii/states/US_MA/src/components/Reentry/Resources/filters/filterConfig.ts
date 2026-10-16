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

import { FilterOption, RentOption, SelectedFilters } from "./types";

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

/** The filter groups in display order. */
export const FILTER_GROUPS: {
  id: string;
  param: keyof SelectedFilters;
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

export const NO_SELECTION: SelectedFilters = { rent: [] };

/**
 * Returns the options the search params select, in config order. Option IDs
 * that aren't in the config are dropped, so a stale or hand-edited URL can't
 * break the page. For example, ?rent=over200&rent=cheap&rent=free selects the
 * "free" and "over200" rent options.
 */
export function parseSelectedFilters(
  params: Record<keyof SelectedFilters, string[]>,
): SelectedFilters {
  return Object.fromEntries(
    FILTER_GROUPS.map(({ param, options }) => [
      param,
      options.filter((option) => params[param].includes(option.id)),
    ]),
  ) as SelectedFilters;
}

/** Returns the search params that select filters. */
export function toSearchParams(
  filters: SelectedFilters,
): Record<keyof SelectedFilters, string[]> {
  return Object.fromEntries(
    FILTER_GROUPS.map(({ param }) => [
      param,
      filters[param].map((option) => option.id),
    ]),
  ) as Record<keyof SelectedFilters, string[]>;
}

export function isOptionSelected(
  filters: SelectedFilters,
  param: keyof SelectedFilters,
  option: FilterOption<unknown>,
): boolean {
  return filters[param].some((selected) => selected.id === option.id);
}

/** Returns the options selected in filters with a unique key. */
export function getAppliedOptions(filters: SelectedFilters): {
  key: string;
  param: keyof SelectedFilters;
  option: FilterOption<unknown>;
}[] {
  return FILTER_GROUPS.flatMap(({ param, options }) =>
    options
      .filter((option) => isOptionSelected(filters, param, option))
      .map((option) => ({ key: `${param}:${option.id}`, param, option })),
  );
}

/** Returns filters with option added to or removed from param's selection. */
export function toggleOption(
  filters: SelectedFilters,
  param: keyof SelectedFilters,
  option: FilterOption<unknown>,
): SelectedFilters {
  const selected = filters[param];
  return {
    ...filters,
    [param]: isOptionSelected(filters, param, option)
      ? selected.filter((selectedOption) => selectedOption.id !== option.id)
      : [...selected, option],
  } as SelectedFilters;
}

export function countSelectedOptions(filters: SelectedFilters): number {
  return FILTER_GROUPS.reduce(
    (count, { param }) => count + filters[param].length,
    0,
  );
}

/** Returns whether a and b select the same options, in any order. */
export function isSameSelection(
  a: SelectedFilters,
  b: SelectedFilters,
): boolean {
  return FILTER_GROUPS.every(
    ({ param }) =>
      a[param].length === b[param].length &&
      a[param].every((option) => isOptionSelected(b, param, option)),
  );
}
