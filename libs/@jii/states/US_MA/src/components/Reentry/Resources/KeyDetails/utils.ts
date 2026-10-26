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

import { ACCEPTS_OPTIONS, GENDER_OPTIONS } from "../filters/filterConfig";
import { HousingAttributes, ResourceSummary } from "../types";
import { formatLengthOfStay, formatRent } from "../utils";

export type KeyDetail = {
  label: string;
  value: string;
  suffix?: string;
};

export function getWhoCanStayValue(
  tags: string[],
  numBeds: number | undefined,
  t: UsMaTFunction,
): string {
  const gender = GENDER_OPTIONS.filter((option) => tags.includes(option.match))
    .map((option) => option.label(t))
    .join(", ");
  // A bed count of 0 most likely means the count is unknown, so it reads the
  // same as a missing one.
  const hasBeds = !!numBeds;

  if (gender && hasBeds) {
    return t(($) => $.reentry.resources.detail.keyDetails.whoCanStay.withBeds, {
      gender,
      count: numBeds,
    });
  }
  if (gender) return gender;
  if (hasBeds) {
    return t(($) => $.reentry.resources.detail.keyDetails.whoCanStay.bedsOnly, {
      count: numBeds,
    });
  }
  return t(($) => $.reentry.resources.detail.keyDetails.whoCanStay.unspecified);
}

export function getLengthOfStayValue(
  attributes: HousingAttributes,
  t: UsMaTFunction,
): string {
  return (
    formatLengthOfStay(attributes, t) ??
    t(($) => $.reentry.resources.detail.keyDetails.notListed)
  );
}

/**
 * Returns the weekly rent, e.g. "$150–$175" with a "/ week" suffix, "Free" or
 * "Based on income". A resource that lists both a dollar amount and a share of
 * income shows "Varies".
 */
export function getWeeklyRentDetail(
  { weeklyRent, rentAsIncomePercent }: HousingAttributes,
  t: UsMaTFunction,
): Pick<KeyDetail, "value" | "suffix"> {
  if (weeklyRent && rentAsIncomePercent !== undefined) {
    return {
      value: t(($) => $.reentry.resources.detail.keyDetails.weeklyRent.varies),
    };
  }
  if (weeklyRent) {
    const value = formatRent(weeklyRent, t);
    return weeklyRent.max === 0
      ? { value }
      : {
          value,
          suffix: t(
            ($) => $.reentry.resources.detail.keyDetails.weeklyRent.perWeek,
          ),
        };
  }
  if (rentAsIncomePercent !== undefined) {
    return {
      value: t(
        ($) => $.reentry.resources.detail.keyDetails.weeklyRent.basedOnIncome,
      ),
    };
  }
  return { value: t(($) => $.reentry.resources.detail.keyDetails.notListed) };
}

const ACCEPTS_CARDS: { id: string; label: (t: UsMaTFunction) => string }[] = [
  {
    id: "sexOffenses",
    label: (t) =>
      t(($) => $.reentry.resources.detail.keyDetails.labels.acceptsSexOffenses),
  },
  {
    id: "parolees",
    label: (t) =>
      t(($) => $.reentry.resources.detail.keyDetails.labels.acceptsParolees),
  },
  {
    id: "arsonOffenses",
    label: (t) =>
      t(
        ($) =>
          $.reentry.resources.detail.keyDetails.labels.acceptsArsonOffenses,
      ),
  },
];

export function getKeyDetails(
  { tags }: Pick<ResourceSummary, "tags">,
  housing: HousingAttributes,
  t: UsMaTFunction,
): KeyDetail[] {
  const acceptsDetails = ACCEPTS_CARDS.map(({ id, label }) => {
    const tag = ACCEPTS_OPTIONS.find((option) => option.id === id)?.match;
    const accepted = tag !== undefined && tags.includes(tag);
    return {
      label: label(t),
      value: accepted
        ? t(($) => $.reentry.resources.detail.keyDetails.accepts.yes)
        : t(($) => $.reentry.resources.detail.keyDetails.accepts.no),
    };
  });

  return [
    {
      label: t(($) => $.reentry.resources.detail.keyDetails.labels.whoCanStay),
      value: getWhoCanStayValue(tags, housing.numBeds, t),
    },
    {
      label: t(
        ($) => $.reentry.resources.detail.keyDetails.labels.lengthOfStay,
      ),
      value: getLengthOfStayValue(housing, t),
    },
    {
      label: t(($) => $.reentry.resources.detail.keyDetails.labels.weeklyRent),
      ...getWeeklyRentDetail(housing, t),
    },
    ...acceptsDetails,
  ];
}
