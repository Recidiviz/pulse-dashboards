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

import { Required as RequireKeys } from "utility-types";

import { ClientRecord } from "~datatypes";

import { UsNdEarlyTerminationReferralRecordRaw } from "../UsNdEarlyTerminationOpportunity";

export const usNdEarlyTerminationEligibleClientRecord: RequireKeys<ClientRecord> =
  {
    personType: "CLIENT",
    recordId: "us_nd_110",
    personName: {
      givenNames: "JAMIE",
      surname: "JONES",
    },
    personExternalId: "110",
    displayId: "d110",
    pseudonymizedId: "p110",
    district: "DISTRICT A",
    stateCode: "US_ND",
    officerId: "OFFICER3",
    caseType: "GENERAL",
    caseTypeRawText: "GENERAL",
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: new Date("2019-12-20"),
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: new Date("2024-12-31"),
    allEligibleOpportunities: ["earlyTermination"],
    supervisionStartDate: new Date("2020-02-22"),
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: new Date("2022-01-03"),
    specialConditions: [],
    boardConditions: [],
    currentEmployers: [
      {
        name: "Tire store",
        address: "456 Bedrock Lane",
      },
    ],
    milestones: [
      {
        text: "8 months without a violation",
        type: "MONTHS_WITHOUT_VIOLATION",
      },
      {
        text: "15 months on supervision",
        type: "MONTHS_ON_SUPERVISION",
      },
    ],
    emailAddress: "jamie@example.com",
    activeSentences: [
      {
        sentenceId: 1,
        offenseType: "CRIME",
        isSexOffense: false,
        countyCode: "COUNTY",
        dateImposed: new Date("2020-01-03"),
      },
    ],
    metadata: {},
    hasAnyInStateSentences: true,
    hasAnyOutOfStateSentences: false,
    custodialAuthority: "OTHER_STATE",
  };
export const usNdEarlyTerminationAlmostEligibleClientRecord: RequireKeys<ClientRecord> =
  {
    ...usNdEarlyTerminationEligibleClientRecord,
    recordId: "us_nd_111",
    personExternalId: "111",
    displayId: "d111",
    pseudonymizedId: "p111",
  };

export const usNdEarlyTerminationReferralRecord: UsNdEarlyTerminationReferralRecordRaw =
  {
    stateCode: "US_ND",
    externalId: "110",
    formInformation: {
      clientName: "Jamie Jones",
      convictionCounty: "NORTH_CENTRAL",
      judgeName: "JUDGE 1",
      priorCourtDate: "2020-01-03",
      sentenceLengthMonths: "36",
      crimeNames: ["CHARGE 1", "CHARGE 2"],
      probationStartDate: "2020-12-02",
      probationExpirationDate: "2022-12-02",
      probationOfficerFullName: "Karl Fog",
      criminalNumber: "12345",
      judicialDistrictCode: "BISMARCK",
      statesAttorneyEmailAddress: "state.attny.837@state.gov",
      statesAttorneyMailingAddress: "9234 Maine St., Ohiotown, ND",
      statesAttorneyPhoneNumber: "888-867-5309",
    },
    eligibleCriteria: {
      supervisionPastEarlyDischargeDate: {
        eligibleDate: "2022-01-03",
      },
      usNdNotInActiveRevocationStatus: {
        revocationDate: null,
      },
      usNdImpliedValidEarlyTerminationSupervisionLevel: {
        supervisionLevel: "MEDIUM",
      },
      usNdImpliedValidEarlyTerminationSentenceType: {
        supervisionType: "PROBATION",
      },
    },
    ineligibleCriteria: {},
    metadata: {
      multipleSentences: true,
      outOfState: false,
      ICOut: false,
    },
    caseNotes: {},
    isEligible: true,
    isAlmostEligible: false,
  };

export const usNdEarlyTerminationAlmostEligibleReferralRecord: UsNdEarlyTerminationReferralRecordRaw =
  {
    ...usNdEarlyTerminationReferralRecord,
    externalId: "111",
    ineligibleCriteria: {
      supervisionPastEarlyDischargeDate: {
        eligibleDate: "2024-01-03",
      },
    },
    isEligible: false,
    isAlmostEligible: true,
  };
