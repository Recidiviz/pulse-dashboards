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

import { transformLSUReferral as transformReferral } from "../LSUOpportunity";

test("transform record", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {
      clientName: "Betty Rubble",
    },
    eligibleCriteria: {
      usIdLsirLevelLowFor90Days: {
        riskLevel: "LOW",
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
      usIdNoActiveNco: {
        activeNco: true,
      },
      onSupervisionAtLeastOneYear: {
        eligibleDate: "2022-05-28",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      foo: [
        {
          eventDate: "2022-04-06",
          noteBody: "Body1",
          noteTitle: "Title1",
        },
        {
          eventDate: "2022-06-06",
          noteBody: "Body2",
          noteTitle: "Title2",
        },
      ],
      "ba bar": [
        {
          eventDate: "2022-09-06",
          noteBody: "Body3",
          noteTitle: "Title3",
        },
      ],
    },
    eligibleStartDate: "2022-10-05",
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("optional criteria have sane fallbacks", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {
      clientName: "Betty Rubble",
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
      usIdNoActiveNco: null,
      onSupervisionAtLeastOneYear: {
        eligibleDate: "2022-05-28",
      },
    },
    eligibleStartDate: "2022-10-05",
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("can transform record with old criteria", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {
      clientName: "Betty Rubble",
    },
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
      usIdNoActiveNco: {
        activeNco: true,
      },
      onSupervisionAtLeastOneYear: {
        eligibleDate: "2022-05-28",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      foo: [
        {
          eventDate: "2022-04-06",
          noteBody: "Body1",
          noteTitle: "Title1",
        },
        {
          eventDate: "2022-06-06",
          noteBody: "Body2",
          noteTitle: "Title2",
        },
      ],
      "ba bar": [
        {
          eventDate: "2022-09-06",
          noteBody: "Body3",
          noteTitle: "Title3",
        },
      ],
    },
    eligibleStartDate: "2022-10-05",
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("can transform record with eligible and ineligible criteria", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {
      clientName: "Betty Rubble",
    },
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
        incomeVerifiedDate: "2024-06-03",
      },
      supervisionNotPastFullTermCompletionDate: {
        eligibleDate: "2025-06-19",
      },
      usIdNoActiveNco: {
        activeNco: true,
      },
      onSupervisionAtLeastOneYear: {
        eligibleDate: "2022-05-28",
      },
    },
    ineligibleCriteria: {
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: "2024-06-03",
      },
    },
    caseNotes: {
      foo: [
        {
          eventDate: "2022-04-06",
          noteBody: "Body1",
          noteTitle: "Title1",
        },
        {
          eventDate: "2022-06-06",
          noteBody: "Body2",
          noteTitle: "Title2",
        },
      ],
      "ba bar": [
        {
          eventDate: "2022-09-06",
          noteBody: "Body3",
          noteTitle: "Title3",
        },
      ],
    },
    eligibleStartDate: "2022-10-05",
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});
