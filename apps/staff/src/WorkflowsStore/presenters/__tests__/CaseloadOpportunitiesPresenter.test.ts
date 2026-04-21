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

import { OpportunityType } from "~datatypes";
import { HydrationState } from "~hydration-utils";

import { JusticeInvolvedPerson } from "../../types";
import { WorkflowsStore } from "../../WorkflowsStore";
import { CaseloadOpportunitiesPresenter } from "../CaseloadOpportunitiesPresenter";

let workflowsStore: WorkflowsStore;
let presenter: CaseloadOpportunitiesPresenter;

const MOCK_OPPORTUNITY_TYPES = [
  "type1",
  "type2",
] as unknown as OpportunityType[];

beforeAll(() => {
  workflowsStore = {
    searchStore: {
      selectedSearchIds: ["id1", "id2"],
      workflowsSearchFieldTitle: "Search Title",
    },
    selectedOpportunityType: MOCK_OPPORTUNITY_TYPES[0],
    opportunityTypes: MOCK_OPPORTUNITY_TYPES,
    allOpportunitiesByType: {
      [MOCK_OPPORTUNITY_TYPES[0]]: [],
      [MOCK_OPPORTUNITY_TYPES[1]]: [],
    },
    justiceInvolvedPersonTitle: "Title",
    caseloadPersons: [],
    hasOpportunities: vi.fn(),
    hydrationState: vi.fn(),
  } as unknown as WorkflowsStore;
  presenter = new CaseloadOpportunitiesPresenter(workflowsStore);
});

it("returns selected search ids from workflowsStore", () => {
  expect(presenter.selectedSearchIds).toEqual(
    workflowsStore.searchStore.selectedSearchIds,
  );
});

it("returns selected opportunity type from workflowsStore", () => {
  expect(presenter.opportunityType).toBe(
    workflowsStore.selectedOpportunityType,
  );
});

it("returns active opportunity types from workflowsStore", () => {
  expect(presenter.activeOpportunityTypes).toEqual(
    workflowsStore.opportunityTypes,
  );
});

it("returns opportunities by type from workflowsStore", () => {
  expect(presenter.opportunitiesByType).toEqual(
    workflowsStore.allOpportunitiesByType,
  );
});

it("returns labels from workflowsStore", () => {
  expect(presenter.labels).toEqual({
    justiceInvolvedPersonTitle: "Title",
    workflowsSearchFieldTitle: "Search Title",
  });
});

describe("populateCaseloads", () => {
  const testThreshold = 3;
  let testPersons: JusticeInvolvedPerson[];

  const createMockPerson = (
    oppCount: number,
    alreadyHydrated = false,
    hydrateMock: any = undefined,
  ) => {
    return {
      opportunityManager: {
        hydrationState: alreadyHydrated
          ? { status: "hydrated" }
          : { status: "needs hydration" },
        incomingOpportunityTypes: Array(oppCount).fill("oppType"),
        hydrate: vi.fn().mockReturnValue(hydrateMock),
      },
    } as unknown as JusticeInvolvedPerson;
  };

  const setCaseloadPersons = (persons: JusticeInvolvedPerson[]) => {
    vi.spyOn(
      // @ts-ignore protected property
      presenter.workflowsStore,
      "caseloadPersons",
      "get",
    ).mockReturnValue(persons);
  };

  beforeEach(() => {
    vi.spyOn(presenter, "oppHydrationThreshold", "get").mockReturnValue(
      testThreshold,
    );
  });

  it("does nothing when all persons are already hydrated", async () => {
    const hydratedPerson1 = createMockPerson(1, true);
    const hydratedPerson2 = createMockPerson(2, true);
    testPersons = [hydratedPerson1, hydratedPerson2];
    setCaseloadPersons(testPersons);

    await presenter.populateCaseloads();

    testPersons.map((p) =>
      expect(p.opportunityManager.hydrate).not.toHaveBeenCalled(),
    );
  });

  it("skips already-hydrated persons", async () => {
    const hydratedPerson = createMockPerson(1, true);
    const unhydratedPerson = createMockPerson(1);
    setCaseloadPersons([hydratedPerson, unhydratedPerson]);

    await presenter.populateCaseloads();

    expect(hydratedPerson.opportunityManager.hydrate).not.toHaveBeenCalled();
    expect(unhydratedPerson.opportunityManager.hydrate).toHaveBeenCalledOnce();
  });

  it("hydrates all persons even when opp threshold is not reached", async () => {
    // Total opp count doesn't hit threshold
    testPersons = [createMockPerson(1), createMockPerson(1)];
    setCaseloadPersons(testPersons);

    await presenter.populateCaseloads();

    testPersons.map((p) =>
      expect(p.opportunityManager.hydrate).toHaveBeenCalledOnce(),
    );
  });

  it("resolves hydration batch by batch", async () => {
    // set up promise resolution mocks
    let resolveBatch1!: () => void;
    const batch1Promise = new Promise<void>((resolve) => {
      resolveBatch1 = resolve;
    });

    // P0 and P1 will hydrate in initial batch (their opp count hits threshold)
    // P2 will hydrate in final batch.
    const p0 = createMockPerson(2, false, batch1Promise);
    const p1 = createMockPerson(2, false, batch1Promise);
    const p2 = createMockPerson(1);
    setCaseloadPersons([p0, p1, p2]);

    const caseloadHydration = presenter.populateCaseloads();

    // batch 2 does not kick off while batch 1 is still pending
    expect(p0.opportunityManager.hydrate).toHaveBeenCalledOnce();
    expect(p1.opportunityManager.hydrate).toHaveBeenCalledOnce();
    expect(p2.opportunityManager.hydrate).not.toHaveBeenCalled();

    // resolve batch 1 promises
    resolveBatch1();

    // wait for final batch to run
    await caseloadHydration;

    expect(p2.opportunityManager.hydrate).toHaveBeenCalledOnce();
  });
});

describe("compositeHydrationState for caseload opportunities presenter", () => {
  const statuses = {
    needsHydration: { status: "needs hydration" },
    loading: { status: "loading" },
    failed: { status: "failed", error: new Error("test") },
    hydrated: { status: "hydrated" },
  } satisfies Record<string, HydrationState>;

  vi.spyOn(
    CaseloadOpportunitiesPresenter.prototype,
    "isDebug",
    "get",
  ).mockReturnValue(false);

  const assignWorkflowsStoreAndCaseloadPersonsOpportunityManager = (
    hydrationState: HydrationState,
    otherHydrationState: HydrationState,
  ) => {
    // @ts-ignore protected method
    vi.spyOn(presenter.workflowsStore, "hydrationState", "get").mockReturnValue(
      hydrationState,
    );
    vi.spyOn(
      // @ts-ignore protected method
      presenter.workflowsStore,
      "caseloadPersons",
      "get",
    ).mockReturnValue([
      {
        opportunityManager: {
          hydrationState: otherHydrationState,
        },
      },
    ] as JusticeInvolvedPerson[]);
  };

  test.each([
    [statuses.needsHydration, statuses.needsHydration],
    [statuses.needsHydration, statuses.loading],
    [statuses.needsHydration, statuses.hydrated],
  ])("needs hydration (args %s + %s)", (hydrationStateA, hydrationStateB) => {
    assignWorkflowsStoreAndCaseloadPersonsOpportunityManager(
      hydrationStateA,
      hydrationStateB,
    );
    expect(presenter.hydrationState).toEqual({
      status: "needs hydration",
    });

    assignWorkflowsStoreAndCaseloadPersonsOpportunityManager(
      hydrationStateA,
      hydrationStateB,
    );
    expect(presenter.hydrationState).toEqual({
      status: "needs hydration",
    });
  });

  test.each([
    [statuses.loading, statuses.loading],
    [statuses.loading, statuses.hydrated],
  ])("loading (args %s + %s)", (hydrationStateA, hydrationStateB) => {
    assignWorkflowsStoreAndCaseloadPersonsOpportunityManager(
      hydrationStateA,
      hydrationStateB,
    );
    expect(presenter.hydrationState).toEqual({ status: "loading" });

    assignWorkflowsStoreAndCaseloadPersonsOpportunityManager(
      hydrationStateA,
      hydrationStateB,
    );
    expect(presenter.hydrationState).toEqual({ status: "loading" });
  });

  test.each([
    [statuses.failed, statuses.failed],
    [statuses.failed, statuses.loading],
    [statuses.failed, statuses.hydrated],
    [statuses.failed, statuses.needsHydration],
  ])("failed (args %s + %s)", (hydrationStateA, hydrationStateB) => {
    assignWorkflowsStoreAndCaseloadPersonsOpportunityManager(
      hydrationStateA,
      hydrationStateB,
    );
    expect(presenter.hydrationState).toEqual({
      status: "failed",
      error: expect.any(Error),
    });

    assignWorkflowsStoreAndCaseloadPersonsOpportunityManager(
      hydrationStateA,
      hydrationStateB,
    );
    expect(presenter.hydrationState).toEqual({
      status: "failed",
      error: expect.any(Error),
    });
  });

  test("hydrated", () => {
    assignWorkflowsStoreAndCaseloadPersonsOpportunityManager(
      statuses.hydrated,
      statuses.hydrated,
    );
    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
  });
});
