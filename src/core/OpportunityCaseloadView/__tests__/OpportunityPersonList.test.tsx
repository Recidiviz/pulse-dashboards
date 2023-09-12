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

import { useRootStore } from "../../../components/StoreProvider";
import { Client } from "../../../WorkflowsStore/Client";
import { mockOpportunity } from "../../__tests__/testUtils";
import { OpportunityPersonList } from "../OpportunityPersonList";

jest.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as jest.Mock;

const baseWorkflowsStoreMock = {
  opportunitiesLoaded: () => false,
  selectedSearchIds: [],
  selectedOpportunityType: "earlyTermination",
  justiceInvolvedPersonTitle: "client",
  workflowsSearchFieldTitle: "officer",
  featureVariants: {
    responsiveRevamp: {},
  },
  opportunitiesBySection: {
    earlyTermination: [],
  },
  allOpportunitiesByType: { earlyTermination: [] },
  potentialOpportunities: () => [],
  hasOpportunities: () => false,
};

beforeEach(() => {
  jest.resetAllMocks();
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
  const firstSectionText = "Displays first";
  const emptySectionText = "Empty Section";
  const otherSectionText = "Displays after";
  const oppSectionOrder = [
    firstSectionText,
    emptySectionText,
    otherSectionText,
  ];
  const opp1 = {
    ...mockOpportunity,
    person: {
      recordId: "1",
    } as Client,
    sectionOrder: oppSectionOrder,
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
      opportunitiesBySection: {
        earlyTermination: {
          [otherSectionText]: [opp1],
          [firstSectionText]: [opp2],
        },
      },
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText("2 clients may be eligible for early termination")
  ).toBeInTheDocument();

  expect(screen.queryByText(emptySectionText)).not.toBeInTheDocument();

  const firstSection = screen.getByText(firstSectionText);
  const otherSection = screen.getByText(otherSectionText);

  expect(firstSection).toBeInTheDocument();
  expect(otherSection).toBeInTheDocument();
  expect(firstSection.compareDocumentPosition(otherSection)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
});

test("hydrated with one section", () => {
  const firstSectionText = "Eligible Now";
  const oppSectionOrder = [firstSectionText, "Overridden"];
  const opp = {
    ...mockOpportunity,
    person: {
      recordId: "4",
    } as Client,
    sectionOrder: oppSectionOrder,
  };
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp] },
      opportunitiesBySection: {
        earlyTermination: {
          [firstSectionText]: [opp],
        },
      },
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText("1 client may be eligible for early termination")
  ).toBeInTheDocument();

  expect(screen.queryByText(firstSectionText)).not.toBeInTheDocument();
});

test("hydrated with second section", () => {
  const firstSectionText = "Eligible Now";
  const overriddenSectionText = "Overridden";
  const oppSectionOrder = [firstSectionText, overriddenSectionText];
  const opp = {
    ...mockOpportunity,
    person: {
      recordId: "3",
    } as Client,
    sectionOrder: oppSectionOrder,
  };
  useRootStoreMock.mockReturnValue({
    workflowsStore: {
      ...baseWorkflowsStoreMock,
      selectedSearchIds: ["123"],
      opportunitiesLoaded: () => true,
      hasOpportunities: () => true,
      allOpportunitiesByType: { earlyTermination: [opp] },
      opportunitiesBySection: {
        earlyTermination: {
          [overriddenSectionText]: [opp],
        },
      },
    },
  });

  render(<OpportunityPersonList />);

  expect(
    screen.getByText("1 client may be eligible for early termination")
  ).toBeInTheDocument();

  expect(screen.queryByText(firstSectionText)).not.toBeInTheDocument();
  expect(screen.getByText(overriddenSectionText)).toBeInTheDocument();
});
