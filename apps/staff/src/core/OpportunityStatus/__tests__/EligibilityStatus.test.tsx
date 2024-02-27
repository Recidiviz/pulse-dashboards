// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { render, screen, waitFor } from "@testing-library/react";
import { observable, runInAction } from "mobx";

import { Opportunity } from "../../../WorkflowsStore";
import { dateToTimestamp } from "../../../WorkflowsStore/utils";
import { mockOpportunity } from "../../__tests__/testUtils";
import { EligibilityStatus } from "../EligibilityStatus";

test("render nothing until hydrated", async () => {
  const observableOpportunity = observable({
    ...mockOpportunity,
    hydrationState: { status: "loading" },
  } as Opportunity);

  const { container } = render(
    <EligibilityStatus opportunity={observableOpportunity} />,
  );
  expect(container).toBeEmptyDOMElement();

  runInAction(() => {
    observableOpportunity.hydrationState = { status: "hydrated" };
  });

  await waitFor(() => {
    expect(container).not.toBeEmptyDOMElement();
  });
});

test("inferred eligible", () => {
  render(<EligibilityStatus opportunity={mockOpportunity} />);
  expect(screen.getByText(/^Eligible$/)).toBeInTheDocument();
});

test("eligible with custom eligibility test", () => {
  const opportunity: Opportunity = {
    ...mockOpportunity,
    eligibleStatusMessage: "custom status",
  };
  render(<EligibilityStatus opportunity={opportunity} />);
  expect(screen.getByText(/^custom status$/)).toBeInTheDocument();
});

test("inferred maybe eligible", () => {
  render(
    <EligibilityStatus
      opportunity={{ ...mockOpportunity, defaultEligibility: "MAYBE" }}
    />,
  );
  expect(screen.getByText("May be eligible")).toBeInTheDocument();
});

describe("ineligible", () => {
  const denied = {
    ...mockOpportunity,
    denial: {
      reasons: ["foo", "bar"],
      updated: { by: "test@test.gov", date: dateToTimestamp("2022-03-15") },
    },
  };

  test("without reasons", () => {
    render(<EligibilityStatus opportunity={denied} />);
    expect(screen.getByText("Currently ineligible")).toBeInTheDocument();
  });

  test("with reasons", () => {
    render(<EligibilityStatus opportunity={denied} includeReasons />);
    expect(
      screen.getByText("Currently ineligible (foo, bar)"),
    ).toBeInTheDocument();
  });
});

test("ignore reverted denial", () => {
  render(
    <EligibilityStatus
      opportunity={{
        ...mockOpportunity,
        denial: {
          reasons: [],
          updated: { by: "test@test.gov", date: dateToTimestamp("2022-03-15") },
        },
      }}
    />,
  );
  expect(screen.queryByText("Currently ineligible")).not.toBeInTheDocument();
});

describe("almost eligible", () => {
  const almost = {
    ...mockOpportunity,
    almostEligible: true,
    almostEligibleStatusMessage: "test message",
  };

  test("without reasons", () => {
    render(<EligibilityStatus opportunity={almost} />);
    expect(screen.getByText("Almost eligible")).toBeInTheDocument();
  });

  test("with reasons", () => {
    render(<EligibilityStatus opportunity={almost} includeReasons />);
    expect(screen.getByText("test message")).toBeInTheDocument();
  });
});
