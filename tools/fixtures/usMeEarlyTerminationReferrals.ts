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

import { UsMeEarlyTerminationReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsMeEarlyTerminationReferralRecord";
import { fixtureWithIdKey } from "./utils";

export const usMeEarlyTerminationReferralsFixture =
  fixtureWithIdKey<UsMeEarlyTerminationReferralRecordRaw>("externalId", [
    {
      stateCode: "US_ME",
      externalId: "009",
      eligibleCriteria: {
        noConvictionWithin6Months: null,
        supervisionPastHalfFullTermReleaseDateFromSupervisionStart: {
          eligibleDate: "2024-04-03",
        },
        onMediumSupervisionLevelOrLower: {
          supervisionLevel: "MEDIUM",
        },
        usMeNoPendingViolationsWhileSupervised: null,
      },
      ineligibleCriteria: {},
      caseNotes: {
        "Supervision Conditions": [
          {
            noteTitle: "Other - Not completed",
            noteBody: "There are some other conditions",
            eventDate: "2022-06-17",
          },
          {
            noteTitle: "Report as directed - Not completed",
          },
        ],
      },
    },
    {
      stateCode: "US_ME",
      externalId: "010",
      eligibleCriteria: {
        noConvictionWithin6Months: null,
        supervisionPastHalfFullTermReleaseDateFromSupervisionStart: {
          eligibleDate: "2024-04-03",
        },
        onMediumSupervisionLevelOrLower: {
          supervisionLevel: "MEDIUM",
        },
        usMeNoPendingViolationsWhileSupervised: null,
      },
      ineligibleCriteria: {
        usMePaidAllOwedRestitution: {
          amountOwed: 500,
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
    },
    {
      stateCode: "US_ME",
      externalId: "011",
      eligibleCriteria: {
        usMePaidAllOwedRestitution: null,
        noConvictionWithin6Months: null,
        supervisionPastHalfFullTermReleaseDateFromSupervisionStart: {
          eligibleDate: "2024-04-03",
        },
        onMediumSupervisionLevelOrLower: {
          supervisionLevel: "MEDIUM",
        },
      },
      ineligibleCriteria: {
        usMeNoPendingViolationsWhileSupervised: {
          currentStatus: "PENDING VIOLATION",
          violationDate: "2023-01-01",
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
    },
  ]);
