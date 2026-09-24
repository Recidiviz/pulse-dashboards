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

import { act, render } from "@testing-library/react";
import { observable, runInAction } from "mobx";
import { Mock } from "vitest";

import { useRootStore } from "../../../components/StoreProvider";
import { SupervisionSupervisorOpportunitiesPresenter } from "../../../InsightsStore/presenters/SupervisionSupervisorOpportunitiesPresenter";
import { InsightsSupervisorOpportunityDetailSection } from "../InsightsSupervisorOpportunityDetailSection";

vi.mock("../../../components/StoreProvider");
vi.mock(
  "../../../InsightsStore/presenters/SupervisionSupervisorOpportunitiesPresenter",
);

const useRootStoreMock = useRootStore as Mock;
const PresenterMock =
  SupervisionSupervisorOpportunitiesPresenter as unknown as Mock;

type StubHydrationState = { status: string; error?: Error };

function buildPresenter() {
  return observable(
    {
      hydrationState: { status: "needs hydration" } as StubHydrationState,
      hydrate: vi.fn(),
      populateCaseloadForCurrentReviewer: vi.fn(),
      populateHistoricalCaseloadForCurrentReviewer: vi.fn(),
      opportunitiesDetailsForCardGrid: [],
      opportunitiesDetailsForSupervisorReview: [],
      isWorkflowsEnabled: true,
      isInsightsSupervisorReviewTableEnabled: true,
      showPreviouslyReviewedOpportunities: true,
      supervisorPseudoId: "pSupervisor123",
      labels: {
        supervisionJiiLabel: "client",
        supervisionSupervisorLabel: "supervisor",
        supervisorHasNoOfficersWithEligibleClientsLabel: "Nothing to see",
      },
    },
    {
      hydrate: false,
      populateCaseloadForCurrentReviewer: false,
      populateHistoricalCaseloadForCurrentReviewer: false,
    },
  );
}

describe("InsightsSupervisorOpportunityDetailSection", () => {
  let presenter: ReturnType<typeof buildPresenter>;

  const setHydrationState = (hydrationState: StubHydrationState) =>
    act(() =>
      runInAction(() => {
        presenter.hydrationState = hydrationState;
      }),
    );

  beforeEach(() => {
    vi.clearAllMocks();
    presenter = buildPresenter();
    presenter.hydrate.mockImplementation(() =>
      runInAction(() => {
        presenter.hydrationState = { status: "loading" };
      }),
    );
    PresenterMock.mockImplementation(function () {
      return presenter;
    });
    useRootStoreMock.mockReturnValue({
      insightsStore: {
        supervisionStore: { supervisorPseudoId: "pSupervisor123" },
      },
      workflowsRootStore: {
        justiceInvolvedPersonsStore: {},
        opportunityConfigurationStore: {},
      },
      userStore: { logout: vi.fn() },
    });
  });

  it("populates the reviewer caseloads only once on first hydration", () => {
    render(<InsightsSupervisorOpportunityDetailSection />);

    expect(presenter.hydrate).toHaveBeenCalledOnce();
    expect(presenter.populateCaseloadForCurrentReviewer).not.toHaveBeenCalled();
    expect(
      presenter.populateHistoricalCaseloadForCurrentReviewer,
    ).not.toHaveBeenCalled();

    setHydrationState({ status: "hydrated" });

    expect(presenter.populateCaseloadForCurrentReviewer).toHaveBeenCalledOnce();
    expect(
      presenter.populateHistoricalCaseloadForCurrentReviewer,
    ).toHaveBeenCalledOnce();

    // Unrelated observable changes re-render the section but must not refire the effect
    act(() =>
      runInAction(() => {
        presenter.labels.supervisionJiiLabel = "person";
      }),
    );

    expect(presenter.populateCaseloadForCurrentReviewer).toHaveBeenCalledOnce();
    expect(
      presenter.populateHistoricalCaseloadForCurrentReviewer,
    ).toHaveBeenCalledOnce();
  });

  it("does not populate the reviewer caseloads when hydration fails", () => {
    render(<InsightsSupervisorOpportunityDetailSection />);

    setHydrationState({ status: "failed", error: new Error("oops") });

    expect(presenter.populateCaseloadForCurrentReviewer).not.toHaveBeenCalled();
    expect(
      presenter.populateHistoricalCaseloadForCurrentReviewer,
    ).not.toHaveBeenCalled();
  });

  it("repopulates the reviewer caseloads each time the presenter rehydrates", () => {
    render(<InsightsSupervisorOpportunityDetailSection />);

    setHydrationState({ status: "hydrated" });
    setHydrationState({ status: "loading" });

    expect(presenter.populateCaseloadForCurrentReviewer).toHaveBeenCalledOnce();
    expect(
      presenter.populateHistoricalCaseloadForCurrentReviewer,
    ).toHaveBeenCalledOnce();

    setHydrationState({ status: "hydrated" });

    expect(presenter.populateCaseloadForCurrentReviewer).toHaveBeenCalledTimes(
      2,
    );
    expect(
      presenter.populateHistoricalCaseloadForCurrentReviewer,
    ).toHaveBeenCalledTimes(2);
  });
});
