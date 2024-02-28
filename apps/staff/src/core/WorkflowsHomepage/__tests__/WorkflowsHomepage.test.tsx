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
import { OpportunityType } from "../../../WorkflowsStore";
import { mockOpportunity } from "../../__tests__/testUtils";
import WorkflowsHomepage from "..";

jest.mock("../../../components/StoreProvider");
jest.mock("../../CaseloadSelect", () => ({
  CaseloadSelect: () => {
    return <div data-testid="caseload-select" />;
  },
}));

const useRootStoreMock = useRootStore as jest.Mock;

const baseWorkflowsStoreMock = {
  opportunitiesLoaded: () => false,
  potentialOpportunities: () => [],
  selectedSearchIds: ["123"],
  opportunityTypes: ["earlyTermination"],
  allOpportunitiesByType: { earlyTermination: [] },
  hasOpportunities: () => false,
  user: { info: { givenNames: "Recidiviz" } },
  workflowsSearchFieldTitle: "officer",
  justiceInvolvedPersonTitle: "client",
  rootStore: {
    currentTenantId: "US_XX",
  },
  homepage: "home",
};

describe("WorkflowsHomepage", () => {
  beforeEach(() => {
    // @ts-expect-error
    mockOpportunity.person.recordId = "1";
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders Welcome page on initial state", () => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        selectedSearchIds: [],
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Welcome, Recidiviz")).toBeInTheDocument();
  });

  test("renders loading indicator", () => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        hasOpportunities: () => true,
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  test("renders loading indicator when some but not all have loaded", () => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: (opp: OpportunityType) => opp === "LSU",
        opportunityTypes: ["earlyTermination", "LSU"],
        allOpportunitiesByType: { earlyTermination: [], LSU: [] },
        hasOpportunities: () => true,
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  test("render no results", () => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(
        "None of the clients on the selected officer's caseloads are eligible for opportunities. Search for another officer.",
      ),
    ).toBeInTheDocument();
  });

  test("render no results from multiple officers", () => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        selectedSearchIds: ["123", "456"],
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(
        "None of the clients on the selected officers' caseloads are eligible for opportunities. Search for another officer.",
      ),
    ).toBeInTheDocument();
  });

  test("render no results respects officer title override", () => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        workflowsSearchFieldTitle: "unicorn",
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(
        "None of the clients on the selected unicorn's caseloads are eligible for opportunities. Search for another unicorn.",
      ),
    ).toBeInTheDocument();
  });

  test("render opportunities", () => {
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [mockOpportunity],
        },
        hasOpportunities: () => true,
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(
        "1 client is nearing or past their full-term release date",
      ),
    ).toBeInTheDocument();
  });

  test("render opportunities where all clients are marked ineligible", () => {
    const opp = { ...mockOpportunity, reviewStatus: "DENIED" };
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [opp],
        },
        hasOpportunities: () => true,
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(
        "Some clients are nearing or past their full-term release date",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Ineligible: 1")).toBeInTheDocument();
  });

  test("header does not include ineligible opps in count", () => {
    const firstOpp = { ...mockOpportunity, reviewStatus: "DENIED" };
    const secondOpp = {
      ...mockOpportunity,
      reviewStatus: "IN_PROGRESS",
      person: { recordId: "2" },
    };
    const thirdOpp = {
      ...mockOpportunity,
      reviewStatus: "IN_PROGRESS",
      person: { recordId: "3" },
    };
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [firstOpp, secondOpp, thirdOpp],
        },
        hasOpportunities: () => true,
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.getByText(
        "2 clients are nearing or past their full-term release date",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Ineligible: 1")).toBeInTheDocument();
  });

  test("review status uses overridden text for alert opps", () => {
    const firstOpp = {
      ...mockOpportunity,
      isAlert: true,
      reviewStatus: "DENIED",
    };
    const secondOpp = {
      ...mockOpportunity,
      isAlert: true,
      reviewStatus: "IN_PROGRESS",
      person: { recordId: "2" },
    };
    const thirdOpp = {
      ...mockOpportunity,
      isAlert: true,
      reviewStatus: "IN_PROGRESS",
      person: { recordId: "3" },
    };
    useRootStoreMock.mockReturnValue({
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [firstOpp, secondOpp, thirdOpp],
        },
        hasOpportunities: () => true,
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Overridden: 1")).toBeInTheDocument();
  });
});
