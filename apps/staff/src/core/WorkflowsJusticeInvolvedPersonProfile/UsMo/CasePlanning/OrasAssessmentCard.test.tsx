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
import { describe, expect, test } from "vitest";

import { UsMoClientMetadata } from "~datatypes";

import { OrasAssessmentCard } from "./OrasAssessmentCard";

const ORAS: NonNullable<UsMoClientMetadata["orasAssessment"]> = {
  assessmentScore: 23,
  assessmentType: "ORAS_COMMUNITY_SUPERVISION",
  assessmentAdministeredBy: "MaryAnn Harper",
  assessmentDate: new Date(2026, 3, 10), // 2026-04-10
};

describe("OrasAssessmentCard", () => {
  test("always renders the section title", () => {
    render(<OrasAssessmentCard orasAssessment={ORAS} />);
    expect(screen.getByText("ORAS Assessment")).toBeInTheDocument();
  });

  test("renders the empty state when orasAssessment is null", () => {
    render(<OrasAssessmentCard orasAssessment={null} />);
    expect(screen.getByText("No ORAS assessment on file.")).toBeInTheDocument();
    expect(screen.getByText("ORAS Assessment")).toBeInTheDocument();
  });

  test("renders the empty state when assessmentDate is null", () => {
    render(
      <OrasAssessmentCard orasAssessment={{ ...ORAS, assessmentDate: null }} />,
    );
    expect(screen.getByText("No ORAS assessment on file.")).toBeInTheDocument();
  });

  test("renders the assessment metadata rows", () => {
    render(<OrasAssessmentCard orasAssessment={ORAS} />);

    expect(screen.getByText("Assessment type")).toBeInTheDocument();
    // getMoAssessmentDisplayName("ORAS_COMMUNITY_SUPERVISION") → the SAR
    // display name for "ORAS_CST".
    expect(
      screen.getByText("Community Supervision Tool (ORAS-CST)"),
    ).toBeInTheDocument();

    expect(screen.getByText("Assessment date")).toBeInTheDocument();
    expect(screen.getByText("04/10/2026")).toBeInTheDocument();

    expect(screen.getByText("Administered by")).toBeInTheDocument();
    expect(screen.getByText("MaryAnn Harper")).toBeInTheDocument();

    expect(
      screen.queryByText("No ORAS assessment on file."),
    ).not.toBeInTheDocument();
  });

  test("renders 'N/A' when assessmentAdministeredBy is null", () => {
    render(
      <OrasAssessmentCard
        orasAssessment={{ ...ORAS, assessmentAdministeredBy: null }}
      />,
    );
    expect(screen.getByText("Administered by")).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  test("renders a configured tool's max score in the donut (e.g. 23/49 for ORAS-CST)", () => {
    const { container } = render(<OrasAssessmentCard orasAssessment={ORAS} />);
    expect(screen.getByText("23/49")).toBeInTheDocument();
    // Background ring + filled score arc = two <path> elements.
    expect(container.querySelectorAll("svg path")).toHaveLength(2);
  });

  test("shows the real name and 'X/--' light donut for the CSST screening tool", () => {
    const { container } = render(
      <OrasAssessmentCard
        orasAssessment={{
          ...ORAS,
          assessmentType: "ORAS_COMMUNITY_SUPERVISION_SCREENING",
        }}
      />,
    );
    expect(
      screen.getByText("Community Supervision Screening Tool (ORAS-CSST)"),
    ).toBeInTheDocument();
    expect(screen.getByText("23/--")).toBeInTheDocument();
    // Unknown max → only the light background ring renders (no filled arc).
    expect(container.querySelectorAll("svg path")).toHaveLength(1);
  });

  test("falls back to 'Other Assessment' and 'X/--' when the assessment type is unmapped", () => {
    const { container } = render(
      <OrasAssessmentCard
        orasAssessment={{ ...ORAS, assessmentType: "SOMETHING_ELSE" }}
      />,
    );
    expect(screen.getByText("Other Assessment")).toBeInTheDocument();
    expect(screen.getByText("23/--")).toBeInTheDocument();
    expect(container.querySelectorAll("svg path")).toHaveLength(1);
  });

  test("shows the 'Last Updated' subtitle only when lastUpdated is provided", () => {
    const { rerender } = render(<OrasAssessmentCard orasAssessment={ORAS} />);
    expect(screen.queryByText(/Last Updated/)).not.toBeInTheDocument();

    rerender(
      <OrasAssessmentCard
        orasAssessment={ORAS}
        lastUpdated={new Date(2026, 5, 1)} // 2026-06-01
      />,
    );
    expect(screen.getByText("Last Updated 6/1/2026")).toBeInTheDocument();
  });

  test("renders the donut SVG alongside the metadata", () => {
    const { container } = render(<OrasAssessmentCard orasAssessment={ORAS} />);
    // OrasScoreDonut renders a d3-backed <svg>; confirm it mounts in jsdom.
    expect(container.querySelector("svg")).not.toBeNull();
  });

  test("falls back to a score of 0 when assessmentScore is null", () => {
    // Exercises the `assessmentScore ?? 0` branch — still renders the card.
    const { container } = render(
      <OrasAssessmentCard
        orasAssessment={{ ...ORAS, assessmentScore: null }}
      />,
    );
    expect(screen.getByText("ORAS Assessment")).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
  });
});
