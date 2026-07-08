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
  UsUtEarlyTerminationRecord,
  usUtEarlyTerminationSchema,
} from "./schema";

export const usUtEarlyTerminationFixtures = {
  eligible1ReportDueEligible: makeRecordFixture(usUtEarlyTerminationSchema, {
    stateCode: "US_UT",
    externalId: "UT001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      atLeast6MonthsSinceMostRecentPositiveDrugTest: null,
      onSupervisionAtLeast6Months: null,
      supervisionContinuousEmploymentFor3Months: null,
      supervisionHousingIsPermanentFor3Months: null,
      usUtHasCompletedOrderedAssessments: null,
      usUtNoMedhighSupervisionViolationWithin3Months: null,
      usUtNoRiskLevelIncreaseOf15Percent: null,
      usUtRiskReductionForEt: null,
      usUtSupervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: null,
    },
    ineligibleCriteria: {},
    metadata: { tabName: "REPORT_DUE_ELIGIBLE" },
    caseNotes: {
      "Accomplishments (in the past year)": [
        {
          eventDate: "2021-10-08",
          noteTitle: "CONDITIONS",
          noteBody: "By having achieved maximum earned compliance credits.",
        },
        {
          eventDate: "2021-10-08",
          noteTitle: "CONDITIONS",
          noteBody:
            "By having completed all special & standard conditions of probation/parole.",
        },
      ],
      "Latest LS/RNR": [
        {
          eventDate: "2021-11-30",
          noteTitle: "Score",
          noteBody: "8 - LOW",
        },
      ],
    },
  }),
  almostEligible2ReportDueAlmostEligible: makeRecordFixture(
    usUtEarlyTerminationSchema,
    {
      stateCode: "US_UT",
      externalId: "UT002",
      isEligible: false,
      isAlmostEligible: true,
      eligibleCriteria: {
        atLeast6MonthsSinceMostRecentPositiveDrugTest: null,
        onSupervisionAtLeast6Months: null,
        supervisionContinuousEmploymentFor3Months: null,
        supervisionHousingIsPermanentFor3Months: null,
        usUtNoMedhighSupervisionViolationWithin3Months: null,
        usUtNoRiskLevelIncreaseOf15Percent: null,
        usUtRiskReductionForEt: null,
        usUtSupervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: null,
      },
      ineligibleCriteria: {
        usUtHasCompletedOrderedAssessments: null,
      },
      metadata: { tabName: "REPORT_DUE_ALMOST_ELIGIBLE" },
      caseNotes: {
        "Latest LS/RNR": [
          {
            eventDate: "2021-11-30",
            noteTitle: "Score",
            noteBody: "15 - MODERATE",
          },
        ],
      },
    },
  ),
  almostEligible3EarlyRequests: makeRecordFixture(usUtEarlyTerminationSchema, {
    stateCode: "US_UT",
    externalId: "UT003",
    isEligible: false,
    isAlmostEligible: true,
    eligibleCriteria: {
      atLeast6MonthsSinceMostRecentPositiveDrugTest: null,
      onSupervisionAtLeast6Months: null,
      supervisionContinuousEmploymentFor3Months: null,
      supervisionHousingIsPermanentFor3Months: null,
      usUtHasCompletedOrderedAssessments: null,
      usUtNoMedhighSupervisionViolationWithin3Months: null,
      usUtNoRiskLevelIncreaseOf15Percent: null,
      usUtRiskReductionForEt: null,
    },
    ineligibleCriteria: {
      usUtSupervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: null,
    },
    metadata: { tabName: "EARLY_REQUESTS" },
    caseNotes: {
      "Latest LS/RNR": [
        {
          eventDate: "2021-11-30",
          noteTitle: "Score",
          noteBody: "16 - MODERATE",
        },
      ],
    },
  }),
  eligible4ReportSubmitted: makeRecordFixture(usUtEarlyTerminationSchema, {
    stateCode: "US_UT",
    externalId: "UT004",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      atLeast6MonthsSinceMostRecentPositiveDrugTest: null,
      onSupervisionAtLeast6Months: null,
      supervisionContinuousEmploymentFor3Months: null,
      supervisionHousingIsPermanentFor3Months: null,
      usUtHasCompletedOrderedAssessments: null,
      usUtNoMedhighSupervisionViolationWithin3Months: null,
      usUtNoRiskLevelIncreaseOf15Percent: null,
      usUtRiskReductionForEt: null,
      usUtSupervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: null,
    },
    ineligibleCriteria: {},
    metadata: { tabName: "REPORT_SUBMITTED" },
    caseNotes: {
      "Latest LS/RNR": [
        {
          eventDate: "2021-11-30",
          noteTitle: "Score",
          noteBody: "16 - MODERATE",
        },
      ],
    },
  }),
  almostEligible5ReportDueIneligible: makeRecordFixture(
    usUtEarlyTerminationSchema,
    {
      stateCode: "US_UT",
      externalId: "UT005",
      isEligible: false,
      isAlmostEligible: true,
      eligibleCriteria: {
        onSupervisionAtLeast6Months: null,
        supervisionHousingIsPermanentFor3Months: null,
        usUtHasCompletedOrderedAssessments: null,
        usUtNoMedhighSupervisionViolationWithin3Months: null,
        usUtNoRiskLevelIncreaseOf15Percent: null,
        usUtRiskReductionForEt: null,
        usUtSupervisionOrSupervisionOutOfStatePastHalfFullTermReleaseDate: null,
      },
      ineligibleCriteria: {
        supervisionContinuousEmploymentFor3Months: null,
        atLeast6MonthsSinceMostRecentPositiveDrugTest: null,
        onSupervisionAtLeast6Months: null,
      },
      metadata: { tabName: "REPORT_DUE_INELIGIBLE" },
      caseNotes: {
        "Latest LS/RNR": [
          {
            eventDate: "2021-11-30",
            noteTitle: "Score",
            noteBody: "16 - MODERATE",
          },
        ],
      },
    },
  ),
} satisfies FixtureMapping<UsUtEarlyTerminationRecord>;
