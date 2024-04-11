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

import { ClientRecord } from "../../../../FirestoreStore";
import { dateToTimestamp } from "../../../utils";
import { UsPaAdminSupervisionReferralRecord } from "../UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";

export const usPaAdminSupervisionReferralRecord: UsPaAdminSupervisionReferralRecord =
  {
    stateCode: "US_PA",
    externalId: "123",
    eligibleCriteria: {
      usPaFulfilledRequirements: {
        eligibleDate: new Date("2022-01-03"),
      },
      usPaNoHighSanctionsInPastYear: {
        latestHighSanctionDate: new Date("2021-01-01"),
      },
      usPaNotServingIneligibleOffenseForAdminSupervision: {
        ineligibleOffenses: ["EXAMPLE"],
        ineligibleSentencesExpirationDate: [new Date("2021-06-01")],
      },
    },
    ineligibleCriteria: {},
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
  supervisionLevelStart: dateToTimestamp("2019-12-20"),
  address: "123 Bedrock Lane",
  phoneNumber: "5555555678",
  expirationDate: dateToTimestamp("2024-12-31"),
  allEligibleOpportunities: ["usPaAdminSupervision"],
  personType: "CLIENT",
};
