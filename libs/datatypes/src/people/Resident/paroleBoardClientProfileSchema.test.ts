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

import { paroleBoardClientProfileRiskAssessmentSchema } from "./paroleBoardClientProfileSchema";

describe("paroleBoardClientProfileRiskAssessmentSchema", () => {
  it("parses INT64 scores the Workflows export writes as strings", () => {
    expect(
      paroleBoardClientProfileRiskAssessmentSchema.parse({
        assessmentScore: "30",
        assessmentMaxScore: "54",
        assessmentCategories: [
          { assessmentCategoryScore: "0", assessmentCategoryMaxScore: "10" },
        ],
      }),
    ).toMatchObject({
      assessmentScore: 30,
      assessmentMaxScore: 54,
      assessmentCategories: [
        { assessmentCategoryScore: 0, assessmentCategoryMaxScore: 10 },
      ],
    });
  });

  it("keeps a numeric score and a negative string score", () => {
    expect(
      paroleBoardClientProfileRiskAssessmentSchema.parse({
        assessmentScore: 30,
        // VRAG-R scores can be negative.
        assessmentMaxScore: "-3",
      }),
    ).toMatchObject({ assessmentScore: 30, assessmentMaxScore: -3 });
  });

  it("treats a null score as absent rather than 0", () => {
    expect(
      paroleBoardClientProfileRiskAssessmentSchema.parse({
        assessmentScore: null,
      }).assessmentScore,
    ).toBeUndefined();
  });

  it("rejects a score that is not an integer", () => {
    expect(() =>
      paroleBoardClientProfileRiskAssessmentSchema.parse({
        assessmentScore: "thirty",
      }),
    ).toThrow();
  });
});
