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

import { UsMiEarlyDischargeReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsMi";
import { fixtureWithIdKey } from "./utils";

export const usMiEarlyDischargeReferralsFixture =
  fixtureWithIdKey<UsMiEarlyDischargeReferralRecordRaw>("externalId", [
    {
      stateCode: "US_MI",
      externalId: "ed-eligible-1",
      metadata: {
        supervisionType: "Parole",
        interstateFlag: "IC-OUT",
      },
      eligibleCriteria: {
        supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: {
          eligibleDate: "2022-03-01",
        },
        supervisionNotPastFullTermCompletionDate: {
          eligibleDate: "2022-03-01",
        },
        supervisionOrSupervisionOutOfStateLevelIsNotHigh: {
          supervisionLevel: "MINIMUM",
        },
        servingAtLeastOneYearOnParoleSupervisionOrSupervisionOutOfState: {
          projectedCompletionDateMax: "2025-03-01",
        },
        usMiParoleDualSupervisionPastEarlyDischargeDate: {
          sentenceType: "PAROLE",
          eligibleDate: "2023-01-01",
        },
        usMiNoPendingDetainer: {
          pendingDetainer: false,
        },
        usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: {
          latestIneligibleConvictions: [],
        },
        usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision:
          {
            ineligibleOffenses: [],
          },
        usMiSupervisionOrSupervisionOutOfStateLevelIsNotSai: {
          supervisionLevelRawText: "MINIMUM",
        },
        usMiNoActivePpo: {
          activePpo: false,
        },
        usMiNoOwiViolationOnParoleDualSupervision: {
          latestIneligibleConvictions: [],
        },
      },
    },
    {
      stateCode: "US_MI",
      externalId: "ed-eligible-2",
      metadata: {
        supervisionType: "Probation",
      },
      eligibleCriteria: {
        supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: {
          eligibleDate: "2022-03-01",
        },
        supervisionNotPastFullTermCompletionDate: {
          eligibleDate: "2022-03-01",
        },
        usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: {
          latestIneligibleConvictions: [],
        },
        usMiNoActivePpo: {
          activePpo: false,
        },
        usMiNotServingIneligibleOffensesForEarlyDischargeFromProbationSupervision:
          {
            currentOffenses: [],
          },
      },
    },
  ]);
