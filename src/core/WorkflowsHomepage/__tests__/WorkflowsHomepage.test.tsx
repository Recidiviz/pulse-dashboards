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

import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import { useRootStore } from "../../../components/StoreProvider";
import { mockOpportunity } from "../../__tests__/testUtils";
import WorkflowsHomepage from "..";

jest.mock("../../../components/StoreProvider");
jest.mock("../../CaseloadSelect", () => ({
  CaseloadSelect: () => {
    return <div data-testid="caseload-select" />;
  },
}));

const useRootStoreMock = useRootStore as jest.Mock;

describe("WorkflowsHomepage", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Quiet errors during test runs
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders Welcome page on initial state", () => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        allOpportunitiesLoaded: false,
        selectedOfficerIds: [],
        opportunityTypes: ["earlyTermination"],
        allOpportunitiesByType: { earlyTermination: [] },
        hasOpportunities: false,
        user: { info: { givenNames: "Recidiviz" } },
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>
    );

    expect(screen.getByText("Welcome, Recidiviz")).toBeInTheDocument();
  });

  test("render no results", () => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        allOpportunitiesLoaded: true,
        selectedOfficerIds: ["123"],
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [],
        },
        hasOpportunities: false,
        user: { info: { givenNames: "Recidiviz" } },
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>
    );

    expect(
      screen.getByText(
        "None of the clients on the selected officer's caseloads are eligible for opportunities. Search for another officer."
      )
    ).toBeInTheDocument();
  });

  test("render no results from multiple officers", () => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        allOpportunitiesLoaded: true,
        selectedOfficerIds: ["123", "456"],
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [],
        },
        hasOpportunities: false,
        user: { info: { givenNames: "Recidiviz" } },
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>
    );

    expect(
      screen.getByText(
        "None of the clients on the selected officers' caseloads are eligible for opportunities. Search for another officer."
      )
    ).toBeInTheDocument();
  });

  test("render opportunities", () => {
    mockOpportunity.client.officerId = "123";
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        allOpportunitiesLoaded: true,
        selectedOfficerIds: ["123"],
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [mockOpportunity],
        },
        hasOpportunities: true,
        user: { info: { givenNames: "Recidiviz" } },
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>
    );

    expect(
      screen.getByText(
        "Review clients who are past their full-term release date and email clerical to move them to history."
      )
    ).toBeInTheDocument();
  });
});
