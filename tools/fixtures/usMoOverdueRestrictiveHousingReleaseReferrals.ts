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
import { UsMoOverdueRestrictiveHousingReleaseReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsMo/UsMoOverdueRestrictiveHousingReleaseOpportunity/UsMoOverdueRestrictiveHousingReleaseReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usMoOverdueRestrictiveHousingReleaseReferrals =
  fixtureWithIdKey<UsMoOverdueRestrictiveHousingReleaseReferralRecordRaw>(
    "externalId",
    [
      {
        externalId: "RES007",
        stateCode: "US_MO",
        eligibleCriteria: {
          usMoD1SanctionAfterMostRecentHearing: {
            latestRestrictiveHousingHearingDate: "2023-01-20",
          },
          usMoD1SanctionAfterRestrictiveHousingStart: {
            latestD1SanctionStartDate: "2023-01-15",
            restrictiveHousingStartDate: "2023-01-10",
          },
          usMoInRestrictiveHousing: {
            confinementType: "COMMUNITY",
          },
          usMoNoActiveD1Sanctions: {
            latestSanctionEndDate: "2023-12-08",
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
        externalId: "RES008",
        stateCode: "US_MO",
        eligibleCriteria: {
          usMoD1SanctionAfterMostRecentHearing: {
            latestRestrictiveHousingHearingDate: "2023-01-20",
          },
          usMoD1SanctionAfterRestrictiveHousingStart: {
            latestD1SanctionStartDate: "2023-01-15",
            restrictiveHousingStartDate: "2023-01-10",
          },
          usMoInRestrictiveHousing: {
            confinementType: "COMMUNITY",
          },
          usMoNoActiveD1Sanctions: {
            latestSanctionEndDate: `${formatDateToISO(startOfTomorrow())}`,
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
        externalId: "RES009",
        stateCode: "US_MO",
        eligibleCriteria: {
          usMoD1SanctionAfterMostRecentHearing: {
            latestRestrictiveHousingHearingDate: "2023-01-20",
          },
          usMoD1SanctionAfterRestrictiveHousingStart: {
            latestD1SanctionStartDate: "2023-01-15",
            restrictiveHousingStartDate: "2023-01-10",
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
        externalId: "RES010",
        stateCode: "US_MO",
        eligibleCriteria: {
          usMoD1SanctionAfterMostRecentHearing: {
            latestRestrictiveHousingHearingDate: "2023-01-20",
          },
          usMoD1SanctionAfterRestrictiveHousingStart: {
            latestD1SanctionStartDate: "2023-01-15",
            restrictiveHousingStartDate: "2023-01-10",
          },
          usMoInRestrictiveHousing: {
            confinementType: "COMMUNITY",
          },
          usMoNoActiveD1Sanctions: {
            latestSanctionEndDate: `${formatDateToISO(new Date())}`,
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
