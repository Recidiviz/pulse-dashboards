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

import { UsTnCustodyLevelDowngradeReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTn";
import { fixtureWithIdKey } from "./utils";

export const usTnCustodyLevelDowngradeFixture =
  fixtureWithIdKey<UsTnCustodyLevelDowngradeReferralRecordRaw>("externalId", [
    {
      stateCode: "US_TN",
      externalId: "RES001",
      eligibleCriteria: {
        custodyLevelHigherThanRecommended: {
          custodyLevel: "HIGH",
          recommendedCustodyLevel: "MEDIUM",
        },
        custodyLevelIsNotMax: null,
        usTnLatestCafAssessmentNotOverride: {
          overrideReason: null,
        },
        usTnIneligibleForAnnualReclassification: {
          ineligibleCriteria: ["q1"],
        },
      },
      ineligibleCriteria: {},
      formInformation: {
        activeRecommendations: [],
        classificationType: "SPECIAL",
        hasIncompatibles: false,
        incompatibleArray: [],
        statusAtHearingSeg: "GEN",
        latestPreaScreeningResults: {
          latestPreaScreeningDate: "2022-02-23",
          aggressorFindingLevelChanged: true,
          victimFindingLevelChanged: false,
        },
        q1Score: 0,
        q2Score: 0,
        q3Score: 4,
        // q3Note: "Contra in penal facility",
        q4Score: 0,
        q5Score: -2,
        q6Score: -2,
        q7Score: 5,
        q7Notes: {
          noteBody: "Class C Incident Details: Some details",
          eventDate: "2019-02-01",
        },
        q8Score: 0,
        q9Score: 0,
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_TN",
      externalId: "RES002",
      eligibleCriteria: {
        custodyLevelHigherThanRecommended: {
          custodyLevel: "HIGH",
          recommendedCustodyLevel: "MINIMUM",
        },
        custodyLevelIsNotMax: null,
        usTnLatestCafAssessmentNotOverride: {
          overrideReason: null,
        },
        usTnIneligibleForAnnualReclassification: {
          ineligibleCriteria: [],
        },
      },
      ineligibleCriteria: {},
      formInformation: {
        activeRecommendations: [],
        classificationType: "SPECIAL",
        hasIncompatibles: false,
        incompatibleArray: [],
        statusAtHearingSeg: "GEN",
        currentOffenses: ["ROBBERY-ARMED WITH DEADLY WEAPON"],
        lastCafDate: "2022-08-22",
        latestPreaScreeningResults: {
          latestPreaScreeningDate: "2022-02-23",
          aggressorFindingLevelChanged: true,
          victimFindingLevelChanged: false,
        },
        lastCafTotal: "8",
        q1Score: 5,
        q2Score: 3,
        q3Score: 4,
        q4Score: 4,
        q5Score: 7,
        q6Score: 4,
        q7Score: 7,
        q8Score: 5,
        q9Score: 4,
      },
      isEligible: true,
      isAlmostEligible: false,
    },
  ]);
