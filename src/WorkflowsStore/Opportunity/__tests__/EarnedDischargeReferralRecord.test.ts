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

import { transformReferral } from "../EarnedDischargeReferralRecord";

test("transform dual/parole record", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {},
    ineligibleCriteria: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: "2022-01-03",
      },
      negativeUaWithin90Days: {
        latestUaDates: ["2022-01-03"],
        latestUaResults: [false],
      },
      noFelonyWithin24Months: {
        latestFelonyConvictions: ["2022-01-05", "2022-05-28"],
      },
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: "2022-06-03",
      },
      supervisionNotPastFullTermCompletionDate: {
        eligibleDate: "2025-06-19",
      },
      usIdParoleDualSupervisionPastEarlyDischargeDate: {
        eligibleDate: "2022-05-22",
        sentenceType: "DUAL",
      },
    },
    eligibleStartDate: "2022-10-05",
    caseNotes: {
      foo: [
        {
          eventDate: "2022-04-06",
          noteBody: "Body1",
          noteTitle: "Title1",
        },
      ],
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("transform probation record", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {},
    ineligibleCriteria: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: "2022-01-03",
      },
      negativeUaWithin90Days: {
        latestUaDates: ["2022-01-03"],
        latestUaResults: [false],
      },
      noFelonyWithin24Months: {
        latestFelonyConvictions: ["2022-01-05", "2022-05-28"],
      },
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: "2022-06-03",
      },
      supervisionNotPastFullTermCompletionDate: {
        eligibleDate: "2025-06-19",
      },
      onProbationAtLeastOneYear: {
        eligibleDate: "2022-05-22",
        sentenceType: "DUAL",
      },
    },
    eligibleStartDate: "2022-10-05",
    caseNotes: {
      foo: [
        {
          eventDate: "2022-04-06",
          noteBody: "Body1",
          noteTitle: "Title1",
        },
      ],
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("optional criteria have sane fallbacks", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {},
    ineligibleCriteria: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: "2022-01-03",
      },
      negativeUaWithin90Days: null,
      noFelonyWithin24Months: null,
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: "2022-06-03",
      },
      supervisionNotPastFullTermCompletionDate: {
        eligibleDate: "2025-06-19",
      },
      onProbationAtLeastOneYear: {
        eligibleDate: "2022-05-22",
        sentenceType: "DUAL",
      },
    },
    eligibleStartDate: "2022-10-05",
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("transforms records with eligible and ineligible criteria", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {},
    ineligibleCriteria: {
      usIdParoleDualSupervisionPastEarlyDischargeDate: {
        eligibleDate: "2025-06-19",
        sentenceType: "PAROLE",
      },
    },
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: "2022-01-03",
      },
      negativeUaWithin90Days: null,
      noFelonyWithin24Months: null,
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: "2022-06-03",
      },
      supervisionNotPastFullTermCompletionDate: {
        eligibleDate: "2025-06-19",
      },
      onProbationAtLeastOneYear: {
        eligibleDate: "2022-05-22",
        sentenceType: "DUAL",
      },
    },
    eligibleStartDate: "2022-10-05",
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("formInformation parses", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {
      ncicCheckDate: "2022-11-10",
      chargeDescriptions: ["Shoplifting", "Public Intoxication", "Trespassing"],
      fullTermReleaseDates: ["2023-08-11", "2023-07-30", "2023-06-10"],
      judgeNames: [
        '{"givenNames": "Starla", "surname": "Murieta"}',
        '{"givenNames": "Raymond", "surname": "Dart"}',
        '{"givenNames": "Ahmud", "surname": "Blake"}',
      ],
      countyNames: ["Duane", "Duane", "Moraga"],
      sentenceMax: [365, 334, 60],
      sentenceMin: [92, 61, 15],
      caseNumbers: ["12858", "13085", "14558"],
      dateImposed: ["2022-08-13", "2022-09-30", "2022-10-03"],
      initialRestitution: 4289.63,
      lastRestitutionPaymentDate: "2022-08-09",
      currentRestitutionBalance: 0,
      initialFines: 98.25,
      lastFinesPaymentDate: "2022-09-08",
      currentFinesBalance: 12.18,
      firstAssessmentScore: 27,
      firstAssessmentDate: "2020-03-28",
      latestAssessmentScore: 19,
      latestAssessmentDate: "2022-10-24",
    },
    ineligibleCriteria: {},
    eligibleCriteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: "2022-01-03",
      },
      negativeUaWithin90Days: null,
      noFelonyWithin24Months: null,
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: "2022-06-03",
      },
      supervisionNotPastFullTermCompletionDate: {
        eligibleDate: "2025-06-19",
      },
      onProbationAtLeastOneYear: {
        eligibleDate: "2022-05-22",
        sentenceType: "DUAL",
      },
    },
    eligibleStartDate: "2022-10-05",
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});
