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

export const usAzOverdueForACISDTPReferrals =
  fixtureWithIdKey<OpportunityRecordBase>("externalId", [
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES007",
      eligibleCriteria: {
        usAzIncarcerationPastAcisDtpDate: {
          acisDtpDate: "2023-10-18",
        },
      },
      ineligibleCriteria: {},
      caseNotes: {},
    },
    {
      stateCode: "US_AZ",
      externalId: "AZ_RES008",
      eligibleCriteria: {
        usAzIncarcerationPastAcisDtpDate: {
          acisDtpDate: "2023-09-13",
        },
      },
      ineligibleCriteria: {},
      caseNotes: {},
    },
  ]);
