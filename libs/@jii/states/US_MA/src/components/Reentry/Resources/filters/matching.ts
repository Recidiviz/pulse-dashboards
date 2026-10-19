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
import {
  FilterOption,
  LengthOfStayOption,
  RangeBand,
  RentOption,
  SelectedFilters,
} from "./types";

type Range = { min: number; max: number };

/** The Resource API stores a program length max of 999 for no time limit. */
export const NO_TIME_LIMIT_MONTHS = 999;

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

/**
 * Returns whether housing matches option. A program with no time limit still
 * matches every band its range overlaps, so {min: 6, max: 999} matches
 * "More than 1 year" as well as "No time limit". A resource without housing
 * attributes passes undefined and matches only "Not listed".
 */
export function matchesLengthOfStayOption(
  housing: HousingAttributes | undefined,
  option: LengthOfStayOption,
): boolean {
  const { programLengthMonths } = housing ?? {};
  switch (option.kind) {
    case "band":
      return (
        !!programLengthMonths &&
        bandMatchesRange(option.band, programLengthMonths)
      );
    case "noTimeLimit":
      return programLengthMonths?.max === NO_TIME_LIMIT_MONTHS;
    case "notListed":
      return !programLengthMonths;
  }
}

/** Returns whether matches is true for any option, or true if options is empty. */
function matchesAny<Match>(
  options: FilterOption<Match>[],
  matches: (match: Match) => boolean,
): boolean {
  return options.length === 0 || options.some(({ match }) => matches(match));
}

/** Returns whether resource matches every group in filters that has a selection. */
export function matchesFilters(
  resource: ResourceSummary,
  filters: SelectedFilters,
): boolean {
  const housingAttrs =
    resource.categoryAttributes?.category === "Housing"
      ? resource.categoryAttributes
      : undefined;

  return (
    matchesAny(filters.subcategories, (subcategory) =>
      resource.categories.some((cat) => cat.subcategory === subcategory),
    ) &&
    matchesAny(filters.counties, (county) => resource.county === county) &&
    matchesAny(filters.gender, (tag) => resource.tags.includes(tag)) &&
    matchesAny(filters.lengthOfStay, (option) =>
      matchesLengthOfStayOption(housingAttrs, option),
    ) &&
    matchesAny(filters.rent, (option) =>
      matchesRentOption(housingAttrs, option),
    ) &&
    matchesAny(filters.accepts, (tag) => resource.tags.includes(tag))
  );
}
