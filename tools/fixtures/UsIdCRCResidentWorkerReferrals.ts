// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { FixtureData } from "../workflowsFixtures";
import { externalIdFunc } from "./utils";

export const usIdCRCResidentWorkerReferrals: FixtureData<UsIdCRCResidentWorkerReferralRecordRaw> =
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
          usIdNoDetainersForCrc: null,
          usIdCrcResidentWorkerTimeBasedCriteria: {
            reasons: [
              {
                criteriaName:
                  "US_IX_INCARCERATION_WITHIN_3_YEARS_OF_TPD_AND_LIFE_SENTENCE",
                tentativeParoleDate: "2025-08-14",
              },
            ],
          },
        },
        ineligibleCriteria: {},
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
          usIdNoDetainersForCrc: null,
          usIdCrcResidentWorkerTimeBasedCriteria: {
            reasons: [
              {
                criteriaName:
                  "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_FTCD_OR_TPD",
                fullTermCompletionDate: "2028-10-10",
                tentativeParoleDate: null,
              },
              {
                criteriaName:
                  "US_IX_INCARCERATION_WITHIN_7_YEARS_OF_PED_AND_PHD_AND_20_YEARS_OF_FTCD",
                fullTermCompletionDate: "2031-03-13",
                nextParoleHearingDate: "2025-11-15",
                paroleEligibilityDate: "2025-10-12",
              },
            ],
          },
        },
        ineligibleCriteria: {},
      },
    ],
    idFunc: externalIdFunc,
  };
