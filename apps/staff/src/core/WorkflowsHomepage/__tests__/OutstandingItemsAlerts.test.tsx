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
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

import { OpportunityType } from "~datatypes";

import { Opportunity } from "../../../WorkflowsStore";
import { OutstandingItemsAlerts } from "../OutstandingItemsAlerts";
import { summaryFromCounts, summaryFromOpportunities } from "../summaryData";

const OPPORTUNITY_TYPE = "usNeGoodTimeRestoration" as OpportunityType;

const CONFIG = {
  label: "Good Time Restoration",
  urlSection: "goodTimeRestoration",
  submittedTabTitle: "Pending",
  pendingOverdueDaysThreshold: 14,
  eligibleNotViewedDaysThreshold: 14,
  tabGroups: {
    "ELIGIBILITY STATUS": ["Eligible Now"],
  },
};

// The component reads config from the store; see OutstandingItemsAlerts.
vi.mock("../../../components/StoreProvider", () => ({
  useOpportunityConfigurations: () => ({ [OPPORTUNITY_TYPE]: CONFIG }),
}));

type MockOppOverrides = Partial<
  Pick<Opportunity, "isPendingOverdue" | "isEligibleStaleViewed">
>;

function mockOpp(overrides: MockOppOverrides = {}): Opportunity {
  return {
    type: OPPORTUNITY_TYPE,
    isPendingOverdue: false,
    isEligibleStaleViewed: false,
    tabTitle: () => "Eligible Now",
    ...overrides,
    config: CONFIG,
  } as unknown as Opportunity;
}

function renderAlerts(opportunities: Opportunity[]) {
  return render(
    <BrowserRouter>
      <OutstandingItemsAlerts
        opportunityTypes={[OPPORTUNITY_TYPE]}
        summaryByType={{
          [OPPORTUNITY_TYPE]: summaryFromOpportunities(opportunities),
        }}
      />
    </BrowserRouter>,
  );
}

describe("OutstandingItemsAlerts", () => {
  it("renders nothing when no opportunities match either criterion", () => {
    const { container } = renderAlerts([mockOpp(), mockOpp()]);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the type has no summary at all", () => {
    const { container } = render(
      <BrowserRouter>
        <OutstandingItemsAlerts
          opportunityTypes={[OPPORTUNITY_TYPE]}
          summaryByType={{}}
        />
      </BrowserRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a pending-overdue entry when any opportunity is pending overdue", () => {
    renderAlerts([
      mockOpp({ isPendingOverdue: true }),
      mockOpp({ isPendingOverdue: true }),
      mockOpp(),
    ]);

    expect(screen.getByText(/^2 clients have been/)).toBeInTheDocument();
    expect(
      screen.getByText(/Good Time Restoration for over 2 weeks/),
    ).toBeInTheDocument();
  });

  it("uses singular copy for a count of 1", () => {
    renderAlerts([mockOpp({ isPendingOverdue: true })]);

    expect(screen.getByText(/^1 client has been/)).toBeInTheDocument();
  });

  it("renders an eligible-but-not-viewed entry when any opportunity is stale", () => {
    renderAlerts([mockOpp({ isEligibleStaleViewed: true })]);

    expect(
      screen.getByRole("link", {
        name: /^1 client has been Eligible for Good Time Restoration but not viewed for over 2 weeks$/,
      }),
    ).toBeInTheDocument();
  });

  it("renders both entries when both criteria hit in the same type", () => {
    renderAlerts([
      mockOpp({ isPendingOverdue: true }),
      mockOpp({ isPendingOverdue: true }),
      mockOpp({ isEligibleStaleViewed: true }),
    ]);

    expect(
      screen.getByRole("link", {
        name: /^2 clients have been Pending Good Time Restoration for over 2 weeks$/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /^1 client has been Eligible for Good Time Restoration but not viewed for over 2 weeks$/,
      }),
    ).toBeInTheDocument();
  });

  it("deep-links to the configured Submitted tab for the pending-overdue entry", () => {
    renderAlerts([mockOpp({ isPendingOverdue: true })]);

    const link = screen.getByRole("link", { name: /been Pending/i });
    expect(link).toHaveAttribute("href", "/workflows/goodTimeRestoration");
  });

  it('deep-links to "Eligible Now" for the eligible-stale entry', () => {
    renderAlerts([mockOpp({ isEligibleStaleViewed: true })]);

    const link = screen.getByRole("link", { name: /been Eligible/i });
    expect(link).toHaveAttribute("href", "/workflows/goodTimeRestoration");
  });
});

describe("with an alerts prop — the Typesense homepage", () => {
  function renderWithCounts(
    alertsByType: Record<
      string,
      { eligibleStale: number; pendingOverdue: number }
    >,
  ) {
    return render(
      <BrowserRouter>
        <OutstandingItemsAlerts
          opportunityTypes={[OPPORTUNITY_TYPE]}
          summaryByType={{
            [OPPORTUNITY_TYPE]: summaryFromCounts(
              {},
              [],
              alertsByType[OPPORTUNITY_TYPE],
            ),
          }}
        />
      </BrowserRouter>,
    );
  }

  it("renders both rows from counts alone, with no opportunities", () => {
    renderWithCounts({
      [OPPORTUNITY_TYPE]: { eligibleStale: 5, pendingOverdue: 3 },
    });

    expect(screen.getByText(/5 clients have been/)).toBeInTheDocument();
    expect(screen.getByText(/3 clients have been/)).toBeInTheDocument();
  });

  it("renders nothing when both counts are zero", () => {
    const { container } = renderWithCounts({
      [OPPORTUNITY_TYPE]: { eligibleStale: 0, pendingOverdue: 0 },
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the row that has a count", () => {
    renderWithCounts({
      [OPPORTUNITY_TYPE]: { eligibleStale: 0, pendingOverdue: 2 },
    });

    expect(screen.getByText(/2 clients have been/)).toBeInTheDocument();
    expect(screen.queryByText(/not viewed for over/)).not.toBeInTheDocument();
  });
});
