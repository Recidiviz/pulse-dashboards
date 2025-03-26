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

import { UsIdCRCResidentWorkerReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsId/UsIdCRCResidentWorkerOpportunity";
import { externalIdFunc, FirestoreFixture } from "./utils";

export const usIdCRCResidentWorkerReferrals: FirestoreFixture<UsIdCRCResidentWorkerReferralRecordRaw> =
  {
    data: [
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
          usIdCrcResidentWorkerTimeBasedCriteria: {
            eligibleOffenses: null,
            fullTermCompletionDate: null,
            groupProjectedParoleReleaseDate: "2025-08-14",
            paroleEligibilityDate: null,
            nextParoleHearingDate: null,
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
      },
      {
        stateCode: "US_ID",
        externalId: "ID_RES004",
        eligibleCriteria: {
          custodyLevelIsMinimum: {
            custodyLevel: "MINIMUM",
          },
          notServingForSexualOffense: null,
          usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
          usIdNotDetainersForXcrcAndCrc: null,
          usIdCrcResidentWorkerTimeBasedCriteria: {
            eligibleOffenses: null,
            fullTermCompletionDate: "2031-03-13",
            groupProjectedParoleReleaseDate: null,
            nextParoleHearingDate: "2025-11-15",
            paroleEligibilityDate: "2025-10-12",
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
      },
    ],
    idFunc: externalIdFunc,
  };
