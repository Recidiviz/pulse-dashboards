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

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Mock } from "vitest";

import { OpportunityCardInfo } from "~datatypes";

import { useRootStore } from "../../../components/StoreProvider";
import { InsightsSupervisorOpportunityReviewCard } from "../InsightsSupervisorOpportunityReviewCard";

vi.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as Mock;

const trackInsightsSupervisorOpportunityReviewCardClicked = vi.fn();

const opportunityInfo: OpportunityCardInfo = {
  label: "Annual Report Status",
  priority: "NORMAL",
  officersWithRelevantClients: [],
  relevantClientsCount: 3,
  opportunityType: "usTxAnnualReportStatusV2",
  supervisorReviewCounts: { "Pending Approval": 3 },
  urlSection: "AnnualReportStatusV2",
};

function renderCard() {
  render(
    <MemoryRouter>
      <InsightsSupervisorOpportunityReviewCard
        opportunityInfo={opportunityInfo}
        supervisorPseudoId="pSupervisor123"
        supervisorLabel="supervisor"
      />
    </MemoryRouter>,
  );
}

describe("InsightsSupervisorOpportunityReviewCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRootStoreMock.mockReturnValue({
      analyticsStore: {
        trackInsightsSupervisorOpportunityReviewCardClicked,
      },
      userStore: {
        userPseudoId: "pUser123",
      },
      tenantStore: {
        stateCode: "US_TX",
      },
    });
  });

  it("tracks state code, supervisor, opportunity, and user on card click", () => {
    renderCard();

    fireEvent.click(screen.getByRole("link"));

    expect(
      trackInsightsSupervisorOpportunityReviewCardClicked,
    ).toHaveBeenCalledExactlyOnceWith({
      stateCode: "US_TX",
      supervisorPseudonymizedId: "pSupervisor123",
      opportunityType: opportunityInfo.opportunityType,
      viewedBy: "pUser123",
    });
  });

  it("omits viewedBy when the current user has no pseudo ID", () => {
    useRootStoreMock.mockReturnValue({
      analyticsStore: {
        trackInsightsSupervisorOpportunityReviewCardClicked,
      },
      userStore: {
        userPseudoId: undefined,
      },
      tenantStore: {
        stateCode: "US_TX",
      },
    });
    renderCard();

    fireEvent.click(screen.getByRole("link"));

    expect(
      trackInsightsSupervisorOpportunityReviewCardClicked,
    ).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ viewedBy: undefined }),
    );
  });
});
