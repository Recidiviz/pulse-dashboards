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

import { parseISO } from "date-fns";

import { transformReferral } from "../EarlyTerminationReferralRecord";

test("transform record", () => {
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
      sentenceLengthYears: "2",
      crimeNames: ["Crime1", "crime2"],
      probationExpirationDate: "2024-05-01",
      probationOfficerFullName: "Fakename Officername",
    },
    criteria: {
      supervisionEarlyDischargeDateWithin30Days: { eligibleDate: "2022-01-03" },
      usNdImpliedValidEarlyTerminationSupervisionLevel: {
        supervisionLevel: "MEDIUM",
      },
      usNdImpliedValidEarlyTerminationSentenceType: {
        supervisionType: "PROBATION",
      },
      usNdNotInActiveRevocationStatus: { revocationDate: undefined },
    },
    metadata: {
      multipleSentences: false,
      outOfState: false,
      ICOut: false,
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("revocation date may be defined", () => {
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
      sentenceLengthYears: "2",
      crimeNames: ["Crime1", "crime2"],
      probationExpirationDate: "2024-05-01",
      probationOfficerFullName: "Fakename Officername",
    },
    criteria: {
      supervisionEarlyDischargeDateWithin30Days: { eligibleDate: "2022-01-03" },
      usNdImpliedValidEarlyTerminationSupervisionLevel: {
        supervisionLevel: "MEDIUM",
      },
      usNdImpliedValidEarlyTerminationSentenceType: {
        supervisionType: "PROBATION",
      },
      usNdNotInActiveRevocationStatus: { revocationDate: "2021-11-13" },
    },
    metadata: {
      multipleSentences: false,
      outOfState: false,
      ICOut: false,
    },
  };

  expect(
    transformReferral(rawRecord)?.criteria.usNdNotInActiveRevocationStatus
      ?.revocationDate
  ).toEqual(parseISO("2021-11-13"));
});

test("fallback to legacy format", () => {
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
      sentenceLengthYears: "2",
      crimeNames: ["Crime1", "crime2"],
      probationExpirationDate: "2024-05-01",
      probationOfficerFullName: "Fakename Officername",
    },
    reasons: [
      {
        criteriaName: "SUPERVISION_EARLY_DISCHARGE_DATE_WITHIN_30_DAYS",
        reason: {
          eligibleDate: "2022-01-03",
        },
      },
      {
        criteriaName: "US_ND_NOT_IN_ACTIVE_REVOCATION_STATUS",
        reason: {
          revocationDate: undefined,
        },
      },
      {
        criteriaName: "US_ND_IMPLIED_VALID_EARLY_TERMINATION_SUPERVISION_LEVEL",
        reason: {
          supervisionLevel: "MEDIUM",
        },
      },
      {
        criteriaName: "US_ND_IMPLIED_VALID_EARLY_TERMINATION_SENTENCE_TYPE",
        reason: {
          supervisionType: "PROBATION",
        },
      },
    ],
    metadata: {
      multipleSentences: false,
      outOfState: false,
      ICOut: false,
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});
