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

import { UsUtEarlyTerminationReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsUt";
import { externalIdFunc, FirestoreFixture } from "./utils";

const data: UsUtEarlyTerminationReferralRecordRaw[] = [
  {
    stateCode: "US_UT",
    externalId: "UT001",
    eligibleCriteria: {},
    ineligibleCriteria: {},
    isEligible: true,
    isAlmostEligible: false,
    metadata: {
      tabName: "REPORT_DUE_ELIGIBLE",
    },
  },
  {
    stateCode: "US_UT",
    externalId: "UT002",
    eligibleCriteria: {},
    ineligibleCriteria: {},
    isEligible: false,
    isAlmostEligible: true,
    metadata: {
      tabName: "REPORT_DUE_ALMOST_ELIGIBLE",
    },
  },
  {
    stateCode: "US_UT",
    externalId: "UT003",
    eligibleCriteria: {},
    ineligibleCriteria: {},
    isEligible: false,
    isAlmostEligible: true,
    metadata: {
      tabName: "EARLY_REQUESTS",
    },
  },
];

export const usUtEarlyTerminationReferrals: FirestoreFixture<UsUtEarlyTerminationReferralRecordRaw> =
  {
    data,
    idFunc: externalIdFunc,
  };
