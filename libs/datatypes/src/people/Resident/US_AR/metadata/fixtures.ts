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

import {
  RawUsArResidentCommon,
  RawUsArResidentJiiData,
  RawUsArResidentMetadata,
} from "./schema";

// Fields used by both JII and workflows products.
export const usArResidentCommonDataFixtures: RawUsArResidentCommon[] = [
  {
    stateCode: "US_AR",
    eligibilityDate: "2023-12-01",
    eligibilityDateName: "Release Eligibility Date",
    maximumReleaseDate: "2025-10-22",
  },
  {
    stateCode: "US_AR",
    eligibilityDate: "2023-12-01",
    eligibilityDateName: "Transfer Eligibility Date",
    maximumReleaseDate: "2025-10-22",
  },
  {
    stateCode: "US_AR",
    eligibilityDate: "2023-12-01",
    eligibilityDateName: "Transfer Eligibility Date",
    maximumReleaseDate: "2025-10-22",
  },
  {
    stateCode: "US_AR",
    eligibilityDate: "2024-06-01",
    eligibilityDateName: "Transfer Eligibility Date",
    maximumReleaseDate: "2026-01-15",
  },
  {
    stateCode: "US_AR",
    eligibilityDate: null,
    eligibilityDateName: "Parole Eligibility Date",
    maximumReleaseDate: null,
  },
  {
    stateCode: "US_AR",
    eligibilityDate: "2026-09-10",
    eligibilityDateName: "Release Eligibility Date",
    maximumReleaseDate: "2027-03-10",
  },
];

// JII-only fields (extends common).
export const usArResidentJiiDataFixtures: RawUsArResidentJiiData[] = [
  {
    ...usArResidentCommonDataFixtures[0],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[1],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[2],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[3],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[4],
    lastUpdatedDate: "2021-12-16",
  },
  {
    ...usArResidentCommonDataFixtures[5],
    cohortCode: "4",
    lastUpdatedDate: "2025-04-01",
  },
];

// Workflows metadata (extends common; spreads JII fixtures which include JII-only fields).
export const usArResidentMetadataFixtures: Array<RawUsArResidentMetadata> = [
  {
    ...usArResidentJiiDataFixtures[0],
    currentCustodyClassification: "C2",
    currentGtEarningClass: "I-P",
    currentLocation: "1230456",
    currentSentences: [
      {
        sentenceId: "555666888889999",
        startDate: "2015-10-12",
        endDate: "2016-06-08",
        initialTimeServedDays: 12,
        personId: 1,
      },
      {
        sentenceId: "222881257772134",
        startDate: "2005-02-12",
        endDate: "2008-04-22",
        initialTimeServedDays: 19,
        personId: 1,
      },
    ],
    gedCompletionDate: "2017-05-23",
    noIncarcerationSanctionsWithin6Months: true,
    noIncarcerationSanctionsWithin12Months: true,
    programAchievement: [
      {
        programLocation: "1400758",
        programAchievementDate: "2024-03-06",
        programType: "TEG",
        programEvaluationScore: null,
      },
      {
        programLocation: "1400756",
        programAchievementDate: "2019-12-04",
        programType: "SM",
        programEvaluationScore: "PASS",
      },
    ],
  },
  {
    ...usArResidentJiiDataFixtures[1],
    currentCustodyClassification: "C2",
    currentGtEarningClass: "I-P",
    currentLocation: "1230456",
    currentSentences: [
      {
        sentenceId: "555666888889999",
        startDate: "2015-10-12",
        endDate: "2016-06-08",
        initialTimeServedDays: 12,
        personId: 2,
      },
      {
        sentenceId: "222881257772134",
        startDate: "2005-02-12",
        endDate: "2008-04-22",
        initialTimeServedDays: 19,
        personId: 2,
      },
    ],
    gedCompletionDate: "2017-05-23",
    noIncarcerationSanctionsWithin6Months: true,
    noIncarcerationSanctionsWithin12Months: true,
    programAchievement: [
      {
        programLocation: "1400758",
        programAchievementDate: "2024-03-06",
        programType: "TEG",
        programEvaluationScore: null,
      },
      {
        programLocation: "1400756",
        programAchievementDate: "2019-12-04",
        programType: "SM",
        programEvaluationScore: "PASS",
      },
    ],
  },
  {
    ...usArResidentJiiDataFixtures[2],
    currentCustodyClassification: "C2",
    currentGtEarningClass: "I-P",
    currentLocation: "1230456",
    currentSentences: [
      {
        sentenceId: "555666888889999",
        startDate: "2015-10-12",
        endDate: "2016-06-08",
        initialTimeServedDays: 12,
        personId: 3,
      },
      {
        sentenceId: "222881257772134",
        startDate: "2005-02-12",
        endDate: "2008-04-22",
        initialTimeServedDays: 19,
        personId: 3,
      },
    ],
    gedCompletionDate: "2017-05-23",
    noIncarcerationSanctionsWithin6Months: true,
    noIncarcerationSanctionsWithin12Months: true,
    programAchievement: [
      {
        programLocation: "1400758",
        programAchievementDate: "2024-03-06",
        programType: "TEG",
        programEvaluationScore: null,
      },
      {
        programLocation: "1400756",
        programAchievementDate: "2019-12-04",
        programType: "SM",
        programEvaluationScore: "PASS",
      },
    ],
  },
  {
    ...usArResidentJiiDataFixtures[3],
    currentCustodyClassification: "C3",
    currentGtEarningClass: "II-P",
    currentLocation: "1230457",
    currentSentences: [
      {
        sentenceId: "555666888889998",
        startDate: "2016-04-12",
        endDate: "2017-01-08",
        initialTimeServedDays: 15,
        personId: 4,
      },
      {
        sentenceId: "222881257772133",
        startDate: "2006-08-12",
        endDate: "2009-10-22",
        initialTimeServedDays: 20,
        personId: 4,
      },
    ],
    gedCompletionDate: "2018-11-23",
    noIncarcerationSanctionsWithin6Months: true,
    noIncarcerationSanctionsWithin12Months: true,
    programAchievement: [
      {
        programLocation: "1400759",
        programAchievementDate: "2025-09-06",
        programType: "TEG",
        programEvaluationScore: null,
      },
      {
        programLocation: "1400757",
        programAchievementDate: "2020-06-04",
        programType: "SM",
        programEvaluationScore: "PASS",
      },
    ],
  },
  {
    ...usArResidentJiiDataFixtures[4],
    currentCustodyClassification: "C1",
    currentGtEarningClass: "III-P",
    currentLocation: "1230458",
    currentSentences: [
      {
        sentenceId: "555666888889997",
        startDate: "2014-07-12",
        endDate: "2015-03-08",
        initialTimeServedDays: 10,
        personId: 5,
      },
      {
        sentenceId: "222881257772132",
        startDate: "2003-05-12",
        endDate: "2006-07-22",
        initialTimeServedDays: 18,
        personId: 5,
      },
    ],
    gedCompletionDate: "2016-02-23",
    noIncarcerationSanctionsWithin6Months: true,
    noIncarcerationSanctionsWithin12Months: true,
    programAchievement: [
      {
        programLocation: "1400760",
        programAchievementDate: "2023-12-06",
        programType: "TEG",
        programEvaluationScore: null,
      },
      {
        programLocation: "1400755",
        programAchievementDate: "2018-01-04",
        programType: "SM",
        programEvaluationScore: "PASS",
      },
    ],
  },
  {
    ...usArResidentJiiDataFixtures[5],
    currentCustodyClassification: "C2",
    currentGtEarningClass: "I-P",
    currentLocation: "1230456",
    currentSentences: [
      {
        sentenceId: "555666888889996",
        startDate: "2025-03-10",
        endDate: "2027-03-10",
        initialTimeServedDays: 0,
        personId: 6,
      },
    ],
    gedCompletionDate: null,
    noIncarcerationSanctionsWithin6Months: true,
    noIncarcerationSanctionsWithin12Months: true,
    programAchievement: [],
  },
];
