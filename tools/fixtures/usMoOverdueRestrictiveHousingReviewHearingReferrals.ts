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
import { nextMonday, startOfTomorrow } from "date-fns";

import { formatDateToISO } from "../../src/utils";
import { UsMoOverdueRestrictiveHousingReviewHearingReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingReviewHearingOpportunity/UsMoOverdueRestrictiveHousingReviewHearingReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usMoOverdueRestrictiveHousingReviewHearingReferrals =
  fixtureWithIdKey<UsMoOverdueRestrictiveHousingReviewHearingReferralRecordRaw>(
    "externalId",
    [
      {
        externalId: "RES015",
        stateCode: "US_MO",
        eligibleCriteria: {
          usMoHearingOrNextReviewSinceRestrictiveHousingStart: {
            restrictiveHousingStartDate: "2023-01-10",
            latestRestrictiveHousingHearingDate: "2023-01-25",
          },
          usMoPastLatestScheduledReviewDate: {
            nextReviewDate: `${formatDateToISO(startOfTomorrow())}`,
            dueDateInferred: true,
          },
          usMoInRestrictiveHousing: {
            confinementType: "COMMUNITY",
          },
          usMoNoActiveD1Sanctions: {
            latestSanctionEndDate: `${formatDateToISO(nextMonday(new Date()))}`,
            latestSanctionStartDate: "2023-01-15",
          },
        },
        ineligibleCriteria: {},
        metadata: {
          mostRecentHearingDate: "2022-09-03",
          mostRecentHearingType: "hearing type",
          mostRecentHearingFacility: "FACILITY NAME",
          mostRecentHearingComments: "Reason for Hearing: 30 day review",
          currentFacility: "FACILITY 02",
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
        externalId: "RES016",
        stateCode: "US_MO",
        eligibleCriteria: {
          usMoHearingOrNextReviewSinceRestrictiveHousingStart: {
            restrictiveHousingStartDate: "2023-01-10",
            latestRestrictiveHousingHearingDate: "2023-01-25",
          },
          usMoPastLatestScheduledReviewDate: {
            nextReviewDate: `${formatDateToISO(nextMonday(new Date()))}`,
            dueDateInferred: true,
          },
          usMoInRestrictiveHousing: {
            confinementType: "COMMUNITY",
          },
          usMoNoActiveD1Sanctions: {
            latestSanctionEndDate: `${formatDateToISO(nextMonday(new Date()))}`,
            latestSanctionStartDate: "2023-01-15",
          },
        },
        ineligibleCriteria: {},
        metadata: {
          mostRecentHearingDate: "2022-09-03",
          mostRecentHearingType: "hearing type",
          mostRecentHearingFacility: "FACILITY NAME",
          mostRecentHearingComments: "Reason for Hearing: 30 day review",
          currentFacility: "FACILITY 02",
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
        externalId: "RES017",
        stateCode: "US_MO",
        eligibleCriteria: {
          usMoHearingOrNextReviewSinceRestrictiveHousingStart: {
            restrictiveHousingStartDate: "2023-01-10",
            latestRestrictiveHousingHearingDate: "2023-01-25",
          },
          usMoPastLatestScheduledReviewDate: {
            nextReviewDate: `${formatDateToISO(nextMonday(new Date()))}`,
            dueDateInferred: true,
          },
          usMoInRestrictiveHousing: {
            confinementType: "COMMUNITY",
          },
          usMoNoActiveD1Sanctions: {
            latestSanctionEndDate: `${formatDateToISO(nextMonday(new Date()))}`,
            latestSanctionStartDate: "2023-01-15",
          },
        },
        ineligibleCriteria: {},
        metadata: {
          mostRecentHearingDate: "2022-09-03",
          mostRecentHearingType: "hearing type",
          mostRecentHearingFacility: "FACILITY NAME",
          mostRecentHearingComments: "Reason for Hearing: 30 day review",
          currentFacility: "FACILITY 02",
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
        externalId: "RES018",
        stateCode: "US_MO",
        eligibleCriteria: {
          usMoHearingOrNextReviewSinceRestrictiveHousingStart: {
            restrictiveHousingStartDate: "2023-01-10",
            latestRestrictiveHousingHearingDate: "2023-01-25",
          },
          usMoPastLatestScheduledReviewDate: {
            nextReviewDate: `${formatDateToISO(new Date())}`,
            dueDateInferred: true,
          },
          usMoInRestrictiveHousing: {
            confinementType: "COMMUNITY",
          },
          usMoNoActiveD1Sanctions: {
            latestSanctionEndDate: `${formatDateToISO(nextMonday(new Date()))}`,
            latestSanctionStartDate: "2023-01-15",
          },
        },
        ineligibleCriteria: {},
        metadata: {
          mostRecentHearingDate: "2022-09-03",
          mostRecentHearingType: "hearing type",
          mostRecentHearingFacility: "FACILITY NAME",
          mostRecentHearingComments: "Reason for Hearing: 30 day review",
          currentFacility: "FACILITY 02",
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
    ]
  );
