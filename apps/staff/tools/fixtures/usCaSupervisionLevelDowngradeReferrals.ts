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

import { UsCaSupervisionLevelDowngradeReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsCa";
import { fixtureWithIdKey } from "./utils";

export const usCaSupervisionLevelDowngradeReferrals =
  fixtureWithIdKey<UsCaSupervisionLevelDowngradeReferralRecordRaw>(
    "externalId",
    [
      {
        stateCode: "US_CA",
        externalId: "005",
        formInformation: {
          cdcno: "WF1234",
        },
        eligibleCriteria: {
          noSupervisionViolationWithin6Months: null,
          supervisionLevelIsHighFor6Months: {
            highStartDate: "2022-03-02",
          },
          usCaAssessmentLevel3OrLower: {},
          usCaHousingTypeIsNotTransient: {},
        },
        ineligibleCriteria: {},
      },
      {
        stateCode: "US_CA",
        externalId: "006",
        formInformation: {
          cdcno: "AB1234",
        },
        eligibleCriteria: {
          noSupervisionViolationWithin6Months: null,
          supervisionLevelIsHighFor6Months: {
            highStartDate: "2022-05-12",
          },
          usCaAssessmentLevel3OrLower: {},
          usCaHousingTypeIsNotTransient: {},
        },
        ineligibleCriteria: {},
      },
    ]
  );
