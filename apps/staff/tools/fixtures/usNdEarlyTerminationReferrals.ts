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

import { UsNdEarlyTerminationReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsNd";
import { externalIdFunc, FirestoreFixture } from "./utils";

const data: UsNdEarlyTerminationReferralRecordRaw[] = [
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
      probationExpirationDate: "2022-12-02",
      probationOfficerFullName: "Karl Fog",
      criminalNumber: "12345",
      judicialDistrictCode: "BISMARCK",
      statesAttorneyEmailAddress: "state.attny.837@state.gov",
      statesAttorneyMailingAddress: "9234 Maine St., Ohiotown, ND",
      statesAttorneyPhoneNumber: "888-867-5309",
      statesAttorneyName: "Sally Lawyer",
    },
    eligibleCriteria: {
      supervisionPastEarlyDischargeDate: {
        eligibleDate: "2023-04-03",
      },
      usNdImpliedValidEarlyTerminationSentenceType: {
        supervisionType: "SUSPENDED",
      },
      usNdImpliedValidEarlyTerminationSupervisionLevel: {
        supervisionLevel: "MINIMUM",
      },
      usNdNotInActiveRevocationStatus: {
        revocationDate: null,
      },
    },
    ineligibleCriteria: {},
    metadata: {
      multipleSentences: true,
      outOfState: false,
      ICOut: false,
    },
    isEligible: true,
    isAlmostEligible: false,
  },
  {
    stateCode: "US_ND",
    externalId: "111",
    formInformation: {
      clientName: "Justin Timberlake",
      convictionCounty: "NORTH_CENTRAL",
      judgeName: "JUDGE 1",
      priorCourtDate: "2020-01-03",
      sentenceLengthMonths: "36",
      crimeNames: ["CHARGE 1", "CHARGE 2"],
      probationExpirationDate: "2022-12-02",
      probationOfficerFullName: "Karl Fog",
      criminalNumber: "12345",
      judicialDistrictCode: "BISMARCK",
      statesAttorneyEmailAddress: "state.attny.837@state.gov",
      statesAttorneyMailingAddress: "9234 Maine St., Ohiotown, ND",
      statesAttorneyPhoneNumber: "888-867-5309",
      statesAttorneyName: "Susan Attorney",
    },
    eligibleCriteria: {
      usNdImpliedValidEarlyTerminationSentenceType: {
        supervisionType: "SUSPENDED",
      },
      usNdImpliedValidEarlyTerminationSupervisionLevel: {
        supervisionLevel: "MINIMUM",
      },
      usNdNotInActiveRevocationStatus: {
        revocationDate: null,
      },
    },
    ineligibleCriteria: {
      supervisionPastEarlyDischargeDate: {
        eligibleDate: "2045-04-03",
      },
    },
    metadata: {
      multipleSentences: true,
      outOfState: false,
      ICOut: false,
    },
    isEligible: false,
    isAlmostEligible: true,
  },
];

export const usNdEarlyTerminationFixture: FirestoreFixture<UsNdEarlyTerminationReferralRecordRaw> =
  {
    data,
    idFunc: externalIdFunc,
  };
