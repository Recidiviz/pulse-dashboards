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
import { parseISO } from "date-fns";

import { ResidentRecord } from "../../../../FirestoreStore";
import { UsMoRestrictiveHousingStatusHearingReferralRecord } from "..";

export const usMoPersonRecord: ResidentRecord = {
  recordId: "us_mo_111",
  personType: "RESIDENT",
  stateCode: "US_MO",
  personName: {
    givenNames: "Jessica",
    surname: "Hyde",
  },
  personExternalId: "111",
  displayId: "d111",
  pseudonymizedId: "p111",
  custodyLevel: "MINIMUM",
  officerId: "CASE_MANAGER_1",
  admissionDate: "2020-03-10",
  releaseDate: "2025-05-20",
  allEligibleOpportunities: ["usMoRestrictiveHousingStatusHearing"],
};

export const UsMoRestrictiveHousingStatusHearingRecordFixture: UsMoRestrictiveHousingStatusHearingReferralRecord =
  {
    stateCode: "US_MO",
    externalId: "004",
    eligibleCriteria: {
      usMoOverdueForHearing: {
        nextReviewDate: parseISO("2022-11-03"),
      },
      usMoInRestrictiveHousing: {
        confinementType: "confinement type",
      },
    },
    ineligibleCriteria: {},
    metadata: {
      mostRecentHearingDate: parseISO("2022-09-03"),
      mostRecentHearingType: "hearing type",
      mostRecentHearingFacility: "FACILITY NAME",
      mostRecentHearingComments: "Reason for Hearing: 30 day review",
      currentFacility: "FACILITY 01",
      restrictiveHousingStartDate: parseISO("2022-10-01"),
      bedNumber: "03",
      roomNumber: "05",
      complexNumber: "2",
      buildingNumber: "13",
      housingUseCode: "123456",
      majorCdvs: [
        {
          cdvDate: parseISO("2022-02-20"),
          cdvRule: "Rule 7.2",
        },
      ],
      cdvsSinceLastHearing: [],
      numMinorCdvsBeforeLastHearing: 5,
    },
  };