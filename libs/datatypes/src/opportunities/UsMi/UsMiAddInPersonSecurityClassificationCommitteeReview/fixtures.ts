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
  usMiAddInPersonSecurityClassificationCommitteeReviewRecord,
  usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
} from "./schema";

export const usMiAddInPersonSecurityClassificationCommitteeReviewFixtures = {
  fullyEligible1: makeRecordFixture(
    usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      externalId: "RES019",
      eligibleCriteria: {
        usMiPastAddInPersonReviewForSccDate: {
          solitaryStartDate: relativeFixtureDate({ days: -20 }),
          latestAddInPersonSccReviewDate: relativeFixtureDate({ days: -15 }),
          nextSccDate: relativeFixtureDate({ days: 5 }),
          numberOfExpectedReviews: null,
          numberOfReviews: null,
        },
        usMiInSolitaryConfinementAtLeastOneYear: {
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
      isOverdue: true,
    },
  ),
  fullyEligible2: makeRecordFixture(
    usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      isOverdue: false,
      externalId: "RES020",
      eligibleCriteria: {
        usMiPastAddInPersonReviewForSccDate: {
          solitaryStartDate: relativeFixtureDate({ days: -30 }),
          latestAddInPersonSccReviewDate: null,
          nextSccDate: relativeFixtureDate({ days: 2 }),
          numberOfExpectedReviews: 2,
          numberOfReviews: 1,
        },
        usMiInSolitaryConfinementAtLeastOneYear: {
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
    usMiAddInPersonSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      isOverdue: false,
      externalId: "RES021",
      eligibleCriteria: {
        usMiInSolitaryConfinementAtLeastOneYear: {
          eligibleDate: relativeFixtureDate({ days: -50 }),
        },
      },
      formInformation: {
        segregationType: "TEMPORARY_SOLITARY_CONFINEMENT",
      },
      ineligibleCriteria: {
        usMiPastAddInPersonReviewForSccDate: {
          solitaryStartDate: relativeFixtureDate({ days: -30 }),
          latestAddInPersonSccReviewDate: null,
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
} satisfies FixtureMapping<usMiAddInPersonSecurityClassificationCommitteeReviewRecord>;
