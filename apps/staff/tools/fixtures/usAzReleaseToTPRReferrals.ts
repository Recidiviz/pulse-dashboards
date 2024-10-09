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

import { OpportunityRecordBase } from "~datatypes";

import { fixtureWithIdKey } from "./utils";

export const usAzReleaseToTPRReferrals =
  fixtureWithIdKey<OpportunityRecordBase>("externalId", [
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES001",
      eligibleCriteria: {
        usAzFunctionalLiteracyComplete: {},
        minimumOrMediumCustody: {},
        usAzNotServingSexOffense: {},
        usAzNotServingIneligibleOffense: {},
        noFelonyDetainers: {},
        usAzNoMajorViolation6Months: {},
      },
      ineligibleCriteria: {},
      caseNotes: {},
    },
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES002",
      eligibleCriteria: {
        minimumOrMediumCustody: {},
        usAzNotServingSexOffense: {},
        usAzNotServingIneligibleOffense: {},
        noFelonyDetainers: {},
        usAzNoMajorViolation6Months: {},
      },
      ineligibleCriteria: {
        usAzFunctionalLiteracyComplete: {},
      },
      caseNotes: {},
    },
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES003",
      eligibleCriteria: {
        usAzFunctionalLiteracyComplete: {},
        minimumOrMediumCustody: {},
        usAzNotServingSexOffense: {},
        usAzNotServingIneligibleOffense: {},
        usAzNoMajorViolation6Months: {},
      },
      ineligibleCriteria: {
        noFelonyDetainers: {},
      },
      caseNotes: {},
    },
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES004",
      eligibleCriteria: {
        usAzFunctionalLiteracyComplete: {},
        minimumOrMediumCustody: {},
        usAzNotServingSexOffense: {},
        usAzNotServingIneligibleOffense: {},
        noFelonyDetainers: {},
      },
      ineligibleCriteria: {
        usAzNoMajorViolation6Months: {},
      },
      caseNotes: {},
    },
  ]);
