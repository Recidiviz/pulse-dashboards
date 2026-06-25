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

import { CasePlanList } from "./CasePlanList";

type CasePlan = UsMoClientMetadata["casePlan"];

// Pinned "now" (local construction; June is monthIndex 5) so due-status is
// deterministic. 2026-04-10 is overdue, 2026-06-26 is within 7 days (due soon).
const NOW = new Date(2026, 5, 23);

const CASE_PLAN: CasePlan = [
  {
    goal: "RS02A-Maintain Pro-Social Housing",
    objectivesAndTechniques: [
      {
        objective: "RS01.001-Research viable/ stable home plan options",
        objectiveEndDate: new Date(2026, 3, 10), // overdue
        techniques: ["IC01-Verbal Affirmation/admonishment as needed"],
      },
      {
        objective: "RS01.002-Submit selected home plan",
        objectiveEndDate: null, // no status, no due date
        techniques: ["IC01-Verbal Affirmation"],
      },
    ],
  },
  {
    goal: "SU02A-Maintain a Sober Lifestyle",
    objectivesAndTechniques: [
      {
        objective: "SU01.001-No violations for drug use",
        objectiveEndDate: new Date(2026, 5, 26), // due soon
        techniques: ["IC01-Verbal Affirmation"],
      },
    ],
  },
];

describe("CasePlanList", () => {
  test("renders the empty state when casePlan is an empty array", () => {
    render(<CasePlanList casePlan={[]} now={NOW} />);
    expect(screen.getByText("No Case Plan On File")).toBeInTheDocument();
  });

  test("renders the empty state when casePlan is undefined", () => {
    render(<CasePlanList casePlan={undefined} now={NOW} />);
    expect(screen.getByText("No Case Plan On File")).toBeInTheDocument();
  });

  test("renders each goal title with a 'Goal' label", () => {
    render(<CasePlanList casePlan={CASE_PLAN} now={NOW} />);

    expect(
      screen.getByText("RS02A-Maintain Pro-Social Housing"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SU02A-Maintain a Sober Lifestyle"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Goal")).toHaveLength(2);
  });

  test("renders objective text and techniques", () => {
    render(<CasePlanList casePlan={CASE_PLAN} now={NOW} />);

    expect(
      screen.getByText("RS01.001-Research viable/ stable home plan options"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SU01.001-No violations for drug use"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("IC01-Verbal Affirmation/admonishment as needed"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("IC01-Verbal Affirmation")).toHaveLength(2);
  });

  test("shows the 'Overdue' status and due date for an overdue objective", () => {
    render(<CasePlanList casePlan={CASE_PLAN} now={NOW} />);
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Due Apr 10, 2026")).toBeInTheDocument();
  });

  test("shows the 'Due Soon' status and due date for a due-soon objective", () => {
    render(<CasePlanList casePlan={CASE_PLAN} now={NOW} />);
    expect(screen.getByText("Due Soon")).toBeInTheDocument();
    expect(screen.getByText("Due Jun 26, 2026")).toBeInTheDocument();
  });

  test("renders no status label or due date when objectiveEndDate is null", () => {
    render(
      <CasePlanList
        casePlan={[
          {
            goal: "Goal with undated objective",
            objectivesAndTechniques: [
              {
                objective: "Undated objective",
                objectiveEndDate: null,
                techniques: ["A technique"],
              },
            ],
          },
        ]}
        now={NOW}
      />,
    );

    expect(screen.getByText("Undated objective")).toBeInTheDocument();
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    expect(screen.queryByText("Due Soon")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Due /)).not.toBeInTheDocument();
  });

  test("renders no body section when a goal has no objectives", () => {
    render(
      <CasePlanList
        casePlan={[
          { goal: "Goal with no objectives", objectivesAndTechniques: [] },
        ]}
        now={NOW}
      />,
    );
    expect(screen.getByText("Goal with no objectives")).toBeInTheDocument();
    // No objectives means no due-status anywhere.
    expect(screen.queryByText("Overdue")).not.toBeInTheDocument();
    expect(screen.queryByText("Due Soon")).not.toBeInTheDocument();
  });

  test("renders an em dash for a null goal and a null objective", () => {
    render(
      <CasePlanList
        casePlan={[
          {
            goal: null,
            objectivesAndTechniques: [
              {
                objective: null,
                objectiveEndDate: null,
                techniques: [],
              },
            ],
          },
        ]}
        now={NOW}
      />,
    );
    // Both the goal title and the objective text fall back to "—".
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});
