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

import { UsOrEarnedDischargeSentenceRecord } from "~datatypes";

import { FirestoreFixture } from "./utils";

export const usOrEarnedDischargeSentenceReferrals: FirestoreFixture<
  UsOrEarnedDischargeSentenceRecord["input"]
> = {
  data: [
    // Peter Rivington (001) — fully eligible, 2 active sentences
    {
      stateCode: "US_OR",
      externalId: "001",
      opportunityId: "S1001",
      opportunityPseudonymizedId: "po101",
      eligibleCriteria: {
        usOrSentenceEligible: {
          meetsCriteriaServed6Months: true,
          meetsCriteriaServedHalfOfSentence: true,
        },
        usOrNoSupervisionSanctionsWithin6Months: null,
      },
      ineligibleCriteria: {},
      metadata: {
        sentence: {
          courtCaseNumber: "22CR04521",
          sentenceStatute: "ORS 164.405",
          sentenceStartDate: "2022-03-15",
          sentenceEndDate: "2027-03-15",
        },
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    {
      stateCode: "US_OR",
      externalId: "001",
      opportunityId: "S1002",
      opportunityPseudonymizedId: "po102",
      eligibleCriteria: {
        usOrSentenceEligible: {
          meetsCriteriaServed6Months: true,
          meetsCriteriaServedHalfOfSentence: true,
        },
        usOrNoSupervisionSanctionsWithin6Months: null,
      },
      ineligibleCriteria: {},
      metadata: {
        sentence: {
          courtCaseNumber: "23CR00872",
          sentenceStatute: "ORS 475.894",
          sentenceStartDate: "2023-06-01",
          sentenceEndDate: "2027-06-01",
        },
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    // Maria Santos (002) — fully eligible, 1 sentence
    {
      stateCode: "US_OR",
      externalId: "002",
      opportunityId: "S2001",
      opportunityPseudonymizedId: "po201",
      eligibleCriteria: {
        usOrSentenceEligible: {
          meetsCriteriaServed6Months: true,
          meetsCriteriaServedHalfOfSentence: true,
        },
        usOrNoSupervisionSanctionsWithin6Months: null,
      },
      ineligibleCriteria: {},
      metadata: {
        sentence: {
          courtCaseNumber: "22CR11583",
          sentenceStatute: "ORS 163.175",
          sentenceStartDate: "2023-02-10",
          sentenceEndDate: "2027-02-10",
        },
      },
      isEligible: true,
      isAlmostEligible: false,
    },
    // James Walker (003) — almost eligible: sanctions expire soon
    {
      stateCode: "US_OR",
      externalId: "003",
      opportunityId: "S3001",
      opportunityPseudonymizedId: "po301",
      eligibleCriteria: {
        usOrSentenceEligible: {
          meetsCriteriaServed6Months: true,
          meetsCriteriaServedHalfOfSentence: true,
        },
      },
      ineligibleCriteria: {
        usOrNoSupervisionSanctionsWithin6Months: {
          latestSanctionDate: "2026-02-15",
          violationExpirationDate: "2026-08-15",
        },
      },
      metadata: {
        sentence: {
          courtCaseNumber: "23CR07291",
          sentenceStatute: "ORS 163.160",
          sentenceStartDate: "2023-05-01",
          sentenceEndDate: "2028-05-01",
        },
      },
      isEligible: false,
      isAlmostEligible: true,
    },
    // Lisa Chen (004) — almost eligible: served 6 months, approaching half completion
    {
      stateCode: "US_OR",
      externalId: "004",
      opportunityId: "S4001",
      opportunityPseudonymizedId: "po401",
      eligibleCriteria: {
        usOrNoSupervisionSanctionsWithin6Months: null,
      },
      ineligibleCriteria: {
        usOrSentenceEligible: {
          meetsCriteriaServed6Months: true,
          meetsCriteriaServedHalfOfSentence: false,
        },
      },
      metadata: {
        sentence: {
          courtCaseNumber: "24CR05937",
          sentenceStatute: "ORS 811.182",
          sentenceStartDate: "2024-09-15",
          sentenceEndDate: "2028-09-15",
        },
      },
      isEligible: false,
      isAlmostEligible: true,
    },
  ],
  idFunc: ({ externalId, opportunityId }) => `${externalId}_${opportunityId}`,
};
