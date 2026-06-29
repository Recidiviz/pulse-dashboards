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

import { makeRecordFixture, relativeFixtureDate } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsNcCreditReductionReviewRecord,
  usNcCreditReductionReviewSchema,
} from "./schema";

export const usNcCreditReductionReviewFixtures = {
  fullyEligible1: makeRecordFixture(usNcCreditReductionReviewSchema, {
    stateCode: "US_NC",
    externalId: "NC001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      drugScreenOkForCrr: {
        atLeast30DaysSinceDrugScreen: null,
        latestDrugScreenDate: relativeFixtureDate({
          months: -2,
          days: 20,
        }),
        latestDrugScreenResult: "N",
        mostRecentPositiveTestDate: null,
      },
      usNc90ConsecutiveDaysOfPositiveBehaviorForCrr: {
        completedFacilityProgramIds: null,
        completedProgramDischargeDates: null,
        completedProgramStartDates: null,
        completionOfFacilityProgramDuringPrs: null,
        continuousEmploymentFor90Days: null,
        continuousEnrollmentAtFacilityFor90Days: true,
        continuousStudentFor90Days: null,
        eligibleDate: relativeFixtureDate({
          years: -2,
          months: -2,
          days: 20,
        }),
        employerName: null,
        employmentStartDate: null,
        employmentStatus: null,
      },
      usNcCompletedSexOffenderTreatmentOrWithin30MonthsOfFullTermCompletionDate:
        null,
      usNcNoPendingViolationsOrConvictionsPrecludingCrr: null,
      usNcSupervisionNotPastProjectedEndDate: {
        projectedSupervisionEndDate: relativeFixtureDate({
          years: 1,
          months: 1,
          days: 20,
        }),
      },
    },
    ineligibleCriteria: {},
  }),
  fullyEligible2: makeRecordFixture(usNcCreditReductionReviewSchema, {
    stateCode: "US_NC",
    externalId: "NC002",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      drugScreenOkForCrr: {
        atLeast30DaysSinceDrugScreen: null,
        latestDrugScreenDate: relativeFixtureDate({
          months: -2,
          days: 20,
        }),
        latestDrugScreenResult: "N",
        mostRecentPositiveTestDate: null,
      },
      usNc90ConsecutiveDaysOfPositiveBehaviorForCrr: {
        completedFacilityProgramIds: null,
        completedProgramDischargeDates: null,
        completedProgramStartDates: null,
        completionOfFacilityProgramDuringPrs: null,
        continuousEmploymentFor90Days: null,
        continuousEnrollmentAtFacilityFor90Days: true,
        continuousStudentFor90Days: null,
        eligibleDate: relativeFixtureDate({
          years: -2,
          months: -2,
          days: 20,
        }),
        employerName: null,
        employmentStartDate: null,
        employmentStatus: null,
      },
      usNcCompletedSexOffenderTreatmentOrWithin30MonthsOfFullTermCompletionDate:
        null,
      usNcNoPendingViolationsOrConvictionsPrecludingCrr: null,
      usNcSupervisionNotPastProjectedEndDate: {
        projectedSupervisionEndDate: relativeFixtureDate({
          years: 1,
          months: 1,
          days: 20,
        }),
      },
    },
    ineligibleCriteria: {},
  }),
} satisfies FixtureMapping<UsNcCreditReductionReviewRecord>;
