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

import { UsIdExpandedCRCReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsId";
import { externalIdFunc, FirestoreFixture } from "./utils";

export const usIdExpandedCRCReferrals: FirestoreFixture<UsIdExpandedCRCReferralRecordRaw> =
  {
    data: [
      {
        stateCode: "US_ID",
        externalId: "ID_RES001",
        eligibleCriteria: {
          custodyLevelIsMinimum: {
            custodyLevel: "MINIMUM",
          },
          notServingForSexualOffense: null,
          usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: null,
          usIdNotDetainersForXcrcAndCrc: null,
          usIdIncarcerationWithin6MonthsOfFtcdOrPedOrEprd: {
            fullTermCompletionDate: "2024-03-12",
            paroleEligibilityDate: "2023-11-03",
          },
          usIdInCrcFacilityOrPwccUnit1: {
            crcStartDate: "2021-02-15",
            facilityName: "PRC",
          },
          usIdInCrcFacilityOrPwccUnit1For60Days: {
            sixtyDaysInCrcFacilityDate: "2023-04-16",
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
      },
    ],
    idFunc: externalIdFunc,
  };
