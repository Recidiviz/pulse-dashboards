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
import { parseISO } from "date-fns";
import { Required as RequireKeys } from "utility-types";

import { ClientRecord } from "../../../../FirestoreStore";
import { dateToTimestamp } from "../../../utils";
import { UsNdEarlyTerminationReferralRecord } from "../UsNdEarlyTerminationOpportunity";

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
    supervisionType: "PROBATION",
    supervisionLevel: "MEDIUM",
    supervisionLevelStart: dateToTimestamp("2019-12-20"),
    address: "123 Bedrock Lane",
    phoneNumber: "5555555678",
    expirationDate: dateToTimestamp("2024-12-31"),
    allEligibleOpportunities: ["earlyTermination"],
    supervisionStartDate: "2020-02-22",
    currentBalance: 0,
    lastPaymentAmount: 125.75,
    lastPaymentDate: dateToTimestamp("2022-01-03"),
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
  };
export const usNdEarlyTerminationAlmostEligibleClientRecord: RequireKeys<ClientRecord> =
  {
    ...usNdEarlyTerminationEligibleClientRecord,
    recordId: "us_nd_111",
    personExternalId: "111",
    displayId: "d111",
    pseudonymizedId: "p111",
  };

export const usNdEarlyTerminationReferralRecord: UsNdEarlyTerminationReferralRecord =
  {
    stateCode: "US_ND",
    externalId: "110",
    formInformation: {
      clientName: "Jamie Jones",
      convictionCounty: "NORTH_CENTRAL",
      judgeName: "JUDGE 1",
      priorCourtDate: parseISO("2020-01-03"),
      sentenceLengthMonths: 36,
      crimeNames: ["CHARGE 1", "CHARGE 2"],
      probationExpirationDate: parseISO("2022-12-02"),
      probationOfficerFullName: "Karl Fog",
      criminalNumber: "12345",
      judicialDistrictCode: "BISMARCK",
      statesAttorneyEmailAddress: "state.attny.837@state.gov",
      statesAttorneyMailingAddress: "9234 Maine St., Ohiotown, ND",
      statesAttorneyPhoneNumber: "888-867-5309",
    },
    eligibleCriteria: {
      supervisionPastEarlyDischargeDate: {
        eligibleDate: parseISO("2022-01-03"),
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
  };

export const usNdEarlyTerminationAlmostEligibleReferralRecord: UsNdEarlyTerminationReferralRecord =
  {
    ...usNdEarlyTerminationReferralRecord,
    externalId: "111",
    ineligibleCriteria: {
      supervisionPastEarlyDischargeDate: {
        eligibleDate: parseISO("2024-01-03"),
      },
    },
  };
