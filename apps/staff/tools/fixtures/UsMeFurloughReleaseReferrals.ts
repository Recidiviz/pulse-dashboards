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

import { UsMeFurloughReleaseReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsMe";
import { externalIdFunc, FirestoreFixture } from "./utils";

export const usMeFurloughReleaseFixture: FirestoreFixture<UsMeFurloughReleaseReferralRecordRaw> =
  {
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
          usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
            eligibleDate: "2022-08-10",
          },
          usMeServedHalfOfSentence: {
            eligibleDate: "2022-08-10",
          },
          usMeThreeYearsRemainingOnSentence: {
            eligibleDate: "2022-05-27",
          },
        },
        ineligibleCriteria: {},
        caseNotes: {
          Education: [
            {
              eventDate: "2022-06-02",
              noteTitle: "Graduated",
              noteBody: "Completed coding course",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
        metadata: {},
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
          usMeThreeYearsRemainingOnSentence: {
            eligibleDate: "2022-05-27",
          },
          usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
            eligibleDate: "2022-08-10",
          },
          usMeServedHalfOfSentence: {
            eligibleDate: "2022-08-10",
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
        isEligible: true,
        isAlmostEligible: false,
        metadata: {},
      },
      {
        stateCode: "US_ME",
        externalId: "RES003",
        eligibleCriteria: {
          usMeCustodyLevelIsMinimumOrCommunity: {
            custodyLevel: "MINIMUM",
          },
          usMeNoDetainersWarrantsOrOther: null,
          usMeThreeYearsRemainingOnSentence: {
            eligibleDate: "2022-04-27",
          },
          usMeServed30DaysAtEligibleFacilityForFurloughOrWorkRelease: {
            eligibleDate: "2022-08-10",
          },
          usMeNoClassAOrBViolationFor90Days: null,
          usMeServedHalfOfSentence: {
            eligibleDate: "2022-08-10",
          },
        },
        ineligibleCriteria: {},
        caseNotes: {
          Education: [
            {
              eventDate: "2022-06-02",
              noteTitle: "Graduated",
              noteBody: "Completed coding course",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
        metadata: {},
      },
    ],
    idFunc: externalIdFunc,
  };
