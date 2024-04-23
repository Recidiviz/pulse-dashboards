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
  usMiSecurityClassificationCommitteeReviewRecord,
  usMiSecurityClassificationCommitteeReviewSchema,
} from "./schema";

export const usMiSecurityClassificationCommitteeReviewFixtures = {
  fullyEligible1: makeRecordFixture(
    usMiSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      externalId: "RES019",
      eligibleCriteria: {
        usMiPastSecurityClassificationCommitteeReviewDate: {
          facilitySolitaryStartDate: relativeFixtureDate({ days: -20 }),
          latestSccReviewDate: relativeFixtureDate({ days: -15 }),
          nextSccDate: relativeFixtureDate({ days: 5 }),
          numberOfExpectedReviews: null,
          numberOfReviews: null,
        },
        housingUnitTypeIsSolitaryConfinement: {
          solitaryStartDate: relativeFixtureDate({ days: -20 }),
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
    usMiSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      externalId: "RES020",
      eligibleCriteria: {
        usMiPastSecurityClassificationCommitteeReviewDate: {
          facilitySolitaryStartDate: relativeFixtureDate({ days: -30 }),
          latestSccReviewDate: null,
          nextSccDate: relativeFixtureDate({ days: 2 }),
          numberOfExpectedReviews: 2,
          numberOfReviews: 1,
        },
        housingUnitTypeIsSolitaryConfinement: {
          solitaryStartDate: relativeFixtureDate({ days: -50 }),
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
    usMiSecurityClassificationCommitteeReviewSchema,
    {
      stateCode: "US_MI",
      externalId: "RES021",
      eligibleCriteria: {
        housingUnitTypeIsSolitaryConfinement: {
          solitaryStartDate: relativeFixtureDate({ days: -50 }),
        },
      },
      formInformation: {
        segregationType: "TEMPORARY_SOLITARY_CONFINEMENT",
      },
      ineligibleCriteria: {
        usMiPastSecurityClassificationCommitteeReviewDate: {
          facilitySolitaryStartDate: relativeFixtureDate({ days: -30 }),
          latestSccReviewDate: null,
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
} satisfies FixtureMapping<usMiSecurityClassificationCommitteeReviewRecord>;
