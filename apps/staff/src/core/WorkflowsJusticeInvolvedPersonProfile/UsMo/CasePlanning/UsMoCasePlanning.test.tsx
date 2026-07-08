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

import { Client } from "../../../../WorkflowsStore";
import { UsMoCasePlanning, UsMoCasePlanningView } from "./UsMoCasePlanning";

const NOW = new Date(2026, 5, 23);

const ORAS: NonNullable<UsMoClientMetadata["orasAssessment"]> = {
  assessmentScore: 23,
  assessmentType: "ORAS_COMMUNITY_SUPERVISION",
  assessmentAdministeredBy: "MaryAnn Harper",
  assessmentDate: new Date(2026, 3, 10), // 2026-04-10
  lastUpdated: new Date(2026, 5, 1), // 2026-06-01
};

const CASE_PLAN: UsMoClientMetadata["casePlan"] = [
  {
    goal: "RS02A-Maintain Pro-Social Housing",
    objectivesAndTechniques: [
      {
        objective: "RS01.001-Research viable/ stable home plan options",
        objectiveEndDate: new Date(2026, 3, 10),
        techniques: ["IC01-Verbal Affirmation/admonishment as needed"],
      },
    ],
  },
];

describe("UsMoCasePlanningView", () => {
  test("renders the 'Case Planning' heading", () => {
    render(
      <UsMoCasePlanningView
        orasAssessment={ORAS}
        casePlan={CASE_PLAN}
        now={NOW}
      />,
    );
    expect(screen.getByText("Case Planning")).toBeInTheDocument();
  });

  test("composes the ORAS card and the case-plan list with full data", () => {
    render(
      <UsMoCasePlanningView
        orasAssessment={ORAS}
        casePlan={CASE_PLAN}
        lastUpdated={new Date(2026, 5, 1)}
        now={NOW}
      />,
    );

    // ORAS card
    expect(screen.getByText("ORAS Assessment")).toBeInTheDocument();
    expect(screen.getByText("Last Updated 6/1/2026")).toBeInTheDocument();
    expect(
      screen.getByText("Community Supervision Tool (ORAS-CST)"),
    ).toBeInTheDocument();

    // Case-plan list
    expect(
      screen.getByText("RS02A-Maintain Pro-Social Housing"),
    ).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  test("renders both empty states when ORAS and case plan are empty", () => {
    render(
      <UsMoCasePlanningView orasAssessment={null} casePlan={[]} now={NOW} />,
    );
    expect(screen.getByText("Case Planning")).toBeInTheDocument();
    expect(screen.getByText("No ORAS assessment on file.")).toBeInTheDocument();
    expect(screen.getByText("No case plan on file")).toBeInTheDocument();
  });
});

describe("UsMoCasePlanning (observer wrapper)", () => {
  test("reads orasAssessment + casePlan off client.metadata and renders", () => {
    const client = {
      metadata: {
        stateCode: "US_MO",
        sex: "MALE",
        orasAssessment: ORAS,
        casePlan: CASE_PLAN,
      } as unknown as UsMoClientMetadata,
    } as unknown as Client;

    render(<UsMoCasePlanning client={client} />);

    expect(screen.getByText("Case Planning")).toBeInTheDocument();
    expect(screen.getByText("ORAS Assessment")).toBeInTheDocument();
    // lastUpdated comes from the ORAS `lastUpdated` sync date (2026-06-01).
    expect(screen.getByText("Last Updated 6/1/2026")).toBeInTheDocument();
    expect(
      screen.getByText("RS02A-Maintain Pro-Social Housing"),
    ).toBeInTheDocument();
  });

  test("renders empty states when metadata has no ORAS or case plan", () => {
    const client = {
      metadata: {
        stateCode: "US_MO",
        sex: "MALE",
        orasAssessment: undefined,
        casePlan: undefined,
      } as unknown as UsMoClientMetadata,
    } as unknown as Client;

    render(<UsMoCasePlanning client={client} />);

    expect(screen.getByText("No ORAS assessment on file.")).toBeInTheDocument();
    expect(screen.getByText("No case plan on file")).toBeInTheDocument();
    // No assessment date → no "Last Updated" subtitle.
    expect(screen.queryByText(/Last Updated/)).not.toBeInTheDocument();
  });
});
