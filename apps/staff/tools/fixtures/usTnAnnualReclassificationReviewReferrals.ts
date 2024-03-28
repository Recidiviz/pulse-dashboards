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
import { UsTnAnnualReclassificationReviewReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTn/UsTnAnnualReclassificationReviewOpportunity/UsTnAnnualReclassificationReviewReferralRecord";
import { externalIdFunc, FirestoreFixture } from "./utils";

const data: UsTnAnnualReclassificationReviewReferralRecordRaw[] = [
  {
    stateCode: "US_TN",
    externalId: "RES003",
    formReclassificationDueDate: "2024-01-01",
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
      foo: [
        {
          eventDate: "2022-04-06",
          noteBody: "Body1",
          noteTitle: "Title1",
        },
        {
          eventDate: "2022-06-06",
          noteBody: "Body2",
          noteTitle: "Title2",
        },
      ],
      "ba bar": [
        {
          eventDate: "2022-09-06",
          noteBody: "Body3",
          noteTitle: "Title3",
        },
      ],
    },
    formInformation: {
      q1Score: 0,
      q2Score: 0,
      q3Score: 4,
      q4Score: 0,
      q5Score: -2,
      q6Score: -2,
      q7Score: 5,
      q7Notes: [
        {
          noteBody: "Class C Incident Details: Some details",
          eventDate: "2019-02-01",
        },
        {
          noteBody: "Class A Incident Details: Some other details",
          eventDate: "2020-02-01",
        },
      ],
      q8Score: 0,
      q9Score: 0,
    },
  },
  {
    stateCode: "US_TN",
    externalId: "RES004",
    formReclassificationDueDate: "2024-02-01",
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
      foo: [
        {
          eventDate: "2022-04-06",
          noteBody: "Body1",
          noteTitle: "Title1",
        },
        {
          eventDate: "2022-06-06",
          noteBody: "Body2",
          noteTitle: "Title2",
        },
      ],
      "ba bar": [
        {
          eventDate: "2022-09-06",
          noteBody: "Body3",
          noteTitle: "Title3",
        },
      ],
    },
    formInformation: {
      currentOffenses: ["ROBBERY-ARMED WITH DEADLY WEAPON"],
      lastCafDate: "2022-08-22",
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
      q6Notes: [{ eventDate: "2022-08-22", noteBody: "Some note" }],
      q7Notes: [{ eventDate: "2022-08-22", noteBody: "Some note" }],
      q8Notes: [
        {
          detainerReceivedDate: "2022-08-22",
          detainerFelonyFlag: "X",
          detainerMisdemeanorFlag: "X",
        },
      ],
    },
  },
];

export const usTnAnnualReclassificationReviewFixture: FirestoreFixture<UsTnAnnualReclassificationReviewReferralRecordRaw> =
  {
    data,
    idFunc: externalIdFunc,
  };
