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

import {
  RawResidentCommon,
  residentCommonSchema,
} from "../residentCommonSchema";
import {
  RawWorkflowsResidentRecord,
  workflowsResidentRecordSchema,
} from "../workflowsResidentRecordSchema";

export const rawUsArResidentCommon: Array<RawResidentCommon> = [
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES001",
    pseudonymizedId: "anonres001",
    displayId: "RES001",
    personName: {
      givenNames: "Sandra",
      middleNames: "Wynona",
      surname: "French",
    },
    facilityId: "FACILITY1",
  },
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES002",
    pseudonymizedId: "anonres002",
    displayId: "RES002",
    personName: {
      givenNames: "Clayton",
      middleNames: "Milton",
      surname: "Hamilton",
    },
    facilityId: "FACILITY2",
  },
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES003",
    pseudonymizedId: "anonres003",
    displayId: "RES003",
    personName: {
      givenNames: "Robert",
      middleNames: "Terence",
      surname: "Bradley",
    },
    facilityId: "FACILITY2",
  },
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES004",
    pseudonymizedId: "anonres004",
    displayId: "RES004",
    personName: {
      givenNames: "Alice",
      middleNames: "Marie",
      surname: "Johnson",
    },
    facilityId: "FACILITY1",
  },
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES005",
    pseudonymizedId: "anonres005",
    displayId: "RES005",
    personName: { givenNames: "John", middleNames: "Edward", surname: "Smith" },
    facilityId: "FACILITY1",
  },
  {
    stateCode: "US_AR",
    personExternalId: "AR_RES006",
    pseudonymizedId: "anonres006",
    displayId: "RES006",
    personName: {
      givenNames: "Maria",
      middleNames: "Elena",
      surname: "Torres",
    },
    facilityId: "FACILITY1",
  },
];

export const usArResidentCommon = rawUsArResidentCommon.map((r) =>
  residentCommonSchema.parse(r),
);

export const rawUsArResidents: Array<RawWorkflowsResidentRecord> = [
  {
    ...rawUsArResidentCommon[0],
    recordId: "us_ar_res001",
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    gender: "FEMALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2025-10-22",
    metadata: {
      stateCode: "US_AR",
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
      lastUpdatedDate: "2021-12-16",
      maximumReleaseDate: "2025-10-22",
      noIncarcerationSanctionsWithin6Months: true,
      noIncarcerationSanctionsWithin12Months: true,
      eligibilityDate: "2023-12-01",
      eligibilityDateName: "Release Eligibility Date",
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
  },
  {
    ...rawUsArResidentCommon[1],
    recordId: "us_ar_res002",
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    gender: "MALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2019-08-12",
    releaseDate: "2026-01-07",
    metadata: {
      stateCode: "US_AR",
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
      eligibilityDate: "2023-12-01",
      eligibilityDateName: "Transfer Eligibility Date",
      gedCompletionDate: "2017-05-23",
      lastUpdatedDate: "2021-12-16",
      maximumReleaseDate: "2025-10-22",
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
  },
  {
    ...rawUsArResidentCommon[2],
    recordId: "us_ar_res003",
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    gender: "MALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2020-05-17",
    releaseDate: "2025-07-24",
    metadata: {
      stateCode: "US_AR",
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
      eligibilityDate: "2023-12-01",
      eligibilityDateName: "Transfer Eligibility Date",
      gedCompletionDate: "2017-05-23",
      lastUpdatedDate: "2021-12-16",
      maximumReleaseDate: "2025-10-22",
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
  },
  {
    ...rawUsArResidentCommon[3],
    recordId: "us_ar_res004",
    allEligibleOpportunities: ["usArInstitutionalWorkerStatus"],
    stateCode: "US_AR",
    gender: "FEMALE",
    unitId: "UNIT B",
    custodyLevel: "MEDIUM",
    admissionDate: "2021-01-15",
    releaseDate: "2026-01-15",
    metadata: {
      stateCode: "US_AR",
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
      eligibilityDate: "2024-06-01",
      eligibilityDateName: "Transfer Eligibility Date",
      gedCompletionDate: "2018-11-23",
      lastUpdatedDate: "2021-12-16",
      maximumReleaseDate: "2026-01-15",
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
  },
  {
    ...rawUsArResidentCommon[4],
    recordId: "us_ar_res005",
    allEligibleOpportunities: ["usArInstitutionalWorkerStatus"],
    stateCode: "US_AR",
    gender: "MALE",
    unitId: "UNIT C",
    custodyLevel: "MAXIMUM",
    admissionDate: "2018-11-20",
    releaseDate: "2024-05-10",
    metadata: {
      stateCode: "US_AR",
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
      eligibilityDate: null,
      eligibilityDateName: "Parole Eligibility Date",
      gedCompletionDate: "2016-02-23",
      lastUpdatedDate: "2021-12-16",
      maximumReleaseDate: null,
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
  },
  {
    ...rawUsArResidentCommon[5],
    recordId: "us_ar_res006",
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    gender: "FEMALE",
    unitId: "UNIT A",
    custodyLevel: "MINIMUM",
    admissionDate: "2025-03-10",
    releaseDate: "2027-03-10",
    metadata: {
      stateCode: "US_AR",
      cohortCode: "4",
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
      eligibilityDate: "2026-09-10",
      eligibilityDateName: "Release Eligibility Date",
      gedCompletionDate: null,
      lastUpdatedDate: "2025-04-01",
      maximumReleaseDate: "2027-03-10",
      noIncarcerationSanctionsWithin6Months: true,
      noIncarcerationSanctionsWithin12Months: true,
      programAchievement: [],
    },
  },
];

export const usArResidents = rawUsArResidents.map((r) =>
  workflowsResidentRecordSchema.parse(r),
);
