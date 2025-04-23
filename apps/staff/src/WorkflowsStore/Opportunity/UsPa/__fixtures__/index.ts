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

import { ClientRecord } from "~datatypes";

import { UsPaAdminSupervisionReferralRecordRaw } from "../UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";

export const usPaAdminSupervisionReferralRecord: UsPaAdminSupervisionReferralRecordRaw =
  {
    stateCode: "US_PA",
    externalId: "123",
    eligibleCriteria: {
      usPaNoHighSanctionsInPastYear: {},
      usPaNotServingIneligibleOffenseForAdminSupervision: {
        ineligibleOffenses: ["EXAMPLE"],
        ineligibleSentencesExpirationDate: ["2021-06-01"],
      },
    },
    ineligibleCriteria: {},
    caseNotes: {},
    formInformation: {
      drugConviction: true,
      statute14: false,
      statute30: true,
      statute37: false,
    },
    isEligible: true,
    isAlmostEligible: false,
  };

export const usPaAdminSupervisionEligibleClientRecord: ClientRecord = {
  recordId: "us_pa_001",
  personName: {
    givenNames: "BETTY",
    surname: "RUBBLE",
  },
  personExternalId: "001",
  displayId: "d001",
  pseudonymizedId: "p001",
  stateCode: "US_PA",
  officerId: "OFFICER3",
  supervisionType: "PROBATION",
  supervisionLevel: "MEDIUM",
  supervisionLevelStart: new Date("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: new Date("2024-12-31"),
  allEligibleOpportunities: ["usPaAdminSupervision"],
  personType: "CLIENT",
};
