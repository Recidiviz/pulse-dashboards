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

import { UsIaEarlyDischargeReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsIa";
import { fixtureWithIdKey } from "./utils";

// TODO(#8267) Flesh out fixtures for demo mode
export const usIaEarlyDischargeReferralsFixture =
  fixtureWithIdKey<UsIaEarlyDischargeReferralRecordRaw>("externalId", [
    {
      stateCode: "US_IA",
      externalId: "ed-external-id-1",
      eligibleCriteria: {
        noSupervisionViolationWithin6Months: null,
        supervisionCaseTypeIsNotSexOffense: null,
        usIaNoOpenSupervisionModifiers: null,
        usIaNotServingIneligibleOffenseForEarlyDischarge: null,
        usIaSupervisionFeesPaid: {
          supervisionFeeBalance: 1,
        },
        usIaSupervisionLevelIs0NotAvailable12Or3: {
          supervisionLevelRawText: "LEVEL 2",
        },
        usIa90DaysPassedSinceCaseAssignment: null,
        usIaNotWithin30DaysOfReleaseDate: null,
        usIaNotExcludedFromEarlyDischargePerBoardOrParoleOrder: null,
      },
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
      formInformation: {},
      eligibleDate: "2024-01-01",
      metadata: {
        victimFlag: true,
      },
    },
  ]);
