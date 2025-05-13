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

import { ResidentFixture } from "../residents";

export const usArResidents: ResidentFixture[] = [
  {
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    personExternalId: "AR_RES001",
    displayId: "RES001",
    personName: {
      givenNames: "Sandra",
      middleNames: "Wynona",
      surname: "French",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres001",
    facilityId: "FACILITY1",
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
          sentenceId: 555666888889999,
          startDate: "2015-10-12",
          endDate: "2016-06-08",
          initialTimeServedDays: 12,
          personId: 1,
        },
        {
          sentenceId: 222881257772134,
          startDate: "2005-02-12",
          endDate: "2008-04-22",
          initialTimeServedDays: 19,
          personId: 1,
        },
      ],
      gedCompletionDate: "2017-05-23",
      maxFlatReleaseDate: "2025-10-22",
      noIncarcerationSanctionsWithin6Months: true,
      noIncarcerationSanctionsWithin12Months: true,
      paroleEligibilityDate: "2023-12-01",
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
      projectedReleaseDate: "2025-10-22",
    },
  },
  {
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    personExternalId: "AR_RES002",
    displayId: "RES002",
    personName: {
      givenNames: "Clayton",
      middleNames: "Milton",
      surname: "Hamilton",
    },
    gender: "MALE",
    pseudonymizedId: "anonres002",
    facilityId: "FACILITY2",
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
          sentenceId: 555666888889999,
          startDate: "2015-10-12",
          endDate: "2016-06-08",
          initialTimeServedDays: 12,
          personId: 2,
        },
        {
          sentenceId: 222881257772134,
          startDate: "2005-02-12",
          endDate: "2008-04-22",
          initialTimeServedDays: 19,
          personId: 2,
        },
      ],
      gedCompletionDate: "2017-05-23",
      maxFlatReleaseDate: "2025-10-22",
      noIncarcerationSanctionsWithin6Months: true,
      noIncarcerationSanctionsWithin12Months: true,
      paroleEligibilityDate: "2023-12-01",
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
      projectedReleaseDate: "2025-10-22",
    },
  },
  {
    allEligibleOpportunities: [],
    stateCode: "US_AR",
    personExternalId: "AR_RES003",
    displayId: "RES003",
    personName: {
      givenNames: "Robert",
      middleNames: "Terence",
      surname: "Bradley",
    },
    gender: "MALE",
    pseudonymizedId: "anonres003",
    facilityId: "FACILITY2",
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
          sentenceId: 555666888889999,
          startDate: "2015-10-12",
          endDate: "2016-06-08",
          initialTimeServedDays: 12,
          personId: 3,
        },
        {
          sentenceId: 222881257772134,
          startDate: "2005-02-12",
          endDate: "2008-04-22",
          initialTimeServedDays: 19,
          personId: 3,
        },
      ],
      gedCompletionDate: "2017-05-23",
      maxFlatReleaseDate: "2025-10-22",
      noIncarcerationSanctionsWithin6Months: true,
      noIncarcerationSanctionsWithin12Months: true,
      paroleEligibilityDate: "2023-12-01",
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
      projectedReleaseDate: "2025-10-22",
    },
  },
  {
    allEligibleOpportunities: ["usArInstitutionalWorkerStatus"],
    stateCode: "US_AR",
    personExternalId: "AR_RES004",
    displayId: "RES004",
    personName: {
      givenNames: "Alice",
      middleNames: "Marie",
      surname: "Johnson",
    },
    gender: "FEMALE",
    pseudonymizedId: "anonres004",
    facilityId: "FACILITY1",
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
          sentenceId: 555666888889998,
          startDate: "2016-04-12",
          endDate: "2017-01-08",
          initialTimeServedDays: 15,
          personId: 4,
        },
        {
          sentenceId: 222881257772133,
          startDate: "2006-08-12",
          endDate: "2009-10-22",
          initialTimeServedDays: 20,
          personId: 4,
        },
      ],
      gedCompletionDate: "2018-11-23",
      maxFlatReleaseDate: "2026-01-15",
      noIncarcerationSanctionsWithin6Months: true,
      noIncarcerationSanctionsWithin12Months: true,
      paroleEligibilityDate: "2024-06-01",
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
      projectedReleaseDate: "2026-01-15",
    },
  },
  {
    allEligibleOpportunities: ["usArInstitutionalWorkerStatus"],
    stateCode: "US_AR",
    personExternalId: "AR_RES005",
    displayId: "RES005",
    personName: {
      givenNames: "John",
      middleNames: "Edward",
      surname: "Smith",
    },
    gender: "MALE",
    pseudonymizedId: "anonres005",
    facilityId: "FACILITY1",
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
          sentenceId: 555666888889997,
          startDate: "2014-07-12",
          endDate: "2015-03-08",
          initialTimeServedDays: 10,
          personId: 5,
        },
        {
          sentenceId: 222881257772132,
          startDate: "2003-05-12",
          endDate: "2006-07-22",
          initialTimeServedDays: 18,
          personId: 5,
        },
      ],
      gedCompletionDate: "2016-02-23",
      maxFlatReleaseDate: "2024-05-10",
      noIncarcerationSanctionsWithin6Months: true,
      noIncarcerationSanctionsWithin12Months: true,
      paroleEligibilityDate: "2022-11-01",
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
      projectedReleaseDate: "2024-05-10",
    },
  },
];
