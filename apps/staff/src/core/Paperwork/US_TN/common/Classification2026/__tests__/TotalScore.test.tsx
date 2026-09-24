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

import { render, screen } from "@testing-library/react";

import { TotalScore } from "../TotalScore";

const REQUIREMENT = /Trustee Assessment is required/;

function renderScore(trusteeAssessmentRequired?: boolean) {
  render(
    <TotalScore
      score={7}
      lowUpper={12}
      mediumUpper={24}
      trusteeAssessmentRequired={trusteeAssessmentRequired}
    />,
  );
}

describe("TotalScore", () => {
  it("says nothing about the Trustee Assessment by default", () => {
    render(<TotalScore score={7} lowUpper={12} mediumUpper={24} />);

    expect(screen.queryByText(REQUIREMENT)).toBeNull();
  });

  it("leaves the DCAF's score box alone", () => {
    renderScore(false);

    expect(screen.queryByText(REQUIREMENT)).toBeNull();
  });

  it("names the custody level that triggered the assessment", () => {
    renderScore(true);

    expect(
      screen.getByText(/because the final custody level is Low\./),
    ).toBeInTheDocument();
  });

  it("underlines the requirement ahead of the reason for it", () => {
    renderScore(true);

    expect(screen.getByText(REQUIREMENT)).toHaveStyleRule(
      "text-decoration",
      "underline",
    );
  });
});
