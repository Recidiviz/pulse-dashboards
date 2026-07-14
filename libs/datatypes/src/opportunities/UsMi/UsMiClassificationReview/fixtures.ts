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

import { makeRecordFixture } from "../../../utils/zod/object/makeRecordFixture";
import { FixtureMapping } from "../../utils/types";
import {
  UsMiClassificationReviewReferralRecord,
  usMiClassificationReviewSchemaForSupervisionLevelFormatter,
} from "./schema";

const schema = usMiClassificationReviewSchemaForSupervisionLevelFormatter();

export const usMiClassificationReviewFixtures = {
  eligibleInitialReview: makeRecordFixture(schema, {
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
    isEligible: true,
    isAlmostEligible: false,
  }),
  eligibleSixMonthReview: makeRecordFixture(schema, {
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
    isEligible: true,
    isAlmostEligible: false,
  }),
} satisfies FixtureMapping<UsMiClassificationReviewReferralRecord>;
