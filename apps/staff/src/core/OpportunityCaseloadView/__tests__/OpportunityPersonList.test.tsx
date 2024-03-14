// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { Mock } from "vitest";

import {
  useOpportunityConfigurations,
  useRootStore,
} from "../../../components/StoreProvider";
import { Client } from "../../../WorkflowsStore/Client";
import { OPPORTUNITY_CONFIGS } from "../../../WorkflowsStore/Opportunity/OpportunityConfigs";
import { OpportunityType } from "../../../WorkflowsStore/Opportunity/OpportunityType/types";
import {
  Opportunity,
  OpportunityTab,
} from "../../../WorkflowsStore/Opportunity/types";
import { mockOpportunity } from "../../__tests__/testUtils";
import { OpportunityPersonList } from "../OpportunityPersonList";

vi.mock("../../../components/StoreProvider");
vi.mock("../../../hooks/useHydrateOpportunities");

const useRootStoreMock = useRootStore as Mock;
const useOpportunityConfigurationsMock = useOpportunityConfigurations as Mock;

const baseWorkflowsStoreMock = {
  opportunityTypes: ["earlyTermination"],
  opportunitiesLoaded: () => false,
  selectedSearchIds: [],
  selectedOpportunityType: "earlyTermination",
  justiceInvolvedPersonTitle: "client",
  workflowsSearchFieldTitle: "officer",
  opportunitiesByTab: {
    earlyTermination: [],
  },
  allOpportunitiesByType: { earlyTermination: [] },
  potentialOpportunities: () => [],
  hasOpportunities: () => false,
};
beforeEach(() => {
  vi.resetAllMocks();
  useOpportunityConfigurationsMock.mockReturnValue(OPPORTUNITY_CONFIGS);
});

test("initial", () => {
  useRootStoreMock.mockReturnValue({
    workflowsStore: baseWorkflowsStoreMock,
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText(
      "Search for officers above to review and refer eligible clients for early termination.",
    ),
  ).toBeInTheDocument();
});

test("loading", () => {
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
    },
  });

  render(<OpportunityPersonList />);

  expect(screen.getByText("Loading data...")).toBeInTheDocument();
});

test("empty", () => {
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText(
      "None of the clients on the selected officer's caseloads are eligible for early termination. Search for another officer.",
    ),
  ).toBeInTheDocument();
});

test("hydrated", () => {
  const firstTabText = "Eligible Now";
  const otherTabText = "Almost Eligible";
  const emptyTabText = "Overridden";
  const opp1 = {
    ...mockOpportunity,
    person: {
      recordId: "1",
    } as Client,
    type: "earlyTermination",
  };
  const opp2 = {
    ...opp1,
    person: {
      recordId: "2",
    } as Client,
    type: "earlyTermination",
  };

  const opportunitiesByTab: Partial<
    Record<OpportunityType, Partial<Record<OpportunityTab, Opportunity[]>>>
  > = {
    earlyTermination: {
      [firstTabText]: [opp1 as Opportunity],
      [otherTabText]: [opp2 as Opportunity],
      [emptyTabText]: [],
    },
  };
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp1, opp2] },
      opportunitiesByTab,
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText("2 clients may be eligible for early termination"),
  ).toBeInTheDocument();

  expect(screen.queryByText(emptyTabText)).not.toBeInTheDocument();

  const firstTab = screen.getByText(firstTabText);
  const otherTab = screen.getByText(otherTabText);

  expect(firstTab).toBeInTheDocument();
  expect(otherTab).toBeInTheDocument();
  expect(firstTab.compareDocumentPosition(otherTab)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});

test("hydrated with one tab", () => {
  const firstTabText = "Eligible Now";
  const oppTabOrder = [firstTabText, "Overridden"];
  const opp = {
    ...mockOpportunity,
    tabOrder: oppTabOrder,
    person: {
      recordId: "4",
    } as Client,
    type: "earlyTermination",
  };
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp] },
      opportunitiesByTab: {
        earlyTermination: {
          [firstTabText]: [opp],
        },
      },
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText("1 client may be eligible for early termination"),
  ).toBeInTheDocument();

  expect(screen.queryByText(firstTabText)).toBeInTheDocument();
});

test("hydrated with a tab that is not listed as the first tab in the order", () => {
  const firstTabText = "Eligible Now";
  const overriddenTabText = "Marked ineligible";

  const opp = {
    ...mockOpportunity,
    person: {
      recordId: "3",
    } as Client,
    tabTitle: overriddenTabText,
    type: "earlyTermination",
  };

  const opportunitiesByTab: Partial<
    Record<OpportunityType, Partial<Record<OpportunityTab, Opportunity[]>>>
  > = {
    earlyTermination: {
      [overriddenTabText]: [opp as Opportunity],
    },
  };
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp] },
      opportunitiesByTab,
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText("1 client may be eligible for early termination"),
  ).toBeInTheDocument();

  expect(screen.queryByText(firstTabText)).not.toBeInTheDocument();
  expect(screen.getByText(overriddenTabText)).toBeInTheDocument();
});

test("hydrated with eligible and ineligible opps", () => {
  const firstTabText = "Eligible Now";

  const opp = {
    ...mockOpportunity,
    tabOrder: [firstTabText],
    person: {
      recordId: "4",
    } as Client,
    type: "earlyTermination",
  };

  const almostOpp = { ...opp, reviewStatus: "ALMOST" };

  const ineligibleOpp = { ...opp, denial: { reasons: ["test"] } };
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {
        earlyTermination: [
          opp,
          { ...almostOpp, type: "earlyTermination" },
          { ...ineligibleOpp, type: "earlyTermination" },
        ],
      },
      opportunitiesByTab: {
        earlyTermination: {
          [firstTabText]: [opp],
        },
      },
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText("2 clients may be eligible for early termination"),
  ).toBeInTheDocument();
});

test("when `allOpportunitiesByType` is undefined", () => {
  const firstTabText = "Eligible Now";

  const opp = {
    ...mockOpportunity,
    tabOrder: [firstTabText],
    person: {
      recordId: "4",
    } as Client,
    type: "earlyTermination",
  };

  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: undefined,
      opportunitiesByTab: {
        earlyTermination: {
          [firstTabText]: [{ ...opp, type: "earlyTermination" }],
        },
      },
    },
  });

  const { container } = render(<OpportunityPersonList />);

  expect(container).toContainHTML("<div></div>");
});

test("when `allOpportunitiesByType` is an empty object", () => {
  const firstTabText = "Eligible Now";

  const opp = {
    ...mockOpportunity,
    tabOrder: [firstTabText],
    person: {
      recordId: "4",
    } as Client,
  };

  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {},
      opportunitiesByTab: {
        earlyTermination: {
          [firstTabText]: [opp],
        },
      },
    },
  });

  const { container } = render(<OpportunityPersonList />);

  expect(container).toContainHTML("<div></div>");
});

test("when `opportunitiesByTab` is undefined", () => {
  const firstTabText = "Eligible Now";

  const opp = {
    ...mockOpportunity,
    tabOrder: [firstTabText],
    person: {
      recordId: "4",
    } as Client,
  };

  const almostOpp = { ...opp, reviewStatus: "ALMOST" };

  const ineligibleOpp = { ...opp, denial: { reasons: ["test"] } };
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {
        earlyTermination: [opp, almostOpp, ineligibleOpp],
      },
      opportunitiesByTab: undefined,
    },
  });

  const { container } = render(<OpportunityPersonList />);

  expect(container).toContainHTML("<div></div>");
});

test("when `opportunitiesByTab` is an empty object", () => {
  const firstTabText = "Eligible Now";

  const opp = {
    ...mockOpportunity,
    tabOrder: [firstTabText],
    person: {
      recordId: "4",
    } as Client,
  };

  const almostOpp = { ...opp, reviewStatus: "ALMOST" };

  const ineligibleOpp = { ...opp, denial: { reasons: ["test"] } };
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {
        earlyTermination: [opp, almostOpp, ineligibleOpp],
      },
      opportunitiesByTab: {},
    },
  });

  const { container } = render(<OpportunityPersonList />);

  expect(container).toContainHTML("<div></div>");
});

test("when `earlyTermination` in `allOpportunitiesByType` is an empty list", () => {
  const firstTabText = "Eligible Now";

  const opp = {
    ...mockOpportunity,
    tabOrder: [firstTabText],
    person: {
      recordId: "4",
    } as Client,
  };

  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {
        earlyTermination: [],
      },
      opportunitiesByTab: {
        earlyTermination: {
          [firstTabText]: [opp],
        },
      },
    },
  });
  render(<OpportunityPersonList />);
  expect(
    screen.getByText(
      "None of the clients on the selected officer's caseloads are eligible for early termination. Search for another officer.",
    ),
  ).toBeInTheDocument();
});

test("when `earlyTermination` in `opportunitiesByTab` is undefined", () => {
  const firstTabText = "Eligible Now";

  const opp = {
    ...mockOpportunity,
    tabOrder: [firstTabText],
    person: {
      recordId: "4",
    } as Client,
  };

  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {
        earlyTermination: undefined,
      },
      opportunitiesByTab: {
        earlyTermination: {
          [firstTabText]: [opp],
        },
      },
    },
  });
  const { container } = render(<OpportunityPersonList />);

  expect(container).toContainHTML("<div></div>");
});

test("an opp is undefined in `opportunitiesByTab`", () => {
  const firstTabText = "Eligible Now";

  const opp = {
    ...mockOpportunity,
    tabOrder: [firstTabText],
    person: {
      recordId: "4",
    } as Client,
  };

  const almostOpp = { ...opp, reviewStatus: "ALMOST" };

  const ineligibleOpp = { ...opp, denial: { reasons: ["test"] } };
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {
        earlyTermination: [opp, almostOpp, ineligibleOpp],
      },
      opportunitiesByTab: {
        earlyTermination: undefined,
      },
    },
  });

  const { container } = render(<OpportunityPersonList />);

  expect(container).toContainHTML("<div></div>");
});
