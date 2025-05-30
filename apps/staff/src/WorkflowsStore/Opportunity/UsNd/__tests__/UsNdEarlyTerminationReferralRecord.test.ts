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

import { getParseErrorFormatted } from "../../../../testUtils";
import { usNdEarlyTerminationSchema } from "..";

const rawRecord = {
  stateCode: "US_OZ",
  externalId: "abc123",
  formInformation: {
    clientName: "Firstname Lastname",
    convictionCounty: "Bloom",
    judicialDistrictCode: "XX",
    criminalNumber: "123456",
    judgeName: "Judgename",
    priorCourtDate: "2022-01-01",
    sentenceLengthMonths: "24",
    crimeNames: ["Crime1", "crime2"],
    probationStartDate: "2021-05-01",
    probationExpirationDate: "2024-05-01",
    probationOfficerFullName: "Fakename Officername",
  },
  eligibleCriteria: {
    supervisionPastEarlyDischargeDate: { eligibleDate: "2022-01-03" },
    usNdImpliedValidEarlyTerminationSupervisionLevel: {
      supervisionLevel: "MEDIUM",
    },
    usNdImpliedValidEarlyTerminationSentenceType: {
      supervisionType: "PROBATION",
    },
    usNdNotInActiveRevocationStatus: { revocationDate: null },
  },
  ineligibleCriteria: {},
  metadata: {
    multipleSentences: false,
    outOfState: false,
    ICOut: false,
  },
  isEligible: true,
  isAlmostEligible: false,
};
test("transform record", () => {
  expect(usNdEarlyTerminationSchema.parse(rawRecord)).toMatchSnapshot();
});

test("eligibleCriteria must not be empty", () => {
  const testRecord = {
    ...rawRecord,
    eligibleCriteria: {
      supervisionPastEarlyDischargeDate: {},
      usNdImpliedValidEarlyTerminationSupervisionLevel: {},
      usNdImpliedValidEarlyTerminationSentenceType: {},
      usNdNotInActiveRevocationStatus: {},
    },
  };

  expect(
    getParseErrorFormatted(usNdEarlyTerminationSchema.safeParse(testRecord)),
  ).toMatchSnapshot();
});

test("criteria are required", () => {
  const testRecord = {
    ...rawRecord,
    eligibleCriteria: {},
  };

  expect(
    getParseErrorFormatted(usNdEarlyTerminationSchema.safeParse(testRecord)),
  ).toMatchSnapshot();
});

test("must not have revocation date", () => {
  const testRecord = {
    ...rawRecord,
    eligibleCriteria: {
      ...rawRecord.eligibleCriteria,
      usNdNotInActiveRevocationStatus: { revocationDate: "2021-11-13" },
    },
  };

  expect(
    getParseErrorFormatted(usNdEarlyTerminationSchema.safeParse(testRecord)),
  ).toMatchSnapshot();
});

test("ineligiibleCriteria", () => {
  const testRecord = {
    ...rawRecord,
    ineligibleCriteria: {
      supervisionPastEarlyDischargeDate: {
        eligibleDate: "2024-01-03",
      },
    },
  };

  expect(usNdEarlyTerminationSchema.safeParse(testRecord)).toMatchSnapshot();
});
