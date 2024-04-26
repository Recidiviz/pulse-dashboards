// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { relativeFixtureDate } from "../../../utils/fixtureDates";
import { makeRecordFixture } from "../../../utils/makeRecordFixture";
import { FixtureMapping } from "../../utils/types";
import {
  usMiWardenInPersonSecurityClassificationCommitteeReviewRecord,
  usMiWardenInPersonSecurityClassificationCommitteeReviewSchema,
} from "./schema";

export const usMiWardenInPersonSecurityClassificationCommitteeReviewFixtures = {
  fullyEligible1: makeRecordFixture(
    usMiWardenInPersonSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      externalId: "RES019",
      eligibleCriteria: {
        usMiPastWardenInPersonReviewForSccDate: {
          solitaryStartDate: relativeFixtureDate({ days: -20 }),
          latestWardenInPersonSccReviewDate: relativeFixtureDate({ days: -15 }),
          nextSccDate: relativeFixtureDate({ days: 5 }),
          numberOfExpectedReviews: null,
          numberOfReviews: null,
        },
        usMiInSolitaryConfinementAtLeastSixMonths: {
          eligibleDate: relativeFixtureDate({ days: -20 }),
        },
      },
      formInformation: {
        segregationType: "ADMINISTRATIVE_SOLITARY_CONFINEMENT",
      },
      ineligibleCriteria: {},
      metadata: {
        daysInCollapsedSolitarySession: 25,
      },
    },
  ),
  fullyEligible2: makeRecordFixture(
    usMiWardenInPersonSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      externalId: "RES020",
      eligibleCriteria: {
        usMiPastWardenInPersonReviewForSccDate: {
          solitaryStartDate: relativeFixtureDate({ days: -30 }),
          latestWardenInPersonSccReviewDate: null,
          nextSccDate: relativeFixtureDate({ days: 2 }),
          numberOfExpectedReviews: 2,
          numberOfReviews: 1,
        },
        usMiInSolitaryConfinementAtLeastSixMonths: {
          eligibleDate: relativeFixtureDate({ days: -50 }),
        },
      },
      formInformation: {
        segregationType: "TEMPORARY_SOLITARY_CONFINEMENT",
      },
      ineligibleCriteria: {},
      metadata: {
        daysInCollapsedSolitarySession: 50,
      },
    },
  ),
  almostEligible: makeRecordFixture(
    usMiWardenInPersonSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      externalId: "RES021",
      eligibleCriteria: {
        usMiInSolitaryConfinementAtLeastSixMonths: {
          eligibleDate: relativeFixtureDate({ days: -50 }),
        },
      },
      formInformation: {
        segregationType: "TEMPORARY_SOLITARY_CONFINEMENT",
      },
      ineligibleCriteria: {
        usMiPastWardenInPersonReviewForSccDate: {
          solitaryStartDate: relativeFixtureDate({ days: -30 }),
          latestWardenInPersonSccReviewDate: null,
          nextSccDate: relativeFixtureDate({ days: 2 }),
          numberOfExpectedReviews: null,
          numberOfReviews: null,
        },
      },
      metadata: {
        daysInCollapsedSolitarySession: 30,
      },
    },
  ),
} satisfies FixtureMapping<usMiWardenInPersonSecurityClassificationCommitteeReviewRecord>;
