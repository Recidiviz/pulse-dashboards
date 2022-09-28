// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
    formInformation: {
      clientName: "Betty Rubble",
    },
    criteria: {
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
      noViolentMisdemeanorWithin12Months: {
        latestViolentConvictions: ["2022-03-09"],
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
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("transform probation record", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {
      clientName: "Betty Rubble",
    },
    criteria: {
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
      noViolentMisdemeanorWithin12Months: {
        latestViolentConvictions: ["2022-03-09"],
      },
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: "2022-06-03",
      },
      supervisionNotPastFullTermCompletionDate: {
        eligibleDate: "2025-06-19",
      },
      probationPast1Year: {
        eligibleDate: "2022-05-22",
        sentenceType: "DUAL",
      },
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("option criteria have sane fallbacks", () => {
  const rawRecord = {
    stateCode: "US_ID",
    externalId: "001",
    formInformation: {
      clientName: "Betty Rubble",
    },
    criteria: {
      usIdLsirLevelLowModerateForXDays: {
        riskLevel: "MODERATE",
        eligibleDate: "2022-01-03",
      },
      negativeUaWithin90Days: null,
      noFelonyWithin24Months: null,
      noViolentMisdemeanorWithin12Months: null,
      usIdIncomeVerifiedWithin3Months: {
        incomeVerifiedDate: "2022-06-03",
      },
      supervisionNotPastFullTermCompletionDate: {
        eligibleDate: "2025-06-19",
      },
      probationPast1Year: {
        eligibleDate: "2022-05-22",
        sentenceType: "DUAL",
      },
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});
