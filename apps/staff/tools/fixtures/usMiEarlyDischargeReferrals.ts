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
        eligibleDate: "2024-03-01",
      },
      eligibleCriteria: {
        supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: {
          eligibleDate: "2023-03-01",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_MI",
      externalId: "ed-eligible-2",
      metadata: {
        supervisionType: "Probation",
        eligibleDate: "2021-03-01",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_MI",
      externalId: "ed-eligible-3",
      metadata: {
        supervisionType: "Parole",
        interstateFlag: "IC-OUT",
        eligibleDate: "2021-04-01",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_MI",
      externalId: "ed-eligible-4",
      metadata: {
        supervisionType: "Probation",
        eligibleDate: "2022-04-04",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_MI",
      externalId: "ed-eligible-5",
      metadata: {
        supervisionType: "Parole",
        interstateFlag: "IC-OUT",
        eligibleDate: "2022-03-04",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_MI",
      externalId: "001",
      metadata: {
        supervisionType: "Probation",
        eligibleDate: "2022-03-10",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_MI",
      externalId: "cr-eligible-1",
      metadata: {
        supervisionType: "Probation",
        eligibleDate: "2022-05-15",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_MI",
      externalId: "cr-eligible-2",
      metadata: {
        supervisionType: "Probation",
        eligibleDate: "2022-05-15",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_MI",
      externalId: "010",
      metadata: {
        supervisionType: "Probation",
        eligibleDate: "2022-10-15",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_MI",
      externalId: "ed-ae-1",
      metadata: {
        supervisionType: "Probation",
        eligibleDate: "2026-11-01",
      },
      eligibleCriteria: {
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
      ineligibleCriteria: {
        supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: {
          eligibleDate: "2026-11-01",
        },
      },
      isEligible: false,
      isAlmostEligible: true,
    },
    {
      stateCode: "US_MI",
      externalId: "ed-ae-denied-1",
      metadata: {
        supervisionType: "Probation",
        eligibleDate: "2026-12-01",
      },
      eligibleCriteria: {
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
      ineligibleCriteria: {
        supervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: {
          eligibleDate: "2026-12-01",
        },
      },
      isEligible: false,
      isAlmostEligible: true,
    },
    {
      stateCode: "US_MI",
      externalId: "ed-pending-1",
      metadata: {
        supervisionType: "Probation",
        eligibleDate: "2024-09-01",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_MI",
      externalId: "ed-sr-1",
      metadata: {
        supervisionType: "Probation",
        eligibleDate: "2024-02-01",
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
      ineligibleCriteria: {},
      isEligible: true,
      isAlmostEligible: false,
    },
  ]);
