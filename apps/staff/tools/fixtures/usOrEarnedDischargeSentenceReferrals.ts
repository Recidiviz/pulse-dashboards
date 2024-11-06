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

import { UsOrEarnedDischargeSentenceReferralRecordRaw } from "../../src/WorkflowsStore/Opportunity/UsOr/UsOrEarnedDischargeSentenceOpportunity";
import { FirestoreFixture } from "./utils";

export const usOrEarnedDischargeSentenceReferrals: FirestoreFixture<UsOrEarnedDischargeSentenceReferralRecordRaw> =
  {
    data: [
      {
        stateCode: "US_OR",
        externalId: "001",
        opportunityId: "o1",
        opportunityPseudonymizedId: "po1",
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
            courtCaseNumber: "CASE1",
            sentenceStatute: "STATUTE",
          },
        },
        isEligible: true,
        isAlmostEligible: false,
      },
      {
        stateCode: "US_OR",
        externalId: "001",
        opportunityId: "o12",
        opportunityPseudonymizedId: "po12",
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
            courtCaseNumber: "CASE2",
            sentenceStatute: "STATUTE2",
          },
        },
        isEligible: true,
        isAlmostEligible: false,
      },
      {
        stateCode: "US_OR",
        externalId: "002",
        opportunityId: "o21",
        opportunityPseudonymizedId: "po21",
        eligibleCriteria: {
          usOrNoSupervisionSanctionsWithin6Months: null,
        },
        ineligibleCriteria: {
          usOrSentenceEligible: {
            meetsCriteriaServed6Months: false,
            meetsCriteriaServedHalfOfSentence: true,
          },
        },
        metadata: {
          sentence: {
            courtCaseNumber: "CASE1",
            sentenceStatute: "STATUTE",
          },
        },
        isEligible: false,
        isAlmostEligible: true,
      },
      {
        stateCode: "US_OR",
        externalId: "002",
        opportunityId: "o22",
        opportunityPseudonymizedId: "po22",
        eligibleCriteria: {
          usOrNoSupervisionSanctionsWithin6Months: null,
          usOrSentenceEligible: {
            meetsCriteriaServed6Months: true,
            meetsCriteriaServedHalfOfSentence: true,
          },
        },
        ineligibleCriteria: {},
        metadata: {
          sentence: {
            courtCaseNumber: "CASE2",
            sentenceStatute: "STATUTE2",
          },
        },
        isEligible: true,
        isAlmostEligible: false,
      },
    ],
    idFunc: ({ externalId, opportunityId }) => `${externalId}_${opportunityId}`,
  };
