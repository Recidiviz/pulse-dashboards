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

import { ParoleRiskNeedFactor } from "~datatypes";

import { statusStyles } from "../../../BadgePill/BadgePill";
import { RiskAndNeedsAssessmentSection } from "../RiskAndNeedsAssessmentSection";

const FACTORS: Array<ParoleRiskNeedFactor> = [
  { factor: "Medical", score: "0", scale: "Low" },
  // Mental Health's real eOMIS score is qualifier-suffixed, unlike every
  // other factor's plain integer display.
  { factor: "Mental Health", score: "3/M", scale: "Moderate" },
  { factor: "Sex Offender", score: "5", scale: "High" },
];

describe("RiskAndNeedsAssessmentSection", () => {
  it("renders each factor's name and score", () => {
    render(<RiskAndNeedsAssessmentSection riskAndNeedsFactors={FACTORS} />);

    expect(screen.getByText("Medical")).toBeInTheDocument();
    expect(screen.getByText("Mental Health")).toBeInTheDocument();
    expect(screen.getByText("Sex Offender")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("3/M")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("colors the Scale badge green for Low, orange for Moderate, and red for High", () => {
    render(<RiskAndNeedsAssessmentSection riskAndNeedsFactors={FACTORS} />);

    expect(screen.getByText("Low")).toHaveStyleRule(
      "background-color",
      statusStyles.GREEN.backgroundColor,
    );
    expect(screen.getByText("Moderate")).toHaveStyleRule(
      "background-color",
      statusStyles.ORANGE.backgroundColor,
    );
    expect(screen.getByText("High")).toHaveStyleRule(
      "background-color",
      statusStyles.RED.backgroundColor,
    );
  });
});
