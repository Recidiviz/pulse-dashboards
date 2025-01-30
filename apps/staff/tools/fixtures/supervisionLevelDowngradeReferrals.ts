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

import { UsTnSupervisionLevelDowngradeReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsTn";
import { fixtureWithIdKey } from "./utils";

export const usTnSupervisionLevelDowngradeReferrals =
  fixtureWithIdKey<UsTnSupervisionLevelDowngradeReferralRecordRaw>(
    "externalId",
    [
      {
        stateCode: "US_TN",
        externalId: "102",
        eligibleCriteria: {
          supervisionLevelHigherThanAssessmentLevel: {
            assessmentLevel: "HIGH",
            latestAssessmentDate: relativeFixtureDate({ days: -1 }),
            supervisionLevel: "MAXIMUM",
          },
        },
        ineligibleCriteria: {},
        caseNotes: {
          Violations: [
            {
              eventDate: relativeFixtureDate({ months: -10 }),
              noteTitle: "VRPT",
            },
            {
              eventDate: relativeFixtureDate({ months: -5 }),
              noteTitle: "ARRP",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
      },
      {
        stateCode: "US_TN",
        externalId: "108",
        eligibleCriteria: {
          supervisionLevelHigherThanAssessmentLevel: {
            assessmentLevel: "LOW",
            latestAssessmentDate: relativeFixtureDate({ days: -18 }),
            supervisionLevel: "MEDIUM",
          },
        },
        ineligibleCriteria: {},
        caseNotes: {
          Violations: [
            {
              eventDate: relativeFixtureDate({ days: -801 }),
              noteTitle: "DEFG",
            },
          ],
        },
        isEligible: true,
        isAlmostEligible: false,
      },
    ],
  );
