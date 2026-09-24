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

import {
  ParoleRiskAssessment,
  ParoleRiskNeedFactor,
  ParoleRiskTool,
} from "~datatypes";

import { UsIdHealthAndAssessmentsSection } from "../UsIdHealthAndAssessmentsSection";

const TOOLS: Array<ParoleRiskTool> = ["LSIR", "VRAG", "STATIC_99"];

function assessment(
  fields: Partial<ParoleRiskAssessment>,
): ParoleRiskAssessment {
  return {
    tool: "LSIR",
    level: "LOW",
    score: 14,
    maxScore: 54,
    date: "2026-05-12",
    subcategories: [
      { name: "Criminal History", score: 6, maxScore: 10 },
      { name: "Education/Employment", score: 5, maxScore: 10 },
    ],
    ...fields,
  };
}

function renderSection({
  riskAssessments = [assessment({})],
  riskAndNeedsFactors = [],
  tools = TOOLS,
}: {
  riskAssessments?: Array<ParoleRiskAssessment>;
  riskAndNeedsFactors?: Array<ParoleRiskNeedFactor>;
  tools?: Array<ParoleRiskTool>;
} = {}) {
  return render(
    <UsIdHealthAndAssessmentsSection
      riskAssessments={riskAssessments}
      riskAndNeedsFactors={riskAndNeedsFactors}
      tools={tools}
    />,
  );
}

describe("UsIdHealthAndAssessmentsSection", () => {
  it("renders the mental health level of care when one is on record", () => {
    renderSection({
      riskAndNeedsFactors: [
        { factor: "Mental Health", score: "3/M", scale: "Low to moderate" },
      ],
    });

    expect(screen.getByText("Mental health level of care")).toBeInTheDocument();
    expect(screen.getByText("3/M — Low to moderate")).toBeInTheDocument();
  });

  it("reports no mental health level of care when the state sends none", () => {
    renderSection({
      riskAndNeedsFactors: [{ factor: "Dental", score: "1", scale: "Routine" }],
    });

    expect(screen.getByText("None reported")).toBeInTheDocument();
  });

  it("cards each tool with its name, risk level and assessment date", () => {
    renderSection({ riskAssessments: [assessment({ date: "2026-04-21" })] });

    expect(screen.getByText("LSIR")).toBeInTheDocument();
    expect(screen.getByText("LOW")).toBeInTheDocument();
    expect(screen.getByText("Assessed Apr 21, 2026")).toBeInTheDocument();
    expect(screen.getByText("Subcategory breakdown")).toBeInTheDocument();
  });

  it("shows the level as the source spells it, rather than deriving one", () => {
    renderSection({
      riskAssessments: [assessment({ level: "VERY_HIGH", score: 1 })],
    });

    // A score of 1 out of 54 would derive as "Low"; the source says otherwise.
    expect(screen.getByText("VERY HIGH")).toBeInTheDocument();
    expect(screen.queryByText("Low")).not.toBeInTheDocument();
  });

  it("omits the risk label when the source recorded no level", () => {
    renderSection({ riskAssessments: [assessment({ level: undefined })] });

    expect(screen.getByText("LSIR")).toBeInTheDocument();
    expect(screen.queryByText(/Risk/)).not.toBeInTheDocument();
  });

  it("shows one card per tool that has an assessment on file", () => {
    renderSection({
      riskAssessments: [
        assessment({ tool: "LSIR" }),
        assessment({ tool: "VRAG" }),
      ],
    });

    expect(screen.getByText("LSIR")).toBeInTheDocument();
    expect(screen.getByText("VRAG")).toBeInTheDocument();
    // STATIC_99 is configured but has no assessment, so it gets no card.
    expect(screen.queryByText("STATIC_99")).not.toBeInTheDocument();
  });

  it("cards only each tool's most recent assessment", () => {
    renderSection({
      riskAssessments: [
        assessment({ tool: "LSIR", date: "2020-01-01" }),
        assessment({ tool: "LSIR", date: "2026-04-21" }),
      ],
    });

    expect(screen.getAllByText("LSIR")).toHaveLength(1);
    expect(screen.getByText("Assessed Apr 21, 2026")).toBeInTheDocument();
  });

  it("orders the cards the way the tenant configures its tools", () => {
    renderSection({
      riskAssessments: [
        assessment({ tool: "VRAG" }),
        assessment({ tool: "LSIR" }),
      ],
    });

    const lsir = screen.getByText("LSIR");
    const vrag = screen.getByText("VRAG");
    expect(
      lsir.compareDocumentPosition(vrag) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders no cards when the resident has no assessments", () => {
    renderSection({ riskAssessments: [] });

    expect(screen.getByText("Health and Assessments")).toBeInTheDocument();
    expect(screen.queryByText("Subcategory breakdown")).not.toBeInTheDocument();
  });
});
