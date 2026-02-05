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

import { relativeFixtureDate } from "~datatypes";

import { UsTnCustodyLevelDowngradeReferralRecordRaw } from "../../src/WorkflowsStore";
import { fixtureWithIdKey } from "./utils";

export const usTnCustodyLevelDowngradeFixture =
  fixtureWithIdKey<UsTnCustodyLevelDowngradeReferralRecordRaw>("externalId", [
    {
      stateCode: "US_TN",
      externalId: "RES001",
      eligibleCriteria: {
        custodyLevelHigherThanRecommended: {
          custodyLevel: "CLOSE",
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
        hasIncompatibles: false,
        incompatibleArray: [],
        lastCafDate: relativeFixtureDate({ months: -11, days: -11 }),
        lastCafTotal: "18",
        latestVantageCompletedDate: relativeFixtureDate({ days: -300 }),
        latestVantageRiskLevel: "LOW",
        levelOfCare: "LVL1",
        sentenceReleaseEligibilityDate: relativeFixtureDate({ years: 1 }),
        sentenceExpirationDate: relativeFixtureDate({ years: 3, days: 300 }),
        statusAtHearingSeg: "GEN",
        q1Score: 0,
        q2Score: 0,
        q3Score: 4,
        q4Score: 0,
        q5Score: 5,
        q6Score: -2,
        q7Score: 5,
        q7Notes: {
          noteBody: "Class B Incident",
          eventDate: relativeFixtureDate({ months: -13, days: -13 }),
        },
        q8Score: 3,
        q9Score: 0,
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_TN",
      externalId: "RES002",
      caseNotes: {
        "PRIOR RECORD OFFENSES": [
          {
            eventDate: relativeFixtureDate({ years: -5, months: -8 }),
            noteTitle: "THEFT OF PROPERTY",
          },
          {
            eventDate: relativeFixtureDate({ years: -5, months: -8 }),
            noteTitle: "CRIMINAL IMPERSONATION",
          },
          {
            eventDate: relativeFixtureDate({ years: -7, days: -20 }),
            noteTitle: "AGGRAVATED BURGLARY",
          },
        ],
      },
      eligibleCriteria: {
        custodyLevelHigherThanRecommended: {
          custodyLevel: "MEDIUM",
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
        currentOffenses: ["THEFT OF PROPERTY"],
        hasIncompatibles: false,
        incompatibleArray: [],
        lastCafDate: relativeFixtureDate({ years: -1, months: -5 }),
        lastCafTotal: "8",
        latestVantageCompletedDate: relativeFixtureDate({ days: -300 }),
        latestVantageRiskLevel: "LOW",
        levelOfCare: "LVL1",
        sentenceReleaseEligibilityDate: relativeFixtureDate({ days: 144 }),
        sentenceExpirationDate: relativeFixtureDate({ years: 1, days: 100 }),
        statusAtHearingSeg: "GEN",
        q1Score: 0,
        q2Score: 0,
        q3Score: 1,
        q4Score: 0,
        q5Score: -2,
        q6Score: -4,
        q7Score: 0,
        q8Score: 0,
        q9Score: 2,
      },
      isEligible: true,
      isAlmostEligible: false,
    },
  ]);
