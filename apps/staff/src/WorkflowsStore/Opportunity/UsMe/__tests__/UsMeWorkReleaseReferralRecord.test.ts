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

import { UsMeWorkReleaseReferralRecordRaw, usMeWorkReleaseSchema } from "..";

// TODO remove this test once usMeCustodyLevelIsMinimumOrCommunity is
// phased out
test("transform record with usMeCustodyLevelIsMinimumOrCommunity", () => {
  const rawRecord: UsMeWorkReleaseReferralRecordRaw = {
    stateCode: "US_ME",
    externalId: "001",
    eligibleCriteria: {
      usMeCustodyLevelIsMinimumOrCommunity: { custodyLevel: "MINIMUM" },
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: "2022-11-03",
      },
      usMeThreeYearsRemainingOnSentence: {
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

  expect(usMeWorkReleaseSchema.parse(rawRecord)).toMatchSnapshot();
});

test("transform record with usMeCustodyLevelIsMinimum", () => {
  const rawRecord: UsMeWorkReleaseReferralRecordRaw = {
    stateCode: "US_ME",
    externalId: "001",
    eligibleCriteria: {
      usMeCustodyLevelIsMinimum: { custodyLevel: "MINIMUM" },
      usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
        eligibleDate: "2022-11-03",
      },
      usMeThreeYearsRemainingOnSentence: {
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

  expect(usMeWorkReleaseSchema.parse(rawRecord)).toMatchSnapshot();
});
