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

import { UsMeSCCPReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsMeSCCPReferralRecord";
import { FixtureData } from "../workflowsFixtures";
import { externalIdFunc } from "./utils";

export const usMeSCCPFixture: FixtureData<UsMeSCCPReferralRecordRaw> = {
  data: [
    {
      stateCode: "US_ME",
      externalId: "RES001",
      eligibleCriteria: {
        usMeCustodyLevelIsMinimumOrCommunity: {
          custodyLevel: "COMMUNITY",
        },
        usMeNoClassAOrBViolationFor90Days: null,
        usMeNoDetainersWarrantsOrOther: null,
        usMeServedXPortionOfSentence: {
          eligibleDate: "2022-08-10",
          xPortionServed: "2/3",
        },
      },
      ineligibleCriteria: {
        usMeXMonthsRemainingOnSentence: {
          eligibleDate: "2023-04-22",
        },
      },
      caseNotes: {
        Education: [
          {
            eventDate: "2022-06-02",
            noteTitle: "Graduated",
            noteBody: "Completed coding course",
          },
        ],
      },
    },
    {
      stateCode: "US_ME",
      externalId: "RES002",
      eligibleCriteria: {
        usMeCustodyLevelIsMinimumOrCommunity: {
          custodyLevel: "MINIMUM",
        },
        usMeNoClassAOrBViolationFor90Days: null,
        usMeNoDetainersWarrantsOrOther: null,
        usMeServedXPortionOfSentence: {
          eligibleDate: "2021-06-12",
          xPortionServed: "1/2",
        },
        usMeXMonthsRemainingOnSentence: {
          eligibleDate: "2022-05-27",
        },
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Employment Training": [
          {
            eventDate: "2021-12-02",
            noteTitle: "Graduated",
            noteBody: "Completed course",
          },
        ],
      },
    },
    {
      stateCode: "US_ME",
      externalId: "RES003",
      eligibleCriteria: {
        usMeCustodyLevelIsMinimumOrCommunity: {
          custodyLevel: "MINIMUM",
        },
        usMeNoDetainersWarrantsOrOther: null,
        usMeServedXPortionOfSentence: {
          eligibleDate: "2022-08-10",
          xPortionServed: "2/3",
        },
        usMeXMonthsRemainingOnSentence: {
          eligibleDate: "2022-04-27",
        },
      },
      ineligibleCriteria: {
        usMeNoClassAOrBViolationFor90Days: {
          eligibleDate: "2023-02-22",
          highestClassViol: "B",
          violType: "More than 1",
        },
      },
      caseNotes: {
        Education: [
          {
            eventDate: "2022-06-02",
            noteTitle: "Graduated",
            noteBody: "Completed coding course",
          },
        ],
      },
    },
  ],
  idFunc: externalIdFunc,
};
