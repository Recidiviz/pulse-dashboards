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
import { UsMoRestrictiveHousingStatusHearingReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsMoRestrictiveHousingStatusHearingReferralRecord";
import { FixtureData } from "../workflowsFixtures";
import { externalIdFunc } from "./utils";

export const usMoRestrictiveHousingStatusHearingFixture: FixtureData<UsMoRestrictiveHousingStatusHearingReferralRecordRaw> =
  {
    data: [
      {
        stateCode: "US_MO",
        externalId: "RES004",
        eligibleCriteria: {
          usMoHasUpcomingHearing: {
            nextReviewDate: "2023-11-03",
          },
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
        metadata: {
          mostRecentHearingDate: "2022-09-03",
          mostRecentHearingType: "hearing type",
          mostRecentHearingFacility: "FACILITY NAME",
          mostRecentHearingComments: "Reason for Hearing: 30 day review",
          currentFacility: "FACILITY 01",
          restrictiveHousingStartDate: "2022-10-01",
          bedNumber: "03",
          roomNumber: "05",
          complexNumber: "2",
          buildingNumber: "13",
          housingUseCode: "HOS",
          majorCdvs: [
            {
              cdvDate: "2022-02-20",
              cdvRule: "Rule 7.2",
            },
          ],
          cdvsSinceLastHearing: [],
          numMinorCdvsBeforeLastHearing: "3",
        },
      },
      {
        stateCode: "US_MO",
        externalId: "RES006",
        eligibleCriteria: {
          usMoHasUpcomingHearing: {
            nextReviewDate: "2023-12-01",
          },
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
        metadata: {
          mostRecentHearingDate: "2022-12-04",
          mostRecentHearingType: "hearing type 2",
          mostRecentHearingFacility: "FACILITY NAME",
          mostRecentHearingComments:
            "Reason for Hearing: Protective custody investigation",
          currentFacility: "FACILITY 02",
          restrictiveHousingStartDate: "2022-10-15",
          bedNumber: "04",
          roomNumber: "06",
          complexNumber: "3",
          buildingNumber: "10",
          housingUseCode: "HOS",
          majorCdvs: [
            {
              cdvDate: "2022-02-20",
              cdvRule: "Rule 7.2",
            },
            {
              cdvDate: "2022-03-30",
              cdvRule: "Rule 8.1",
            },
          ],
          cdvsSinceLastHearing: [
            {
              cdvDate: "2022-03-15",
              cdvRule: "Rule 10.3",
            },
            {
              cdvDate: "2022-04-10",
              cdvRule: "Rule 11.4",
            },
          ],
          numMinorCdvsBeforeLastHearing: "0",
        },
      },
    ],
    idFunc: externalIdFunc,
  };
