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

import { UsIdCRCWorkReleaseReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsId/UsIdCRCWorkReleaseOpportunity";
import { externalIdFunc, FirestoreFixture } from "./utils";

export const usIdCRCWorkReleaseReferrals: FirestoreFixture<UsIdCRCWorkReleaseReferralRecordRaw> =
  {
    data: [
      {
        stateCode: "US_ID",
        externalId: "ID_RES002",
        eligibleCriteria: {
          custodyLevelIsMinimum: {
            custodyLevel: "MINIMUM",
          },
          notServingForSexualOffense: null,
          usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
          usIdNotDetainersForXcrcAndCrc: null,
          usIdCrcWorkReleaseTimeBasedCriteria: {
            eligibleOffenses: null,
            fullTermCompletionDate: "2023-10-10",
            groupProjectedParoleReleaseDate: null,
            minTermCompletionDate: null,
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
      },
      {
        stateCode: "US_ID",
        externalId: "ID_RES003",
        eligibleCriteria: {
          custodyLevelIsMinimum: {
            custodyLevel: "MINIMUM",
          },
          notServingForSexualOffense: null,
          usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
          usIdNotDetainersForXcrcAndCrc: null,
          usIdCrcWorkReleaseTimeBasedCriteria: {
            eligibleOffenses: null,
            fullTermCompletionDate: "2027-03-13",
            groupProjectedParoleReleaseDate: null,
            minTermCompletionDate: "2025-05-25",
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
      },
    ],
    idFunc: externalIdFunc,
  };
