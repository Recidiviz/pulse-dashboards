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

import { ResourceSummary } from "../types";
import {
  FilterGroup,
  FilterOption,
  FilterParam,
  LengthOfStayOption,
  RentOption,
  SelectedFilters,
} from "./types";

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

const LENGTH_OF_STAY_OPTIONS: FilterOption<LengthOfStayOption>[] = [
  {
    id: "upTo3",
    label: (t) => t(($) => $.reentry.resources.filters.lengthOfStay.upTo3),
    match: { kind: "band", band: { lte: 3 } },
  },
  {
    id: "from4To6",
    label: (t) => t(($) => $.reentry.resources.filters.lengthOfStay.from4To6),
    match: { kind: "band", band: { gt: 3, lte: 6 } },
  },
  {
    id: "from7To12",
    label: (t) => t(($) => $.reentry.resources.filters.lengthOfStay.from7To12),
    match: { kind: "band", band: { gt: 6, lte: 12 } },
  },
  {
    id: "over12",
    label: (t) => t(($) => $.reentry.resources.filters.lengthOfStay.over12),
    match: { kind: "band", band: { gt: 12 } },
  },
  {
    id: "noTimeLimit",
    label: (t) =>
      t(($) => $.reentry.resources.filters.lengthOfStay.noTimeLimit),
    match: { kind: "noTimeLimit" },
  },
  {
    id: "notListed",
    label: (t) => t(($) => $.reentry.resources.filters.lengthOfStay.notListed),
    match: { kind: "notListed" },
  },
];

// Matches are the Resource API tags as they are stored.
// TODO(REE-202): Match on stable tag identifiers once the Resource API stores them.
export const GENDER_OPTIONS: FilterOption<string>[] = [
  {
    id: "male",
    label: (t) => t(($) => $.reentry.resources.list.gender.male),
    match: "Male",
  },
  {
    id: "female",
    label: (t) => t(($) => $.reentry.resources.list.gender.female),
    match: "Female",
  },
  {
    id: "coed",
    label: (t) => t(($) => $.reentry.resources.list.gender.coed),
    match: "Co-ed",
  },
];

// Matches are the Resource API tags as they are stored.
// TODO(REE-202): Match on stable tag identifiers once the Resource API stores them.
export const ACCEPTS_OPTIONS: FilterOption<string>[] = [
  {
    id: "parolees",
    label: (t) => t(($) => $.reentry.resources.list.accepts.parolees),
    match: "Parolees Accepted",
  },
  {
    id: "sexOffenses",
    label: (t) => t(($) => $.reentry.resources.list.accepts.sexOffenses),
    match: "Sex Offenders Accepted",
  },
  {
    id: "arsonOffenses",
    label: (t) => t(($) => $.reentry.resources.list.accepts.arsonOffenses),
    match: "Arson Offenders Accepted",
  },
];

/**
 * Derive options from the Resource API response
 */
function valueOptions(values: (string | undefined)[]): FilterOption<string>[] {
  return [...new Set(values.filter((value) => value !== undefined))]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ id: value, label: () => value, match: value }));
}

/**
 * Returns the groups in display order.
 */
export function getFilterGroups(
  resources: ResourceSummary[],
  category: string,
): FilterGroup[] {
  const subcategories = resources.flatMap((resource) =>
    resource.categories
      .filter((cat) => cat.category.toLowerCase() === category.toLowerCase())
      .map((cat) => cat.subcategory),
  );

  return [
    {
      param: "subcategories",
      label: (t) => t(($) => $.reentry.resources.filters.groups.subcategory),
      options: valueOptions(subcategories),
    },
    {
      param: "counties",
      label: (t) => t(($) => $.reentry.resources.filters.groups.county),
      options: valueOptions(resources.map((resource) => resource.county)),
    },
    {
      param: "gender",
      label: (t) => t(($) => $.reentry.resources.filters.groups.gender),
      options: GENDER_OPTIONS,
    },
    {
      param: "lengthOfStay",
      label: (t) => t(($) => $.reentry.resources.filters.groups.lengthOfStay),
      options: LENGTH_OF_STAY_OPTIONS,
    },
    {
      param: "rent",
      label: (t) => t(($) => $.reentry.resources.filters.groups.rent),
      options: RENT_OPTIONS,
    },
    {
      param: "accepts",
      label: (t) => t(($) => $.reentry.resources.filters.groups.accepts),
      options: ACCEPTS_OPTIONS,
    },
  ];
}

export const NO_SELECTION: SelectedFilters = {
  subcategories: [],
  counties: [],
  gender: [],
  lengthOfStay: [],
  rent: [],
  accepts: [],
};

/**
 * Returns the options the search params select, in the order groups lists
 * them.
 */
export function parseSelectedFilters(
  groups: FilterGroup[],
  params: Record<FilterParam, string[]>,
): SelectedFilters {
  return Object.fromEntries(
    groups.map(({ param, options }) => [
      param,
      options.filter((option) => params[param].includes(option.id)),
    ]),
  ) as SelectedFilters;
}

/** Returns the search params that select filters. */
export function toSearchParams(
  filters: SelectedFilters,
): Record<FilterParam, string[]> {
  return Object.fromEntries(
    Object.entries(filters).map(([param, options]) => [
      param,
      options.map((option) => option.id),
    ]),
  ) as Record<FilterParam, string[]>;
}

export function isOptionSelected(
  filters: SelectedFilters,
  param: FilterParam,
  option: FilterOption<unknown>,
): boolean {
  return filters[param].some((selected) => selected.id === option.id);
}

/**
 * Returns the options selected in filters with a unique key and ordered
 */
export function getAppliedOptions(
  groups: FilterGroup[],
  filters: SelectedFilters,
): {
  key: string;
  param: FilterParam;
  option: FilterOption<unknown>;
}[] {
  return groups.flatMap(({ param, options }) =>
    options
      .filter((option) => isOptionSelected(filters, param, option))
      .map((option) => ({ key: `${param}:${option.id}`, param, option })),
  );
}

/** Returns filters with option added to or removed from param's selection. */
export function toggleOption(
  filters: SelectedFilters,
  param: FilterParam,
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
  return Object.values(filters).reduce(
    (count, options) => count + options.length,
    0,
  );
}

/** Returns whether a and b select the same options, in any order. */
export function isSameSelection(
  a: SelectedFilters,
  b: SelectedFilters,
): boolean {
  return (Object.keys(a) as FilterParam[]).every(
    (param) =>
      a[param].length === b[param].length &&
      a[param].every((option) => isOptionSelected(b, param, option)),
  );
}
