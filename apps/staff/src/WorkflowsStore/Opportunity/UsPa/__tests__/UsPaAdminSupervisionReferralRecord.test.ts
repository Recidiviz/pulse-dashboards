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
  UsPaAdminSupervisionReferralRecordRaw,
  usPaAdminSupervisionSchema,
} from "../UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";

const rawRecord: UsPaAdminSupervisionReferralRecordRaw = {
  stateCode: "US_PA",
  externalId: "abc123",
  eligibleCriteria: {
    usPaNoHighSanctionsInPastYear: {},
    usPaNotServingIneligibleOffenseForAdminSupervision: {
      ineligibleOffenses: ["ABC", "DEF"],
      ineligibleSentencesExpirationDate: ["2023-06-01", "2022-01-01"],
    },
  },
  ineligibleCriteria: {},
  formInformation: {
    drugCharge: true,
    statue14: false,
    statue30: true,
    statue37: false,
  },
  isEligible: true,
  isAlmostEligible: false,
};

test("record parses as expected", () => {
  expect(usPaAdminSupervisionSchema.parse(rawRecord)).toMatchSnapshot();
});

test("parses null reason fields", () => {
  const testRecord: UsPaAdminSupervisionReferralRecordRaw = {
    ...rawRecord,
    eligibleCriteria: {
      ...rawRecord.eligibleCriteria,
      usPaNoHighSanctionsInPastYear: null,
      usPaNotServingIneligibleOffenseForAdminSupervision: null,
    },
  };
  expect(usPaAdminSupervisionSchema.parse(testRecord)).toMatchSnapshot();
});

test("parses empty ineligible offenses array", () => {
  const testRecord: UsPaAdminSupervisionReferralRecordRaw = {
    ...rawRecord,
    eligibleCriteria: {
      ...rawRecord.eligibleCriteria,
      usPaNotServingIneligibleOffenseForAdminSupervision: {
        ineligibleOffenses: [],
        ineligibleSentencesExpirationDate: [],
      },
    },
    formInformation: {
      drugCharge: true,
      statue14: false,
      statue30: true,
      statue37: false,
    },
  };
  expect(usPaAdminSupervisionSchema.parse(testRecord)).toMatchSnapshot();
});
