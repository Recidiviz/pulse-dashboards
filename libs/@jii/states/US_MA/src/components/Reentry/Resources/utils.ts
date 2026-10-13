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
  return min === max
    ? t(($) => $.reentry.resources.list.lengthOfStay.single, { count: min })
    : t(($) => $.reentry.resources.list.lengthOfStay.range, { min, max });
}

// Keys are the Resource API tags as they are stored, e.g. "Sex Offenders Accepted".
function tagLabels(t: UsMaTFunction) {
  const { gender, accepts } = t(($) => $.reentry.resources.list, {
    returnObjects: true,
  });
  return {
    gender: new Map([
      ["Male", gender.male],
      ["Female", gender.female],
      ["Co-ed", gender.coed],
    ]),
    accepts: new Map([
      ["Sex Offenders Accepted", accepts.sexOffenses],
      ["Arson Offenders Accepted", accepts.arsonOffenses],
      ["Parolees Accepted", accepts.parolees],
    ]),
  };
}

/**
 * Returns the chip labels for a resource card in display order: gender, rent,
 * length of stay, then the Accepts tags. Tags without a known label are left out.
 */
export function getResourceChips(
  resource: ResourceSummary,
  t: UsMaTFunction,
): string[] {
  const labels = tagLabels(t);
  const labelsFor = (lookup: Map<string, string>) =>
    resource.tags.flatMap((tag) => lookup.get(tag) ?? []);

  const housingChips =
    resource.categoryAttributes?.category === "Housing"
      ? [
          getRentChip(resource.categoryAttributes, t),
          getLengthOfStayChip(resource.categoryAttributes, t),
        ]
      : [];

  return [
    ...labelsFor(labels.gender),
    ...housingChips,
    ...labelsFor(labels.accepts),
  ];
}
