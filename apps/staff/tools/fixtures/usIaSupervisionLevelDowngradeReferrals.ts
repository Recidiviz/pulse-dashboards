// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { UsIaSupervisionLevelDowngradeReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsIa";
import { fixtureWithIdKey } from "./utils";

export const usIaSupervisionLevelDowngradeReferralsFixture =
  fixtureWithIdKey<UsIaSupervisionLevelDowngradeReferralRecordRaw>(
    "externalId",
    [
      {
        stateCode: "US_IA",
        externalId: "001",
        eligibleCriteria: {
          usIaSupervisionFeesPaid: {
            supervisionFeesPaidDate: relativeFixtureDate({ months: -12 }),
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
        eligibleDate: relativeFixtureDate({ months: -12 }),
      },
      {
        stateCode: "US_IA",
        externalId: "002",
        eligibleCriteria: {
          usIaEDDeniedFinesAndFees: {
            edDeniedFinesAndFeesDate: relativeFixtureDate({ months: -12 }),
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
        eligibleDate: relativeFixtureDate({ months: -12 }),
      },
      {
        stateCode: "US_IA",
        externalId: "003",
        eligibleCriteria: {
          usIaEDDeniedFinesAndFees: {
            edDeniedFinesAndFeesDate: relativeFixtureDate({ months: -12 }),
          },
        },
        ineligibleCriteria: {},
        isEligible: true,
        isAlmostEligible: false,
        eligibleDate: relativeFixtureDate({ months: -12 }),
      },
      {
        stateCode: "US_IA",
        externalId: "004",
        eligibleCriteria: {},
        ineligibleCriteria: {},
        isEligible: false,
        isAlmostEligible: true,
        eligibleDate: relativeFixtureDate({ months: -12 }),
      },
      {
        stateCode: "US_IA",
        externalId: "005",
        eligibleCriteria: {},
        ineligibleCriteria: {},
        isEligible: false,
        isAlmostEligible: true,
        eligibleDate: relativeFixtureDate({ months: -12 }),
      },
    ],
  );
