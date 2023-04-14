// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import {
  transformReferral,
  UsMeSCCPReferralRecord,
} from "../UsMeSCCPReferralRecord";

test("transform record", () => {
  const rawRecord: Record<keyof UsMeSCCPReferralRecord, any> = {
    stateCode: "US_ME",
    externalId: "001",
    eligibleCriteria: {
      usMeMinimumOrCommunityCustody: { custodyLevel: "MINIMUM" },
      usMeServedXPortionOfSentence: {
        eligibleDate: "2022-11-03",
        xPortionServed: "1/2",
      },
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: "2022-08-07",
      },
      usMeNoDetainersWarrantsOrOther: null,
      usMeNoClassAOrBViolationFor90Days: null,
    },
    ineligibleCriteria: {},
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: "2022-06-28",
        },
      ],
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});

test("transform almost-eligible record", () => {
  const rawRecord: Record<keyof UsMeSCCPReferralRecord, any> = {
    stateCode: "US_ME",
    externalId: "002",
    eligibleCriteria: {
      usMeMinimumOrCommunityCustody: { custodyLevel: "MINIMUM" },
      usMeNoDetainersWarrantsOrOther: null,
    },
    ineligibleCriteria: {
      usMeServedXPortionOfSentence: {
        eligibleDate: "2023-01-03",
        xPortionServed: "2/3",
      },
      usMeXMonthsRemainingOnSentence: {
        eligibleDate: "2022-12-07",
      },
      usMeNoClassAOrBViolationFor90Days: {
        eligibleDate: "2022-11-15",
        highestClassViol: "A",
        violType: "foo",
      },
    },
    caseNotes: {
      foo: [
        {
          noteTitle: "A title",
          noteBody: "A body",
          eventDate: "2022-06-28",
        },
      ],
    },
  };

  expect(transformReferral(rawRecord)).toMatchSnapshot();
});
