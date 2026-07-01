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
  UsNeSupervisionDowngradeRecord,
  usNeSupervisionDowngradeSchema,
} from "./schema";

export const usNeSupervisionDowngradeFixtures = {
  fullyEligible: makeRecordFixture(usNeSupervisionDowngradeSchema, {
    stateCode: "US_NE",
    externalId: "CLI001",
    isEligible: true,
    isAlmostEligible: false,
    eligibleCriteria: {
      supervisionLevelIsHigherThanRecommended: {
        supervisionLevel: "MEDIUM",
        recommendedSupervisionLevel: "MINIMUM",
      },
      notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
        eligibleDate: relativeFixtureDate({ years: 2 }),
      },
    },
    ineligibleCriteria: {},
    metadata: {
      recentOrasScores: [
        {
          assessmentDate: relativeFixtureDate({ months: -2 }),
          assessmentLevel: "LOW",
        },
        {
          assessmentDate: relativeFixtureDate({ months: -8 }),
          assessmentLevel: "MODERATE",
        },
      ],
      specialConditions: [
        {
          specialConditionType: "DRUG_TESTING",
          compliance: "COMPLIANT",
        },
      ],
    },
  }),
  almostEligible: makeRecordFixture(usNeSupervisionDowngradeSchema, {
    stateCode: "US_NE",
    externalId: "CLI002",
    isEligible: false,
    isAlmostEligible: true,
    eligibleCriteria: {
      supervisionLevelIsHigherThanRecommended: {
        supervisionLevel: "HIGH",
        recommendedSupervisionLevel: "MEDIUM",
      },
    },
    ineligibleCriteria: {
      notSupervisionPastFullTermCompletionDateOrUpcoming30Days: {
        eligibleDate: relativeFixtureDate({ days: 20 }),
      },
    },
    metadata: {
      recentOrasScores: [
        {
          assessmentDate: relativeFixtureDate({ months: -1 }),
          assessmentLevel: "MODERATE",
        },
      ],
      specialConditions: [],
    },
  }),
} satisfies FixtureMapping<UsNeSupervisionDowngradeRecord>;
