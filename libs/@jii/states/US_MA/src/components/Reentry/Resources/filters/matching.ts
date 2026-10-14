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

import { HousingAttributes, ResourceSummary } from "../types";

/**
 * A (gt, lte] band. Omit gt for no lower bound or lte for no upper bound.
 */
export type RangeBand = { gt?: number; lte?: number };

type Range = { min: number; max: number };

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
  rent: RentOption[];
};

export const NO_FILTERS: SelectedFilters = { rent: [] };

/**
 * Returns whether range overlaps band, meaning min <= lte and max > gt. For
 * example, {gt: 150, lte: 175} matches {min: 100, max: 250} and
 * {min: 160, max: 160}, but not {min: 140, max: 150}.
 */
export function bandMatchesRange({ gt, lte }: RangeBand, { min, max }: Range) {
  return (lte === undefined || min <= lte) && (gt === undefined || max > gt);
}

/**
 * Returns whether housing matches option. A resource without housing
 * attributes passes undefined and matches only "Not listed".
 */
export function matchesRentOption(
  housing: HousingAttributes | undefined,
  option: RentOption,
): boolean {
  const { weeklyRent, rentAsIncomePercent } = housing ?? {};
  switch (option.kind) {
    case "band":
      return !!weeklyRent && bandMatchesRange(option.band, weeklyRent);
    case "free":
      return weeklyRent?.min === 0 && weeklyRent.max === 0;
    case "basedOnIncome":
      return rentAsIncomePercent !== undefined;
    case "notListed":
      return !weeklyRent && rentAsIncomePercent === undefined;
  }
}

/** Returns whether resource matches every group in filters that has a selection. */
export function matchesFilters(
  resource: ResourceSummary,
  filters: SelectedFilters,
): boolean {
  const housing =
    resource.categoryAttributes?.category === "Housing"
      ? resource.categoryAttributes
      : undefined;

  return (
    filters.rent.length === 0 ||
    filters.rent.some((option) => matchesRentOption(housing, option))
  );
}
