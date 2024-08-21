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

import { relativeFixtureDate } from "~datatypes";

import { UsMoRestrictiveHousingStatusHearingReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsMo/UsMoRestrictiveHousingStatusHearingOpportunity";
import { externalIdFunc, FirestoreFixture } from "./utils";

export const usMoRestrictiveHousingStatusHearingFixture: FirestoreFixture<UsMoRestrictiveHousingStatusHearingReferralRecordRaw> =
  {
    data: [
      // Overdue
      {
        stateCode: "US_MO",
        externalId: "RES004",
        eligibleCriteria: {
          usMoOverdueForHearing: {
            nextReviewDate: relativeFixtureDate({
              months: -1,
            }),
          },
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
        ineligibleCriteria: {},
        metadata: {
          mostRecentHearingDate: relativeFixtureDate({ months: -1, days: -5 }),
          mostRecentHearingType: "hearing type",
          mostRecentHearingFacility: "FACILITY NAME",
          mostRecentHearingComments: "Reason for Hearing: 30 day review",
          currentFacility: "FACILITY 01",
          restrictiveHousingStartDate: relativeFixtureDate({
            years: -1,
            months: -2,
          }),
          bedNumber: "03",
          roomNumber: "05",
          complexNumber: "2",
          buildingNumber: "13",
          housingUseCode: "HOS",
          majorCdvs: [
            {
              cdvDate: relativeFixtureDate({ months: -6 }),
              cdvRule: "Rule 7.2",
            },
          ],
          cdvsSinceLastHearing: [],
          numMinorCdvsBeforeLastHearing: "3",
        },
      },
      // Missing date
      {
        stateCode: "US_MO",
        externalId: "RES005",
        eligibleCriteria: {
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
        ineligibleCriteria: {
          usMoOverdueForHearing: {
            nextReviewDate: null,
          },
        },
        metadata: {
          mostRecentHearingDate: relativeFixtureDate({ months: -4 }),
          mostRecentHearingType: "hearing type 2",
          mostRecentHearingFacility: "FACILITY NAME",
          mostRecentHearingComments:
            "Reason for Hearing: Protective custody investigation",
          currentFacility: "FACILITY 02",
          restrictiveHousingStartDate: relativeFixtureDate({
            years: -1,
            months: -1,
          }),
          bedNumber: "04",
          roomNumber: "06",
          complexNumber: "3",
          buildingNumber: "10",
          housingUseCode: "HOS",
          majorCdvs: [
            {
              cdvDate: relativeFixtureDate({ months: -6, days: -3 }),
              cdvRule: "Rule 7.2",
            },
            {
              cdvDate: relativeFixtureDate({ months: -5, days: -3 }),
              cdvRule: "Rule 8.1",
            },
          ],
          cdvsSinceLastHearing: [
            {
              cdvDate: relativeFixtureDate({ months: -3, days: -10 }),
              cdvRule: "Rule 10.3",
            },
            {
              cdvDate: relativeFixtureDate({ months: -2, days: -4 }),
              cdvRule: "Rule 11.4",
            },
          ],
          numMinorCdvsBeforeLastHearing: "0",
        },
      },
      // Upcoming hearing
      {
        stateCode: "US_MO",
        externalId: "RES006",
        eligibleCriteria: {
          usMoInRestrictiveHousing: {
            confinementType: "confinement type",
          },
        },
        ineligibleCriteria: {
          usMoOverdueForHearing: {
            nextReviewDate: relativeFixtureDate({ months: 1 }),
          },
        },
        metadata: {
          mostRecentHearingDate: relativeFixtureDate({ months: -3 }),
          mostRecentHearingType: "hearing type 2",
          mostRecentHearingFacility: "FACILITY NAME",
          mostRecentHearingComments:
            "Reason for Hearing: Protective custody investigation",
          currentFacility: "FACILITY 02",
          restrictiveHousingStartDate: relativeFixtureDate({
            years: -1,
            months: -6,
            days: -14,
          }),
          bedNumber: "04",
          roomNumber: "06",
          complexNumber: "3",
          buildingNumber: "10",
          housingUseCode: "HOS",
          majorCdvs: [
            {
              cdvDate: relativeFixtureDate({ years: -1, months: -3 }),
              cdvRule: "Rule 7.2",
            },
            {
              cdvDate: relativeFixtureDate({ months: -10, days: -1 }),
              cdvRule: "Rule 8.1",
            },
          ],
          cdvsSinceLastHearing: [
            {
              cdvDate: relativeFixtureDate({ months: -2, days: -10 }),
              cdvRule: "Rule 10.3",
            },
            {
              cdvDate: relativeFixtureDate({ months: -1, days: -20 }),
              cdvRule: "Rule 11.4",
            },
          ],
          numMinorCdvsBeforeLastHearing: "0",
        },
      },
    ],
    idFunc: externalIdFunc,
  };
