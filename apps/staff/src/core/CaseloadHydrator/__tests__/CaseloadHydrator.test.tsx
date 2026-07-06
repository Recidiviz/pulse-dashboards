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
import { makeAutoObservable } from "mobx";
import { Mock } from "vitest";

import { HydrationState } from "~hydration-utils";

import { useRootStore } from "../../../components/StoreProvider";
import CaseloadHydrator from "../CaseloadHydrator";

vi.mock("../../../components/StoreProvider");

const useRootStoreMock = useRootStore as Mock;

class FakeSubscription {
  hydrationState: HydrationState = { status: "needs hydration" };

  hydrateCount = 0;

  constructor(public dataSource: object | undefined) {
    makeAutoObservable(this);
  }

  hydrate(): void {
    this.hydrateCount += 1;
    this.hydrationState = { status: "loading" };
    if (this.dataSource) {
      this.hydrationState = { status: "hydrated" };
    } else {
      // no data source: reset to "needs hydration", never reaching a terminal
      // hydrated state — the condition that previously never converged
      this.hydrationState = { status: "needs hydration" };
    }
  }
}

function renderWithSubscriptions(
  subscriptions: FakeSubscription[],
  caseloadPersons: object[] = [],
) {
  const workflowsStore = {
    searchStore: { selectedSearchIds: ["OFFICER1"] },
    caseloadSubscription: subscriptions,
    caseloadPersons,
    caseloadLoaded: () =>
      caseloadPersons.length > 0 || subscriptions.every((s) => !!s.dataSource),
  };
  useRootStoreMock.mockReturnValue({ workflowsStore });

  render(
    <CaseloadHydrator
      initial={<div>initial</div>}
      empty={<div>empty</div>}
      hydrated={<div>hydrated</div>}
    />,
  );

  return workflowsStore;
}

describe("CaseloadHydrator", () => {
  it("does not hydrate (or loop) a subscription with no data source", () => {
    const subscription = new FakeSubscription(undefined);

    renderWithSubscriptions([subscription]);

    expect(subscription.hydrateCount).toBe(0);
  });

  it("hydrates a subscription that has a data source and needs hydration", () => {
    const subscription = new FakeSubscription({ query: "some-query" });

    renderWithSubscriptions([subscription], [{ pseudonymizedId: "p1" }]);

    expect(subscription.hydrateCount).toBe(1);
    expect(subscription.hydrationState.status).toBe("hydrated");
    expect(screen.getByText("hydrated")).toBeInTheDocument();
  });

  it("only hydrates the subscriptions that have a data source", () => {
    const withSource = new FakeSubscription({ query: "some-query" });
    const withoutSource = new FakeSubscription(undefined);

    renderWithSubscriptions([withSource, withoutSource]);

    expect(withSource.hydrateCount).toBe(1);
    expect(withoutSource.hydrateCount).toBe(0);
  });
});
