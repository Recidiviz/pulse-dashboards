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

import { ParoleRiskAssessment } from "~datatypes";

import { AssessmentsSidebarSection } from "../AssessmentsSidebarSection";

const RISK_ASSESSMENTS: Array<ParoleRiskAssessment> = [
  {
    tool: "LSI",
    score: 14,
    maxScore: 54,
    date: "2026-05-12",
  },
  // Superseded entry -- the section should show only the latest per tool.
  {
    tool: "LSI",
    score: 38,
    maxScore: 54,
    date: "2025-01-15",
  },
];

describe("AssessmentsSidebarSection", () => {
  it("renders nothing when the tenant tracks no assessment tools", () => {
    const { container } = render(
      <AssessmentsSidebarSection
        riskAssessments={RISK_ASSESSMENTS}
        tools={[]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the type, date, score, and risk level for a tool on file", () => {
    render(
      <AssessmentsSidebarSection
        riskAssessments={RISK_ASSESSMENTS}
        tools={["LSI"]}
      />,
    );

    expect(screen.getByText("Assessments")).toBeInTheDocument();
    expect(screen.getByText("LSI")).toBeInTheDocument();
    expect(screen.getByText("May 12, 2026")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("out of 54")).toBeInTheDocument();
    expect(screen.getByText("Low Risk")).toBeInTheDocument();
  });

  it("uses each tool's chronologically latest entry, not the first one", () => {
    render(
      <AssessmentsSidebarSection
        riskAssessments={RISK_ASSESSMENTS}
        tools={["LSI"]}
      />,
    );

    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.queryByText("38")).not.toBeInTheDocument();
  });

  it("lists a tracked tool with no matching assessment as not on file", () => {
    render(
      <AssessmentsSidebarSection
        riskAssessments={RISK_ASSESSMENTS}
        tools={["LSI", "VRAG", "STATIC"]}
      />,
    );

    expect(screen.getByText("Non Applicable/ Not on File")).toBeInTheDocument();
    expect(screen.getByText("VRAG")).toBeInTheDocument();
    expect(screen.getByText("STATIC")).toBeInTheDocument();
    // On-file tools appear once, in the assessment row -- not duplicated
    // into the not-on-file list.
    expect(screen.getAllByText("LSI")).toHaveLength(1);
  });

  it("omits the not-on-file list entirely when every tracked tool has an assessment", () => {
    render(
      <AssessmentsSidebarSection
        riskAssessments={RISK_ASSESSMENTS}
        tools={["LSI"]}
      />,
    );

    expect(
      screen.queryByText("Non Applicable/ Not on File"),
    ).not.toBeInTheDocument();
  });
});
