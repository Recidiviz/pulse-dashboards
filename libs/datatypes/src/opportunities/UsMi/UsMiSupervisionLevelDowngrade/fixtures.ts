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
  UsMiSupervisionLevelDowngradeReferralRecord,
  usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter,
} from "./schema";

const schema =
  usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter();

export const usMiSupervisionLevelDowngradeFixtures = {
  fullyEligible1: makeRecordFixture(schema, {
    stateCode: "US_MI",
    externalId: "001",
    eligibleCriteria: {
      supervisionLevelHigherThanAssessmentLevel: {
        assessmentLevel: "HIGH",
        latestAssessmentDate: "2021-08-20",
        supervisionLevel: "MAXIMUM",
      },
      usMiNotPastInitialClassificationReviewDate: {
        eligibleDate: "2025-01-01",
      },
      usMiNotServingIneligibleOffensesForDowngradeFromSupervisionLevel: null,
    },
    ineligibleCriteria: {},
    metadata: { eligibleDate: "2024-02-03" },
    caseNotes: {
      "Recommended supervision level": [
        {
          eventDate: null,
          noteBody: "MEDIUM",
          noteTitle: null,
        },
      ],
    },
    isEligible: true,
    isAlmostEligible: false,
  }),
} satisfies FixtureMapping<UsMiSupervisionLevelDowngradeReferralRecord>;
