// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { makeRecordFixture } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  BaseUsMoOverdueRestrictiveHousingReferralRecord,
  baseUsMoOverdueRestrictiveHousingSchema,
} from "./schema";

export const usMoOverdueRestrictiveHousingBaseFixtures: FixtureMapping<BaseUsMoOverdueRestrictiveHousingReferralRecord> =
  {
    eligible: makeRecordFixture(baseUsMoOverdueRestrictiveHousingSchema, {
      stateCode: "US_MO",
      externalId: "rh-1",
      eligibleCriteria: {
        usMoInRestrictiveHousing: {
          confinementType: "COMMUNITY",
        },
        usMoNoActiveProgressiveDisciplineSanctions: {
          latestSanctionStartDate: "2023-08-15",
          latestSanctionEndDate: "2023-12-05",
        },
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
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
        housingUseCode: "123456",
        majorCdvs: [
          {
            cdvDate: "2022-02-20",
            cdvRule: "Rule 7.2",
          },
        ],
        cdvsSinceLastHearing: [],
        numMinorCdvsBeforeLastHearing: "5",
      },
    }),
  };
