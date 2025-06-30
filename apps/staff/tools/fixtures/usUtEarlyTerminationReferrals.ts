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
    isEligible: true,
    isAlmostEligible: false,
    metadata: {
      tabName: "REPORT_DUE_ELIGIBLE",
    },
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
  },
  {
    stateCode: "US_UT",
    externalId: "UT002",
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
    isEligible: false,
    isAlmostEligible: true,
    metadata: {
      tabName: "REPORT_DUE_ALMOST_ELIGIBLE",
    },
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
          noteBody: "15 - MODERATE",
        },
      ],
    },
  },
  {
    stateCode: "US_UT",
    externalId: "UT003",
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
    isEligible: false,
    isAlmostEligible: true,
    metadata: {
      tabName: "EARLY_REQUESTS",
    },
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
          noteBody: "16 - MODERATE",
        },
      ],
    },
  },
  {
    stateCode: "US_UT",
    externalId: "UT004",
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
    isEligible: true,
    isAlmostEligible: false,
    metadata: {
      tabName: "REPORT_SUBMITTED",
    },
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
          noteBody: "16 - MODERATE",
        },
      ],
    },
  },
  {
    stateCode: "US_UT",
    externalId: "UT005",
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
    isEligible: false,
    isAlmostEligible: true,
    metadata: {
      tabName: "REPORT_DUE_INELIGIBLE",
    },
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
          noteBody: "16 - MODERATE",
        },
      ],
    },
  },
];

export const usUtEarlyTerminationReferrals: FirestoreFixture<UsUtEarlyTerminationReferralRecordRaw> =
  {
    data,
    idFunc: externalIdFunc,
  };
