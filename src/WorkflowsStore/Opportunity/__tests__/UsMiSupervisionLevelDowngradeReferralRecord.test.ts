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

import {
  UsMiSupervisionLevelDowngradeReferralRecordRaw,
  usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter,
} from "../UsMiSupervisionLevelDowngradeReferralRecord";

const transformer =
  usMiSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter()
    .parse;

test("transform record for SLD", () => {
  const rawRecord: UsMiSupervisionLevelDowngradeReferralRecordRaw = {
    stateCode: "US_MI",
    externalId: "sld-eligible-1",
    eligibleCriteria: {
      usMiNotPastInitialClassificationReviewDate: {
        eligibleDate: "2022-12-12",
      },
      usMiNotServingIneligibleOffensesForDowngradeFromSupervisionLevel: null,
      supervisionLevelHigherThanAssessmentLevel: {
        supervisionLevel: "HIGH",
        assessmentLevel: "MEDIUM",
        latestAssessmentDate: "2022-10-12",
      },
    },
    ineligibleCriteria: {},
    caseNotes: {
      "Recommended supervision level": [
        {
          eventDate: null,
          noteBody: "MEDIUM",
          noteTitle: null,
        },
      ],
    },
  };

  expect(transformer(rawRecord)).toMatchSnapshot();
});
