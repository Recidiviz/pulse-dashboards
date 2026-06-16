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

import { UsMiClassificationReviewReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsMi";
import { fixtureWithIdKey } from "./utils";

export const UsMiClassificationReviewReferralsFixture =
  fixtureWithIdKey<UsMiClassificationReviewReferralRecordRaw>("externalId", [
    {
      stateCode: "US_MI",
      externalId: "cr-eligible-1",
      eligibleCriteria: {
        usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
          supervisionLevel: "MAXIMUM",
          mediumIsLowestSupervisionLevelAllowed: null,
        },
        usMiPastInitialClassificationReviewDate: {
          eligibleDate: "2022-12-12",
        },
      },
      ineligibleCriteria: {},
      metadata: { recommendedSupervisionLevel: "MEDIUM" },
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
    },
    {
      stateCode: "US_MI",
      externalId: "cr-eligible-2",
      eligibleCriteria: {
        usMiNotAlreadyOnLowestEligibleSupervisionLevel: null,
        usMiSixMonthsPastLastClassificationReviewDate: {
          eligibleDate: "2023-02-28",
        },
      },
      ineligibleCriteria: {},
      metadata: {},
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
    },
    {
      stateCode: "US_MI",
      externalId: "cr-ae-1",
      eligibleCriteria: {
        usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
          supervisionLevel: "MAXIMUM",
          mediumIsLowestSupervisionLevelAllowed: null,
        },
      },
      ineligibleCriteria: {
        usMiPastInitialClassificationReviewDate: {
          eligibleDate: "2026-12-01",
        },
      },
      metadata: { recommendedSupervisionLevel: "MEDIUM" },
      caseNotes: {},
      isEligible: false,
      isAlmostEligible: true,
    },
    {
      stateCode: "US_MI",
      externalId: "cr-ae-denied-1",
      eligibleCriteria: {
        usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
          supervisionLevel: "MAXIMUM",
          mediumIsLowestSupervisionLevelAllowed: null,
        },
      },
      ineligibleCriteria: {
        usMiPastInitialClassificationReviewDate: {
          eligibleDate: "2027-01-01",
        },
      },
      metadata: { recommendedSupervisionLevel: "MEDIUM" },
      caseNotes: {},
      isEligible: false,
      isAlmostEligible: true,
    },
    {
      stateCode: "US_MI",
      externalId: "cr-pending-1",
      eligibleCriteria: {
        usMiNotAlreadyOnLowestEligibleSupervisionLevel: {
          supervisionLevel: "MAXIMUM",
          mediumIsLowestSupervisionLevelAllowed: null,
        },
        usMiPastInitialClassificationReviewDate: {
          eligibleDate: "2024-11-01",
        },
      },
      ineligibleCriteria: {},
      metadata: { recommendedSupervisionLevel: "MEDIUM" },
      caseNotes: {},
      isEligible: true,
      isAlmostEligible: false,
    },
  ]);
