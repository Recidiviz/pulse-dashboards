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

import { UsIdCustodyLevelDowngradeReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsId";
import { fixtureWithIdKey } from "./utils";

export const usIdCustodyLevelDowngradeReferrals =
  fixtureWithIdKey<UsIdCustodyLevelDowngradeReferralRecordRaw>("externalId", [
    {
      stateCode: "US_ID",
      externalId: "ID_RES001",
      eligibleCriteria: {
        custodyLevelHigherThanRecommended: {
          custodyLevel: "MEDIUM",
          recommendedCustodyLevel: "MINIMUM",
          upcomingEligibilityDate: "2020-09-04",
        },
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      metadata: {
        eligibleDate: "2020-09-04",
      },
    },
    {
      stateCode: "US_ID",
      externalId: "ID_RES002",
      eligibleCriteria: {
        custodyLevelHigherThanRecommended: {
          custodyLevel: "MAXIMUM",
          recommendedCustodyLevel: "MEDIUM",
          upcomingEligibilityDate: "2021-01-04",
        },
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      metadata: {
        eligibleDate: "2021-01-04",
      },
    },
  ]);
