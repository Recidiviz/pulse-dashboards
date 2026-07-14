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

import { makeRecordFixture } from "../../../utils/zod/object/makeRecordFixture";
import { FixtureMapping } from "../../utils/types";
import {
  UsMiEarlyDischargeReferralRecord,
  usMiEarlyDischargeSchema,
} from "./schema";

export const usMiEarlyDischargeFixtures = {
  fullyEligibleParole: makeRecordFixture(usMiEarlyDischargeSchema, {
    stateCode: "US_MI",
    externalId: "ed-eligible-1",
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
      usMiNoPendingDetainer: { pendingDetainer: false },
      usMiNoNewIneligibleOffensesForEarlyDischargeFromSupervision: {
        latestIneligibleConvictions: [],
      },
      usMiNotServingIneligibleOffensesForEarlyDischargeFromParoleDualSupervision:
        { ineligibleOffenses: [] },
      usMiSupervisionOrSupervisionOutOfStateLevelIsNotSai: {
        supervisionLevelRawText: "MINIMUM",
      },
      usMiNoActivePpo: { activePpo: false },
      usMiNoOwiViolationOnParoleDualSupervision: {
        latestIneligibleConvictions: [],
      },
    },
    ineligibleCriteria: {},
    metadata: {
      supervisionType: "Parole",
      interstateFlag: "IC-OUT",
      eligibleDate: "2024-03-01",
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
  fullyEligibleProbation: makeRecordFixture(usMiEarlyDischargeSchema, {
    stateCode: "US_MI",
    externalId: "ed-eligible-2",
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
      usMiNoActivePpo: { activePpo: false },
      usMiNotServingIneligibleOffensesForEarlyDischargeFromProbationSupervision:
        { currentOffenses: [] },
    },
    ineligibleCriteria: {},
    metadata: {
      supervisionType: "Probation",
      eligibleDate: "2021-03-01",
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
} satisfies FixtureMapping<UsMiEarlyDischargeReferralRecord>;
