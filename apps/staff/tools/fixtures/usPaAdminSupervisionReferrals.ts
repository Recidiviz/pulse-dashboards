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

import { UsPaAdminSupervisionReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsPa/UsPaAdminSupervisionOpportunity/UsPaAdminSupervisionReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usPaAdminSupervisionReferrals =
  fixtureWithIdKey<UsPaAdminSupervisionReferralRecordRaw>("externalId", [
    {
      stateCode: "US_PA",
      externalId: "001",
      eligibleCriteria: {
        usPaNoHighSanctionsInPastYear: {},
        usPaNotServingIneligibleOffenseForAdminSupervision: null,
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
    },
    {
      stateCode: "US_PA",
      externalId: "002",
      eligibleCriteria: {
        usPaNoHighSanctionsInPastYear: {},
        usPaNotServingIneligibleOffenseForAdminSupervision: {
          ineligibleOffenses: ["EXAMPLE"],
          ineligibleSentencesExpirationDate: ["2021-01-01"],
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
    },
    {
      stateCode: "US_PA",
      externalId: "003",
      eligibleCriteria: {
        usPaNoHighSanctionsInPastYear: null,
        usPaNotServingIneligibleOffenseForAdminSupervision: null,
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
    },
  ]);
