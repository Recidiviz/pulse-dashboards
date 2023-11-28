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

import {
  useFeatureVariants,
  useRootStore,
} from "../../../components/StoreProvider";
import { Client } from "../../../WorkflowsStore/Client";
import { mockOpportunity } from "../../__tests__/testUtils";
import { OpportunityPersonList } from "../OpportunityPersonList";

jest.mock("../../../components/StoreProvider");
jest.mock("../../../hooks/useHydrateOpportunities");

const useRootStoreMock = useRootStore as jest.Mock;
const useFeatureVariantsMock = useFeatureVariants as jest.Mock;

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
  jest.resetAllMocks();
  useFeatureVariantsMock.mockReturnValue({ responsiveRevamp: {} });
});

test("initial", () => {
  useRootStoreMock.mockReturnValue({
    workflowsStore: baseWorkflowsStoreMock,
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText(
      "Search for officers above to review and refer eligible clients for early termination."
    )
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
      "None of the clients on the selected officer's caseloads are eligible for early termination. Search for another officer."
    )
  ).toBeInTheDocument();
});

test("hydrated", () => {
  const firstTabText = "Displays first";
  const emptyTabText = "Empty Tab";
  const otherTabText = "Displays after";
  const oppTabOrder = [firstTabText, emptyTabText, otherTabText];
  const opp1 = {
    ...mockOpportunity,
    tabOrder: oppTabOrder,
    person: {
      recordId: "1",
    } as Client,
  };
  const opp2 = {
    ...opp1,
    person: {
      recordId: "2",
    } as Client,
  };
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp1, opp2] },
      opportunitiesByTab: {
        earlyTermination: {
          [otherTabText]: [opp1],
          [firstTabText]: [opp2],
        },
      },
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText("2 clients may be eligible for early termination")
  ).toBeInTheDocument();

  expect(screen.queryByText(emptyTabText)).not.toBeInTheDocument();

  const firstTab = screen.getByText(firstTabText);
  const otherTab = screen.getByText(otherTabText);

  expect(firstTab).toBeInTheDocument();
  expect(otherTab).toBeInTheDocument();
  expect(firstTab.compareDocumentPosition(otherTab)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
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
    screen.getByText("1 client may be eligible for early termination")
  ).toBeInTheDocument();

  expect(screen.queryByText(firstTabText)).toBeInTheDocument();
});

test("hydrated with a tab that is not listed as the first tab in the order", () => {
  const firstTabText = "Eligible Now";
  const overriddenTabText = "Overridden";
  const oppTabOrder = [firstTabText, overriddenTabText];
  const opp = {
    ...mockOpportunity,
    tabOrder: oppTabOrder,
    person: {
      recordId: "3",
    } as Client,
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
          [overriddenTabText]: [opp],
        },
      },
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText("1 client may be eligible for early termination")
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
        earlyTermination: {
          [firstTabText]: [opp],
        },
      },
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText("2 clients may be eligible for early termination")
  ).toBeInTheDocument();
});
