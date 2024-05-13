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

import { EarnedDischargeReferralRecordRaw } from "../../src/WorkflowsStore";
import { externalIdFunc, FirestoreFixture } from "./utils";

export const earnedDischargeReferralsFixture: FirestoreFixture<EarnedDischargeReferralRecordRaw> =
  {
    data: [
      {
        stateCode: "US_ID",
        externalId: "001",
        eligibleStartDate: "2022-09-10",
        formInformation: {},
        eligibleCriteria: {
          negativeUaWithin90Days: null,
          noFelonyWithin24Months: null,
          usIdLsirLevelLowModerateForXDays: {
            eligibleDate: "2022-10-10",
            riskLevel: "MODERATE",
          },
          usIdParoleDualSupervisionPastEarlyDischargeDate: {
            eligibleDate: "2022-08-05",
            sentenceType: "PAROLE",
          },
        },
        ineligibleCriteria: {},
        caseNotes: {
          Treatment: [
            {
              noteTitle: "STARTED",
              noteBody: "Treatment started",
              eventDate: "2022-06-17",
            },
            {
              noteTitle: "COMPLETED",
              noteBody: "Treatment successfully completed",
              eventDate: "2022-09-22",
            },
          ],
        },
      },
      {
        stateCode: "US_ID",
        externalId: "002",
        eligibleStartDate: "2022-07-10",
        formInformation: {
          ncicCheckDate: "2022-11-10",
          chargeDescriptions: [
            "Shoplifting",
            "Public Intoxication",
            "Trespassing",
          ],
          fullTermReleaseDates: ["2023-08-11", "2023-07-30", "2023-06-10"],
          judgeNames: [
            '{"givenNames": "Starla", "surname": "Murieta"}',
            '{"givenNames": "Raymond", "surname": "Dart"}',
            '{"givenNames": "Ahmud", "surname": "Blake"}',
          ],
          countyNames: ["Duane", "Duane", "Moraga"],
          sentenceMax: ["365", "334", "60"],
          sentenceMin: ["92", "61", "15"],
          caseNumbers: ["12858", "13085", "14558"],
          dateImposed: ["2022-08-13", "2022-09-30", "2022-10-03"],
          firstAssessmentScore: "27",
          firstAssessmentDate: "2020-03-28",
          latestAssessmentScore: "19",
          latestAssessmentDate: "2022-10-24",
        },
        eligibleCriteria: {
          negativeUaWithin90Days: null,
          noFelonyWithin24Months: null,
          usIdLsirLevelLowModerateForXDays: {
            eligibleDate: "2022-08-10",
            riskLevel: "MODERATE",
          },
          usIdParoleDualSupervisionPastEarlyDischargeDate: {
            eligibleDate: "2022-06-05",
            sentenceType: "PAROLE",
          },
        },
        ineligibleCriteria: {},
        caseNotes: {
          Treatment: [
            {
              noteTitle: "STARTED",
              noteBody: "Treatment started",
              eventDate: "2022-06-17",
            },
            {
              noteTitle: "COMPLETED",
              noteBody: "Treatment successfully completed",
              eventDate: "2022-09-22",
            },
          ],
        },
      },
      {
        stateCode: "US_ID",
        externalId: "004",
        eligibleStartDate: "2022-07-10",
        formInformation: {
          ncicCheckDate: "2022-11-10",
          chargeDescriptions: [
            "Shoplifting",
            "Public Intoxication",
            "Trespassing",
          ],
          fullTermReleaseDates: ["2023-08-11", "2023-07-30", "2023-06-10"],
          judgeNames: [
            '{"givenNames": "Starla", "surname": "Murieta"}',
            '{"givenNames": "Raymond", "surname": "Dart"}',
            '{"givenNames": "Ahmud", "surname": "Blake"}',
          ],
          countyNames: ["Duane", "Duane", "Moraga"],
          sentenceMax: ["365", "334", "60"],
          sentenceMin: ["92", "61", "15"],
          caseNumbers: ["12858", "13085", "14558"],
          dateImposed: ["2022-08-13", "2022-09-30", "2022-10-03"],
          firstAssessmentScore: "27",
          firstAssessmentDate: "2020-03-28",
          latestAssessmentScore: "19",
          latestAssessmentDate: "2022-10-24",
        },
        ineligibleCriteria: {
          usIdParoleDualSupervisionPastEarlyDischargeDate: {
            eligibleDate: "2025-06-05",
            sentenceType: "PAROLE",
          },
        },
        eligibleCriteria: {
          negativeUaWithin90Days: null,
          noFelonyWithin24Months: null,
          onProbationAtLeastOneYear: {
            eligibleDate: "2022-05-11",
          },
          usIdLsirLevelLowModerateForXDays: {
            eligibleDate: "2022-08-10",
            riskLevel: "MODERATE",
          },
        },
        caseNotes: {
          Treatment: [
            {
              noteTitle: "STARTED",
              noteBody: "Treatment started",
              eventDate: "2022-06-17",
            },
            {
              noteTitle: "COMPLETED",
              noteBody: "Treatment successfully completed",
              eventDate: "2022-09-22",
            },
          ],
        },
      },
      {
        stateCode: "US_ID",
        externalId: "007",
        eligibleStartDate: "2022-07-10",
        formInformation: {
          ncicCheckDate: "2022-11-10",
          chargeDescriptions: [
            "Shoplifting",
            "Public Intoxication",
            "Trespassing",
          ],
          fullTermReleaseDates: ["2023-08-11", "2023-07-30", "2023-06-10"],
          judgeNames: [
            '{"givenNames": "Starla", "surname": "Murieta"}',
            '{"givenNames": "Raymond", "surname": "Dart"}',
            '{"givenNames": "Ahmud", "surname": "Blake"}',
          ],
          countyNames: ["Duane", "Duane", "Moraga"],
          sentenceMax: ["365", "334", "60"],
          sentenceMin: ["92", "61", "15"],
          caseNumbers: ["12858", "13085", "14558"],
          dateImposed: ["2022-08-13", "2022-09-30", "2022-10-03"],
          firstAssessmentScore: "27",
          firstAssessmentDate: "2020-03-28",
          latestAssessmentScore: "19",
          latestAssessmentDate: "2022-10-24",
        },
        ineligibleCriteria: {},
        eligibleCriteria: {
          negativeUaWithin90Days: null,
          noFelonyWithin24Months: null,
          onProbationAtLeastOneYear: {
            eligibleDate: "2022-05-11",
          },
          usIdLsirLevelLowModerateForXDays: {
            eligibleDate: "2022-08-10",
            riskLevel: "MODERATE",
          },
          usIdParoleDualSupervisionPastEarlyDischargeDate: {
            eligibleDate: "2022-06-05",
            sentenceType: "PAROLE",
          },
        },
        caseNotes: {
          Treatment: [
            {
              noteTitle: "STARTED",
              noteBody: "Treatment started",
              eventDate: "2022-06-17",
            },
            {
              noteTitle: "COMPLETED",
              noteBody: "Treatment successfully completed",
              eventDate: "2022-09-22",
            },
          ],
        },
      },
      {
        stateCode: "US_ID",
        externalId: "008",
        eligibleStartDate: "2022-07-10",
        formInformation: {
          ncicCheckDate: "2022-11-10",
          chargeDescriptions: [
            "Shoplifting",
            "Public Intoxication",
            "Trespassing",
          ],
          fullTermReleaseDates: ["2023-08-11", "2023-07-30", "2023-06-10"],
          judgeNames: [
            '{"givenNames": "Starla", "surname": "Murieta"}',
            '{"givenNames": "Raymond", "surname": "Dart"}',
            '{"givenNames": "Ahmud", "surname": "Blake"}',
          ],
          countyNames: ["Duane", "Duane", "Moraga"],
          sentenceMax: ["365", "334", "60"],
          sentenceMin: ["92", "61", "15"],
          caseNumbers: ["12858", "13085", "14558"],
          dateImposed: ["2022-08-13", "2022-09-30", "2022-10-03"],
          firstAssessmentScore: "27",
          firstAssessmentDate: "2020-03-28",
          latestAssessmentScore: "19",
          latestAssessmentDate: "2022-10-24",
        },
        ineligibleCriteria: {
          onProbationAtLeastOneYear: {
            eligibleDate: "2023-05-11",
          },
        },
        eligibleCriteria: {
          negativeUaWithin90Days: null,
          noFelonyWithin24Months: null,
          usIdLsirLevelLowModerateForXDays: {
            eligibleDate: "2022-08-10",
            riskLevel: "MODERATE",
          },
          usIdParoleDualSupervisionPastEarlyDischargeDate: {
            eligibleDate: "2022-06-05",
            sentenceType: "DUAL",
          },
        },
        caseNotes: {
          Treatment: [
            {
              noteTitle: "STARTED",
              noteBody: "Treatment started",
              eventDate: "2022-06-17",
            },
            {
              noteTitle: "COMPLETED",
              noteBody: "Treatment successfully completed",
              eventDate: "2022-09-22",
            },
          ],
        },
      },
    ],
    idFunc: externalIdFunc,
  };
