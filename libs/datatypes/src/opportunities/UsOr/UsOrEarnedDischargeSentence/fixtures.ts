// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { makeRecordFixture, relativeFixtureDate } from "../../../utils/zod";
import { FixtureMapping } from "../../utils/types";
import {
  UsOrEarnedDischargeSentenceRecord,
  usOrEarnedDischargeSentenceSchema,
} from "./schema";

export const usOrEarnedDischargeSentenceFixtures = {
  fullyEligible: makeRecordFixture(usOrEarnedDischargeSentenceSchema, {
    stateCode: "US_OR",
    externalId: "CLIENT001",
    opportunityId: "opp1",
    opportunityPseudonymizedId: "popp1",
    isEligible: true,
    isAlmostEligible: false,
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
        courtCaseNumber: "CASE-001",
        sentenceStatute: "OR REV STAT 163.315",
        sentenceStartDate: relativeFixtureDate({ years: -3 }),
        sentenceEndDate: relativeFixtureDate({ years: 2 }),
      },
    },
  }),
  almostEligible: makeRecordFixture(usOrEarnedDischargeSentenceSchema, {
    stateCode: "US_OR",
    externalId: "CLIENT002",
    opportunityId: "opp2",
    opportunityPseudonymizedId: "popp2",
    isEligible: false,
    isAlmostEligible: true,
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
        courtCaseNumber: "CASE-002",
        sentenceStatute: "OR REV STAT 475.752",
        sentenceStartDate: relativeFixtureDate({ months: -4 }),
        sentenceEndDate: relativeFixtureDate({ years: 2, months: 8 }),
      },
    },
  }),
} satisfies FixtureMapping<UsOrEarnedDischargeSentenceRecord>;
