// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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
import { Mock } from "vitest";

import { OpportunityType } from "~datatypes";

import {
  useFeatureVariants,
  useOpportunityConfigurations,
  useRootStore,
} from "../../../components/StoreProvider";
import { DENIED_UPDATE } from "../../../WorkflowsStore/Opportunity/testUtils";
import {
  mockOpportunity,
  mockOpportunityConfigs,
} from "../../__tests__/testUtils";
import WorkflowsHomepage from "..";

vi.mock("../../../components/StoreProvider");
vi.mock("../../CaseloadSelect", () => ({
  CaseloadSelect: () => {
    return <div data-testid="caseload-select" />;
  },
}));

const useRootStoreMock = useRootStore as Mock;
const useOpportunityConfigurationsMock = useOpportunityConfigurations as Mock;

const baseWorkflowsStoreMock = {
  opportunitiesLoaded: () => false,
  potentialOpportunities: () => [],
  opportunityTypes: ["earlyTermination"],
  allOpportunitiesByType: { earlyTermination: [] },
  hasOpportunities: () => false,
  user: { info: { givenNames: "Recidiviz" } },
  justiceInvolvedPersonTitle: "client",
  rootStore: {
    currentTenantId: "US_XX",
  },
  homepage: "home",
  activeSystem: "SUPERVISION",
  opportunityConfigurationStore: {
    opportunities: mockOpportunityConfigs,
    hydrate: vi.fn(),
  },
  searchStore: {
    workflowsSearchFieldTitle: "officer",
    searchTitleOverride: () => "location",
    selectedSearchIds: ["123"],
  },
  activePage: { page: "home " },
  systemConfigFor: () => {
    return { search: [] };
  },
};

const baseRootStoreMock = {
  workflowsStore: baseWorkflowsStoreMock,
  tenantStore: {
    workflowsMethodologyUrl: "METHODOLOGY_URL",
  },
};

describe("WorkflowsHomepage", () => {
  beforeEach(() => {
    // @ts-expect-error
    mockOpportunity.person.recordId = "1";
    vi.resetAllMocks();
    useOpportunityConfigurationsMock.mockReturnValue(mockOpportunityConfigs);
    vi.mocked(useFeatureVariants).mockReturnValue({});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("renders Welcome page on initial state", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
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

    expect(screen.queryByText("Welcome, Recidiviz")).toBeDefined();
  });

  test("renders loading indicator", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
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

    expect(screen.queryByText("Loading data...")).toBeDefined();
  });

  test("renders loading indicator when some but not all have loaded", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
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

    expect(screen.queryByText("Loading data...")).toBeDefined();
  });

  test("render no results", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
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
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        searchStore: {
          searchTitleOverride: () => "location",
          selectedSearchIds: ["123", "456"],
          workflowsSearchFieldTitle: "officer",
        },
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
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        searchStore: {
          workflowsSearchFieldTitle: "unicorn",
          selectedSearchIds: ["123"],
          searchTitleOverride: () => "location",
        },
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

  test("hydrated cta uses 'caseload' for supervision opps", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [mockOpportunity],
        },
        searchTitleOverride: () => "agent",
        hasOpportunities: () => true,
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.queryByText(
        "Hi, Recidiviz. We’ve found some outstanding items across 1 caseload.",
      ),
    ).toBeDefined();
  });

  test("hydrated cta uses overridden term for facility opps", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [mockOpportunity],
        },
        searchTitleOverride: () => "facility",
        hasOpportunities: () => true,
        activeSystem: "INCARCERATION",
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.queryByText(
        "Hi, Recidiviz. We’ve found some outstanding items across 1 facility.",
      ),
    ).toBeDefined();
  });

  test("hydrated cta uses 'caseload' for facility opps when searching by case manager", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [mockOpportunity],
        },
        searchTitleOverride: () => "case manager",
        hasOpportunities: () => true,
        activeSystem: "INCARCERATION",
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.queryByText(
        "Hi, Recidiviz. We’ve found some outstanding items across 1 caseload.",
      ),
    ).toBeDefined();
  });

  test("hydrated cta uses combined search terms when searching supervision and facility opps", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [mockOpportunity],
        },
        hasOpportunities: () => true,
        activeSystem: "ALL",
        rootStore: {
          currentTenantId: "US_MI",
        },
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.queryByText(
        "Hi, Recidiviz. We’ve found some outstanding items across 1 caseload and/or facility.",
      ),
    ).toBeDefined();
  });

  test("hydrated cta uses 'caseload' for when searching supervision and facility opps where 'case manager' is the facility search term", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["pastFTRD"],
        allOpportunitiesByType: {
          pastFTRD: [mockOpportunity],
        },
        hasOpportunities: () => true,
        activeSystem: "ALL",
        rootStore: {
          currentTenantId: "US_ME",
        },
      },
    });

    render(
      <BrowserRouter>
        <WorkflowsHomepage />
      </BrowserRouter>,
    );

    expect(
      screen.queryByText(
        "Hi, Recidiviz. We’ve found some outstanding items across 1 caseload.",
      ),
    ).toBeDefined();
  });

  test("render opportunities", () => {
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
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
      screen.queryByText(
        "1 client is nearing or past their full-term release date",
      ),
    ).toBeDefined();
  });

  test("render opportunities where all clients are marked ineligible", () => {
    const opp = {
      ...mockOpportunity,
      denial: DENIED_UPDATE,
      tabTitle: () => "Marked Ineligible",
    };
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["LSU"],
        allOpportunitiesByType: {
          LSU: [opp],
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
        "Some clients may be eligible for the Limited Supervision Unit",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Marked Ineligible: 1")).toBeInTheDocument();
  });

  test("header does not include ineligible or submitted opps in count", () => {
    const deniedOpp = {
      ...mockOpportunity,
      denial: DENIED_UPDATE,
      tabTitle: () => "Marked Ineligible",
    };
    const submittedOpp = {
      ...mockOpportunity,
      isSubmitted: true,
      tabTitle: () => "Pending",
    };
    const otherOpp = {
      ...mockOpportunity,
      person: { recordId: "2" },
    };
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
      workflowsStore: {
        ...baseWorkflowsStoreMock,
        opportunitiesLoaded: () => true,
        opportunityTypes: ["LSU"],
        allOpportunitiesByType: {
          LSU: [deniedOpp, submittedOpp, otherOpp],
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
        "1 client may be eligible for the Limited Supervision Unit",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Marked Ineligible: 1")).toBeInTheDocument();
    expect(screen.getByText("Pending: 1")).toBeInTheDocument();
  });

  test("review status uses overridden text for alert opps", () => {
    const firstOpp = {
      ...mockOpportunity,
      tabTitle: (tabGroup?: string) =>
        tabGroup === "ELIGIBILITY STATUS" ? "Overridden" : "Other",
    };
    const secondOpp = {
      ...mockOpportunity,
      person: { recordId: "2" },
    };
    const thirdOpp = {
      ...mockOpportunity,
      person: { recordId: "3" },
    };
    useRootStoreMock.mockReturnValue({
      ...baseRootStoreMock,
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
