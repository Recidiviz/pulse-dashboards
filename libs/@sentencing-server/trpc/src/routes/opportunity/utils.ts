// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { NeedToBeAddressed } from "@prisma/sentencing-server/client";
import axios from "axios";
import _ from "lodash";

import {
  AUTH_ENDPOINT,
  NEEDS_TO_LABELS,
  RELEVANT_SERVICE_TAGS,
} from "~@sentencing-server/trpc/routes/opportunity/constants";
import {
  AuthResponse,
  PrismaOpportunity,
  ProgramsResponse,
} from "~@sentencing-server/trpc/routes/opportunity/types";

const PROGRAMS_SUCCESS_RESPONSE = "success";
const PROGRAMS_PROGRAMS_KEY = "programs";
const TOKEN_EXPIRATION = 3600;

export async function getAuthToken() {
  const authResponse = await axios.post<AuthResponse>(
    AUTH_ENDPOINT,
    {
      username: process.env["FINDHELP_USERNAME"],
      password: process.env["FINDHELP_PASSWORD"],
      api_key: process.env["FINDHELP_API_KEY"],
      expiration: TOKEN_EXPIRATION,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const { success, data } = authResponse.data;

  if (!success || !data) {
    throw Error("Failed to authenticate with Findhelp");
  }

  return data.token;
}

function mapServiceTagsToNeedsAddressed(serviceTags: string[]) {
  return (Object.keys(NeedToBeAddressed) as Array<NeedToBeAddressed>).filter(
    (need) => {
      const needToLabels = NEEDS_TO_LABELS[need];
      if (!needToLabels) {
        return false;
      }

      return _.some(needToLabels, (label) => serviceTags.includes(label));
    },
  );
}

const GROUPS_ORDERED_BY_AGES = [
  "teens",
  "young adults",
  "adults",
  "seniors",
] as const;

const AGE_GROUPS_TO_MIN_MAX_AGES = {
  teens: { minAge: 13, maxAge: 19 },
  "young adults": { minAge: 20, maxAge: 30 },
  adults: { minAge: 31, maxAge: 54 },
  seniors: { minAge: 55, maxAge: null },
};

function getMinAndMaxAge(serviceTags: string[]) {
  const ageGroups = GROUPS_ORDERED_BY_AGES.filter((group) =>
    serviceTags.includes(group),
  );

  if (serviceTags.includes("all ages") || ageGroups.length === 0) {
    return { minAge: null, maxAge: null };
  }

  return {
    minAge: AGE_GROUPS_TO_MIN_MAX_AGES[ageGroups[0]].minAge,
    maxAge: AGE_GROUPS_TO_MIN_MAX_AGES[ageGroups[ageGroups.length - 1]].maxAge,
  };
}

export async function getFindHelpPrograms(zipCode = "83201") {
  const token = await getAuthToken();

  const programsResponse = await axios.get<ProgramsResponse>(
    `https://api.auntberthaqa.com/v2/zipcodes/${zipCode}/programsLite`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      params: {
        serviceTag: RELEVANT_SERVICE_TAGS,
      },
    },
  );

  if (
    (PROGRAMS_SUCCESS_RESPONSE in programsResponse.data &&
      !programsResponse.data.success) ||
    !(PROGRAMS_PROGRAMS_KEY in programsResponse.data)
  ) {
    throw Error("Failed to get programs from Findhelp");
  }

  const { programs } = programsResponse.data;

  return programs.map((program) => {
    const { minAge, maxAge } = getMinAndMaxAge(program.attribute_tags);

    // TODO(https://github.com/Recidiviz/pulse-dashboards/issues/7610): handle using attributes to determine eligibility criteria
    return {
      opportunityName: program.name,
      providerName: program.provider_name,
      description: program.description,
      providerPhoneNumber: program.offices[0]?.phone_number,
      providerWebsite: program.website_url,
      providerAddress: program.offices[0]?.address1,
      needsAddressed: mapServiceTagsToNeedsAddressed(program.service_tags),
      additionalNotes: null,
      developmentalDisabilityDiagnosisCriterion: false,
      noCurrentOrPriorSexOffenseCriterion: false,
      noCurrentOrPriorViolentOffenseCriterion: false,
      noPendingFelonyChargesInAnotherCountyOrStateCriterion: false,
      entryOfGuiltyPleaCriterion: false,
      veteranStatusCriterion: false,
      priorCriminalHistoryCriterion: null,
      diagnosedMentalHealthDiagnosisCriterion: [],
      asamLevelOfCareRecommendationCriterion: null,
      diagnosedSubstanceUseDisorderCriterion: null,
      minLsirScoreCriterion: null,
      maxLsirScoreCriterion: null,
      minAge,
      maxAge,
      district: null,
      genders: [],
      genericDescription: null,
      counties: [],
      active: true,
      lastUpdatedAt: new Date(),
    } satisfies PrismaOpportunity;
  });
}
