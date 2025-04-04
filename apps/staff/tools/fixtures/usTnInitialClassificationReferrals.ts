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

import { UsTnInitialClassificationReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTn/UsTnInitialClassificationOpportunity/UsTnInitialClassificationReferralRecord";
import { externalIdFunc, FirestoreFixture } from "./utils";

const data: UsTnInitialClassificationReferralRecordRaw[] = [
  {
    stateCode: "US_TN",
    externalId: "RES003",
    formReclassificationDueDate: relativeFixtureDate({ days: 2 }),
    eligibleCriteria: {
      usTnAtLeast12MonthsSinceLatestAssessment: null,
      custodyLevelIsNotMax: null,
      custodyLevelComparedToRecommended: {
        custodyLevel: "MINIMUM",
        recommendedCustodyLevel: "MINIMUM",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      "PRIOR RECORD OFFENSES": [
        {
          eventDate: relativeFixtureDate({ years: -2, months: -2, days: -2 }),
          noteTitle: "AGGRAVATED ASSAULT",
        },
        {
          eventDate: relativeFixtureDate({ years: -2, months: -1, days: -10 }),
          noteTitle: "CRIMINAL IMPERSONATION",
        },
      ],
      "TN, ISC, DIVERSION SENTENCES": [
        {
          eventDate: relativeFixtureDate({ years: -3, days: -6 }),
          noteBody: "Expires: 2028-02-02",
          noteTitle: "POSS FIREARM W/PRIOR VIOL/DEAD WPN CONV",
        },
      ],
    },
    formInformation: {
      currentOffenses: ["POSS FIREARM W/PRIOR VIOL/DEAD WPN CONV"],
      hasIncompatibles: false,
      lastCafDate: relativeFixtureDate({ days: -363 }),
      lastCafTotal: "15",
      latestClassificationDate: relativeFixtureDate({ days: -355 }),
      latestPreaScreeningResults: {
        aggressorFindingLevelChanged: false,
        latestPreaScreeningDate: relativeFixtureDate({ days: -150 }),
        victimFindingLevelChanged: false,
      },
      latestVantageCompletedDate: relativeFixtureDate({ days: -300 }),
      latestVantageRiskLevel: "LOW",
      levelOfCare: "LVL2",
      sentenceEffectiveDate: relativeFixtureDate({ years: -3, days: -100 }),
      sentenceReleaseEligibilityDate: relativeFixtureDate({ months: 2 }),
      sentenceExpirationDate: relativeFixtureDate({ years: 1, days: 100 }),
      statusAtHearingSeg: "GEN",
      q1Score: 0,
      q2Score: 0,
      q3Score: 4,
      q4Score: 0,
      q5Score: -2,
      q6Score: -2,
      q7Score: 5,
      q7Notes: {
        noteBody: "Class B Incident",
        eventDate: relativeFixtureDate({ years: -1, months: -2, days: -20 }),
      },
      q8Score: 0,
      q9Score: 0,
    },
    isEligible: true,
    isAlmostEligible: false,
  },
  {
    stateCode: "US_TN",
    externalId: "RES004",
    formReclassificationDueDate: relativeFixtureDate({ days: 6 }),
    eligibleCriteria: {
      usTnAtLeast12MonthsSinceLatestAssessment: null,
      custodyLevelIsNotMax: null,
      custodyLevelComparedToRecommended: {
        custodyLevel: "CLOSE",
        recommendedCustodyLevel: "MEDIUM",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      "PRIOR RECORD OFFENSES": [
        {
          eventDate: relativeFixtureDate({ years: -2, days: -22 }),
          noteTitle: "EVADING ARREST",
        },
        {
          eventDate: relativeFixtureDate({ years: -3, days: -33 }),
          noteTitle: "DOMESTIC VIOLENCE",
        },
      ],
      "TN, ISC, DIVERSION SENTENCES": [
        {
          eventDate: relativeFixtureDate({ years: -4, days: -444 }),
          noteBody: "Expires: 2029-04-02",
          noteTitle: "AGGRAVATED ASSAULT",
        },
      ],
    },
    formInformation: {
      classificationType: "ANNUAL",
      currentOffenses: ["ROBBERY-ARMED WITH DEADLY WEAPON"],
      hasIncompatibles: false,
      lastCafDate: relativeFixtureDate({ days: -359 }),
      lastCafTotal: "15",
      latestClassificationDate: relativeFixtureDate({ days: -350 }),
      latestPreaScreeningResults: {
        aggressorFindingLevelChanged: false,
        latestPreaScreeningDate: relativeFixtureDate({ days: -150 }),
        victimFindingLevelChanged: false,
      },
      latestVantageCompletedDate: relativeFixtureDate({ days: -300 }),
      latestVantageRiskLevel: "LOW",
      levelOfCare: "LVL2",
      sentenceEffectiveDate: relativeFixtureDate({ years: -2, days: -200 }),
      sentenceReleaseEligibilityDate: relativeFixtureDate({ days: 100 }),
      sentenceExpirationDate: relativeFixtureDate({ years: 1, days: 200 }),
      statusAtHearingSeg: "GEN",
      q1Score: 0,
      q2Score: 0,
      q3Score: 4,
      q4Score: 4,
      q5Score: -2,
      q6Score: -1,
      q7Score: 2,
      q8Score: 3,
      q9Score: 2,
      q6Notes: [
        {
          eventDate: relativeFixtureDate({ months: -4, days: 13 }),
          noteBody: "Class C Incident",
        },
      ],
      q7Notes: [
        {
          eventDate: relativeFixtureDate({ months: -4, days: 13 }),
          noteBody: "Class C Incident",
        },
      ],
      q8Notes: [
        {
          description: "VANDALISM",
          detainerFelonyFlag: null,
          detainerMisdemeanorFlag: "X",
          detainerReceivedDate: relativeFixtureDate({ days: -15 }),
        },
      ],
    },
    isEligible: true,
    isAlmostEligible: false,
  },
];

export const usTnInitialClassificationFixture: FirestoreFixture<UsTnInitialClassificationReferralRecordRaw> =
  {
    data,
    idFunc: externalIdFunc,
  };
