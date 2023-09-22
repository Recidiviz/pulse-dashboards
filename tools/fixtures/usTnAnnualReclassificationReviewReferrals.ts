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
import { FixtureData } from "../workflowsFixtures";
import { externalIdFunc } from "./utils";

const data: UsTnAnnualReclassificationReviewReferralRecordRaw[] = [
  {
    stateCode: "US_TN",
    externalId: "RES003",
    eligibleCriteria: {
      usTnAtLeast12MonthsSinceLatestAssessment: {
        mostRecentAssessmentDate: "2020-01-01",
      },
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
  },
  {
    stateCode: "US_TN",
    externalId: "RES004",
    eligibleCriteria: {
      usTnAtLeast12MonthsSinceLatestAssessment: {
        mostRecentAssessmentDate: "2021-01-01",
      },
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
  },
];

export const usTnAnnualReclassificationReviewFixture: FixtureData<UsTnAnnualReclassificationReviewReferralRecordRaw> =
  {
    data,
    idFunc: externalIdFunc,
  };
