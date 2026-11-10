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

import { Prisma } from "~@idaho-th/prisma/client";
import {
  ACCEPTED_GENDER,
  acceptsFemale,
  acceptsMale,
  isFemale,
  isMale,
} from "~@idaho-th/shared";

import type {
  Criterion,
  EligibilityParams,
  EligibleProviderMatch,
  HousingProvider,
  HousingProviderLocation,
} from "./types";
import { booleanMatch } from "./utils";

// Criteria are listed in descending priority order, index 0 is most important.
// The same order governs both the 5-point eligibility score and tiebreak resolution.
const SCORE_CRITERIA: Criterion[] = [
  function districtMatch(params, loc) {
    if (!params.preferredDistricts || params.preferredDistricts.length === 0)
      return false;
    return params.preferredDistricts.includes(
      loc.district?.trim().toLowerCase(),
    );
  },
  function genderMatch(params, loc) {
    if (!params.gender) return false;
    if (isMale(params.gender)) return acceptsMale(loc);
    if (isFemale(params.gender)) return acceptsFemale(loc);
    return false;
  },
  booleanMatch("isRider", "acceptsRiders"),
  booleanMatch("isSexOffender", "acceptsSexOffenders"),
];

export function pickBestLocation(
  locations: HousingProviderLocation[],
  params: EligibilityParams,
): HousingProviderLocation {
  if (locations.length === 1) return locations[0];

  const scored = locations.map((loc) => {
    const matches = SCORE_CRITERIA.map((c) => c(params, loc));
    const score = matches.filter(Boolean).length;
    return { loc, score, matches };
  });

  scored.sort((a, b) => b.score - a.score);

  const topScore = scored[0].score;
  const topScored = scored.filter((s) => s.score === topScore);

  if (topScored.length === 1) return topScored[0].loc;

  // Break the tie by the highest-priority matching criterion.
  topScored.sort((a, b) => {
    for (let i = 0; i < SCORE_CRITERIA.length; i++) {
      const diff = (b.matches[i] ? 1 : 0) - (a.matches[i] ? 1 : 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });

  return topScored[0].loc;
}

export function buildEligibilityWhere(
  params: EligibilityParams,
): Prisma.HousingProviderWhereInput {
  const {
    preferredDistricts,
    gender,
    isRider,
    isSexOffender,
    preferredProviders,
  } = params;

  const locationRequirements: Prisma.HousingProviderLocationWhereInput[] = [];

  if (preferredDistricts && preferredDistricts.length > 0) {
    locationRequirements.push({
      district: { in: preferredDistricts, mode: "insensitive" },
    });
  }

  if (gender) {
    if (isMale(gender))
      locationRequirements.push({
        acceptedGenders: {
          hasSome: [ACCEPTED_GENDER.MALE, ACCEPTED_GENDER.ALL],
        },
      });
    else if (isFemale(gender))
      locationRequirements.push({
        acceptedGenders: {
          hasSome: [ACCEPTED_GENDER.FEMALE, ACCEPTED_GENDER.ALL],
        },
      });
  }

  if (isRider === true) locationRequirements.push({ acceptsRiders: true });
  if (isSexOffender === true)
    locationRequirements.push({ acceptsSexOffenders: true });

  const hasPreferred = preferredProviders.length > 0;
  const hasFilters = locationRequirements.length > 0;

  const preferredFilter: Prisma.HousingProviderWhereInput = {
    id: { in: preferredProviders },
  };

  const eligibilityFilter: Prisma.HousingProviderWhereInput = hasFilters
    ? { locations: { some: { AND: locationRequirements } } }
    : {};

  if (!hasFilters && !hasPreferred) return {};
  if (!hasFilters) return preferredFilter;
  if (!hasPreferred) return eligibilityFilter;

  return { OR: [eligibilityFilter, preferredFilter] };
}

export function matchProviders(
  providers: HousingProvider[],
  params: EligibilityParams,
): EligibleProviderMatch[] {
  return providers
    .filter((p) => p.locations.length > 0)
    .map((provider) => ({
      provider,
      location: pickBestLocation(provider.locations, params),
    }));
}
