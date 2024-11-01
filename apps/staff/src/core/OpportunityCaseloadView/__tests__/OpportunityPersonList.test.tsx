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
import { Mock } from "vitest";

import {
  useFeatureVariants,
  useOpportunityConfigurations,
  useRootStore,
} from "../../../components/StoreProvider";
import { Client } from "../../../WorkflowsStore/Client";
import { opportunitiesByTab } from "../../../WorkflowsStore/utils";
import {
  mockOpportunity,
  mockOpportunityConfigs,
} from "../../__tests__/testUtils";
import { OpportunityPersonList } from "../OpportunityPersonList";

vi.mock("../../../components/StoreProvider");
vi.mock("../../../hooks/useHydrateOpportunities");
vi.mock("../../../WorkflowsStore/utils");

const useRootStoreMock = useRootStore as Mock;
const useOpportunityConfigurationsMock = useOpportunityConfigurations as Mock;
const useFeatureVariantsMock = useFeatureVariants as Mock;
const mockOpportunitiesByTab = opportunitiesByTab as Mock;

const baseWorkflowsStoreMock = {
  opportunityTypes: ["earlyTermination"],
  opportunitiesLoaded: () => false,
  selectedSearchIds: [],
  selectedOpportunityType: "earlyTermination",
  justiceInvolvedPersonTitle: "client",
  workflowsSearchFieldTitle: "officer",
  allOpportunitiesByType: { earlyTermination: [] },
  potentialOpportunities: () => [],
  hasOpportunities: () => false,
  activeNotificationsForOpportunityType: () => [],
};
beforeEach(() => {
  vi.resetAllMocks();
  useOpportunityConfigurationsMock.mockReturnValue(mockOpportunityConfigs);
  useFeatureVariantsMock.mockReturnValue({ sortableOpportunityTabs: {} });
  mockOpportunitiesByTab.mockReturnValue({ earlyTermination: [] });
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

  mockOpportunitiesByTab.mockReturnValue({
    earlyTermination: {
      [firstTabText]: [opp1],
      [otherTabText]: [opp2],
      [emptyTabText]: [],
    },
  });
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp1, opp2] },
    },
    firestoreStore: {
      getCustomTabOrdering: vi.fn().mockResolvedValue(undefined),
    },
  });

  render(<OpportunityPersonList />);

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
  mockOpportunitiesByTab.mockReturnValue({
    earlyTermination: {
      [firstTabText]: [opp],
    },
  });
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp] },
    },
    firestoreStore: {
      getCustomTabOrdering: vi.fn().mockResolvedValue(undefined),
    },
  });

  render(<OpportunityPersonList />);

  expect(screen.queryByText(firstTabText)).toBeInTheDocument();
});

test("hydrated with a tab that is not listed as the first tab in the order", () => {
  const firstTabText = "Eligible Now";
  const overriddenTabText = "Marked Ineligible";

  const opp = {
    ...mockOpportunity,
    person: {
      recordId: "3",
    } as Client,
    tabTitle: () => overriddenTabText,
    type: "earlyTermination",
  };

  mockOpportunitiesByTab.mockReturnValue({
    earlyTermination: {
      [overriddenTabText]: [opp],
    },
  });
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp] },
    },
    firestoreStore: {
      getCustomTabOrdering: vi.fn().mockResolvedValue(undefined),
    },
  });

  render(<OpportunityPersonList />);

  // All tabs, even empty ones, should be shown
  expect(screen.getByText(firstTabText)).toBeInTheDocument();
  expect(screen.getByText(overriddenTabText)).toBeInTheDocument();
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
  mockOpportunitiesByTab.mockReturnValue({
    earlyTermination: {
      [firstTabText]: [opp],
    },
  });
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {},
    },
    firestoreStore: {
      getCustomTabOrdering: vi.fn().mockResolvedValue(undefined),
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

  mockOpportunitiesByTab.mockReturnValue({});
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {
        earlyTermination: [opp, almostOpp, ineligibleOpp],
      },
    },
    firestoreStore: {
      getCustomTabOrdering: vi.fn().mockResolvedValue(undefined),
    },
  });

  const { container } = render(<OpportunityPersonList />);

  expect(container).toContainHTML("<div></div>");
});

test("when `hasOpportunities` returns false", () => {
  const firstTabText = "Eligible Now";

  const opp = {
    ...mockOpportunity,
    tabOrder: [firstTabText],
    person: {
      recordId: "4",
    } as Client,
  };

  mockOpportunitiesByTab.mockReturnValue({
    earlyTermination: {
      [firstTabText]: [opp],
    },
  });
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => false,
      allOpportunitiesByType: {
        earlyTermination: [],
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

test("when `earlyTermination` in `allOpportunitiesByType` is undefined", () => {
  const firstTabText = "Eligible Now";

  const opp = {
    ...mockOpportunity,
    tabOrder: [firstTabText],
    person: {
      recordId: "4",
    } as Client,
  };

  mockOpportunitiesByTab.mockReturnValue({
    earlyTermination: {
      [firstTabText]: [opp],
    },
  });
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {
        earlyTermination: undefined,
      },
    },
    firestoreStore: {
      getCustomTabOrdering: vi.fn().mockResolvedValue(undefined),
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
  mockOpportunitiesByTab.mockReturnValue({
    earlyTermination: undefined,
  });
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: {
        earlyTermination: [opp, almostOpp, ineligibleOpp],
      },
    },
    firestoreStore: {
      getCustomTabOrdering: vi.fn().mockResolvedValue(undefined),
    },
  });

  const { container } = render(<OpportunityPersonList />);

  expect(container).toContainHTML("<div></div>");
});

test("displays simplified title", () => {
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
  mockOpportunitiesByTab.mockReturnValue({
    earlyTermination: { "Eligible Now": [opp1, opp2] },
  });
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp1, opp2] },
    },
    firestoreStore: {
      getCustomTabOrdering: vi.fn().mockResolvedValue(undefined),
    },
  });

  render(<OpportunityPersonList />);

  expect(screen.getByText("Early Termination")).toBeInTheDocument();
});

test("displays subheading", () => {
  const opp = {
    ...mockOpportunity,
    person: {
      recordId: "1",
    } as Client,
    type: "earlyTermination",
  };

  mockOpportunitiesByTab.mockReturnValue({
    earlyTermination: { "Eligible Now": [opp] },
  });
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp] },
    },
    firestoreStore: {
      getCustomTabOrdering: vi.fn().mockResolvedValue(undefined),
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText(
      "This alert helps staff identify residents who are due for annual custody reclassification and directs staff to complete & submit new classification paperwork. Review clients eligible for early termination and complete the auto-filled paperwork to file with the court.",
    ),
  ).toBeInTheDocument();
});
