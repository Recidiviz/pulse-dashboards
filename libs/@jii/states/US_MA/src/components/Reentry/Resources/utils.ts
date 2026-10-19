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

import { ACCEPTS_OPTIONS, GENDER_OPTIONS } from "./filters/filterConfig";
import { NO_TIME_LIMIT_MONTHS } from "./filters/matching";
import { FilterOption } from "./filters/types";
import { HousingAttributes, ResourceSummary } from "./types";

/**
 * Returns the resources in category grouped by subcategory, sorted by subcategory
 * name. A resource with several subcategories appears in each of their groups.
 * Category matching ignores case because the route uses "housing" while the
 * Resource API uses "Housing".
 */
export function groupResourcesBySubcategory(
  resources: ResourceSummary[],
  category: string,
): [string, ResourceSummary[]][] {
  const groups = new Map<string, ResourceSummary[]>();
  for (const resource of resources) {
    resource.categories
      .filter((cat) => cat.category.toLowerCase() === category.toLowerCase())
      .forEach(({ subcategory }) => {
        const group = groups.get(subcategory) ?? [];
        group.push(resource);
        groups.set(subcategory, group);
      });
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

// Rent is in US dollars, so it uses US formatting in every language ("$187.50",
// not "187,50 US$"). Whole dollars stay whole ("$150").
const US_DOLLAR_FORMAT = {
  locale: "en-US",
  trailingZeroDisplay: "stripIfInteger",
} as const;

export function getRentChip(
  { weeklyRent, rentAsIncomePercent }: HousingAttributes,
  t: UsMaTFunction,
): string {
  if (weeklyRent && rentAsIncomePercent !== undefined) {
    return t(($) => $.reentry.resources.list.rent.varies);
  }
  if (weeklyRent) {
    const { min, max } = weeklyRent;
    if (min === 0 && max === 0)
      return t(($) => $.reentry.resources.list.rent.free);
    return min === max
      ? t(($) => $.reentry.resources.list.rent.single, {
          amount: min,
          ...US_DOLLAR_FORMAT,
        })
      : t(($) => $.reentry.resources.list.rent.range, {
          min,
          max,
          ...US_DOLLAR_FORMAT,
        });
  }
  if (rentAsIncomePercent !== undefined) {
    return t(($) => $.reentry.resources.list.rent.incomePercent, {
      percent: rentAsIncomePercent,
    });
  }
  return t(($) => $.reentry.resources.list.rent.notListed);
}

export function getLengthOfStayChip(
  { programLengthMonths }: HousingAttributes,
  t: UsMaTFunction,
): string {
  if (!programLengthMonths) {
    return t(($) => $.reentry.resources.list.lengthOfStay.notListed);
  }
  const { min, max } = programLengthMonths;
  if (max === NO_TIME_LIMIT_MONTHS) {
    return min > 0
      ? t(($) => $.reentry.resources.list.lengthOfStay.atLeast, { min })
      : t(($) => $.reentry.resources.list.lengthOfStay.noTimeLimit);
  }
  return min === max
    ? t(($) => $.reentry.resources.list.lengthOfStay.single, { count: min })
    : t(($) => $.reentry.resources.list.lengthOfStay.range, { min, max });
}

/**
 * Returns the chip labels for a resource card in display order: gender, rent,
 * length of stay, then the Accepts tags. Tags without a filter option are left
 * out.
 */
export function getResourceChips(
  resource: ResourceSummary,
  t: UsMaTFunction,
): string[] {
  const labelsFor = (options: FilterOption<string>[]) =>
    options
      .filter((option) => resource.tags.includes(option.match))
      .map((option) => option.label(t));

  const housingChips =
    resource.categoryAttributes?.category === "Housing"
      ? [
          getRentChip(resource.categoryAttributes, t),
          getLengthOfStayChip(resource.categoryAttributes, t),
        ]
      : [];

  return [
    ...labelsFor(GENDER_OPTIONS),
    ...housingChips,
    ...labelsFor(ACCEPTS_OPTIONS),
  ];
}

/**
 * Validates a `backTarget` query-param value, rejecting anything that isn't
 * an internal path - used to prevent malformed/malicious URLs from being
 * used, both for navigating there and for forwarding it to further pages.
 *
 * As implemented in `libs/@jii/states/US_NYC/src/components/BackTarget/utils.ts`
 */
export function sanitizeBackTarget(value: string | undefined): string | null {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\"))
    return null;
  return value;
}
