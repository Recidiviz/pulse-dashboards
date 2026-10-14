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

import { describe, expect, test, vi } from "vitest";

import type { OpportunityType } from "~datatypes";

import type { OpportunityConfigurationStore } from "../../Opportunity/OpportunityConfigurations/OpportunityConfigurationStore";
import type { WorkflowsStore } from "../../WorkflowsStore";
import { WorkflowsHomepagePresenter } from "../WorkflowsHomepagePresenter";

const LSU_TYPE = "usTnLSU" as OpportunityType;

/**
 * Only the slice the gate reads. Deliberately partial, because the point of
 * several cases below is what happens when the store cannot answer.
 *
 * The two-flag condition itself is tested on `SearchStore`, which owns it.
 */
function makePresenter(store: Record<string, unknown>) {
  return new WorkflowsHomepagePresenter(
    store as unknown as WorkflowsStore,
    {} as OpportunityConfigurationStore,
  );
}

/** A manager stub, since the presenter reaches through to it under the gate. */
function managerWith(state: Record<string, unknown> = {}) {
  return {
    opportunitySearchManager: {
      countsByType: {},
      totalsByType: {},
      ...state,
    },
  };
}

describe("useTypesenseHomepage", () => {
  test("follows the store's answer", () => {
    const on = makePresenter({
      searchStore: { ...managerWith(), isTypesenseHomepageEnabled: true },
    });
    const off = makePresenter({
      searchStore: { ...managerWith(), isTypesenseHomepageEnabled: false },
    });

    expect(on.useTypesenseHomepage).toBe(true);
    expect(off.useTypesenseHomepage).toBe(false);
  });

  test.each([
    ["a searchStore that cannot answer", { searchStore: {} }],
    ["no searchStore at all", {}],
  ])("is off with %s", (_label, store) => {
    // THE default direction. Defaulting the other way would move a tenant onto
    // the new read path because a store was partly constructed — silently, and
    // without anyone enabling a flag.
    expect(makePresenter(store).useTypesenseHomepage).toBe(false);
  });
});

describe("summaryByType", () => {
  function store(gateOn: boolean) {
    return {
      searchStore: {
        isTypesenseHomepageEnabled: gateOn,
        opportunitySearchManager: {
          countsByType: { usTnLSU: { "Eligible Now": 4, Denied: 2 } },
          totalsByType: { usTnLSU: 4 },
          peopleByType: {},
          alertsByType: {},
        },
      },
    };
  }

  test("comes from the search manager under the gate", () => {
    const summary = makePresenter(store(true)).summaryByType[LSU_TYPE];

    expect(summary?.tabCounts).toEqual({ "Eligible Now": 4, Denied: 2 });
    // The manager's own total, NOT the 6 the tabs sum to: the census already
    // dropped the denied pair, the way `countOpportunities` would.
    expect(summary?.totalCount).toBe(4);
  });

  test("ignores the manager off the gate, however populated it is", () => {
    // The manager carries data here on purpose: the gate decides the source,
    // not whether one happens to be available.
    expect(makePresenter(store(false)).summaryByType).toEqual({});
  });
});

describe("the header copy under the gate", () => {
  /** The store slice `ctaAndHeaderText` reads, with a caseload selected. */
  function store(countsByType: Record<string, Record<string, number>>) {
    return {
      searchStore: {
        isTypesenseHomepageEnabled: true,
        // Implied by the homepage gate, which requires both flags.
        isTypesenseSearchEnabled: true,
        opportunitySearchManager: { countsByType },
        selectedSearchIds: ["OFFICER_1"],
        searchTypeOverride: undefined,
        workflowsSearchFieldTitle: "officer",
      },
      activeSystem: "INCARCERATION",
      opportunityTypes: ["usNeGoodTimeRestoration"],
      // No tasks, so `showTasksSummary` is false and the "no results" copy is
      // reachable — which is exactly when a wrong answer becomes visible.
      hasSupervisionTasks: false,
      systemConfigFor: () => ({ search: [{ searchTitle: "facility" }] }),
      user: { info: { givenNames: "Sam" } },
      rootStore: {
        userStore: { canUserAccessTasks: false },
        tenantStore: { currentTenantConfig: { navigation: { workflows: [] } } },
      },
    };
  }

  const configs = {
    opportunities: {
      usNeGoodTimeRestoration: {
        label: "Good Time Restoration",
        tabGroups: {
          "ELIGIBILITY STATUS": ["Eligible Now", "Almost Eligible"],
        },
      },
    },
  } as unknown as OpportunityConfigurationStore;

  function presenterFor(counts: Record<string, Record<string, number>>) {
    return new WorkflowsHomepagePresenter(
      store(counts) as unknown as WorkflowsStore,
      configs,
    );
  }

  test("does NOT claim there are no opportunities when counts exist", () => {
    // THE bug. `opportunitiesByType` is empty by design under the gate, so
    // reading it here asserted "none of the selected caseloads have eligible
    // opportunities" over a page full of them.
    const presenter = presenterFor({
      usNeGoodTimeRestoration: { "Eligible Now": 14 },
    });

    const { headerText, ctaText } = presenter.ctaAndHeaderText;
    expect(`${headerText ?? ""} ${ctaText ?? ""}`).not.toMatch(/None of the/);
  });

  test("still says so when every count is empty", () => {
    const presenter = presenterFor({});
    const { headerText, ctaText } = presenter.ctaAndHeaderText;

    expect(`${headerText ?? ""} ${ctaText ?? ""}`).toMatch(/None of the/);
  });

  test("ignores counts on tabs the card does not render", () => {
    // Mirrors `hasDisplayableOpportunities`, which filters to the first tab
    // group. A count parked on "Other" shows the user nothing.
    const presenter = presenterFor({
      usNeGoodTimeRestoration: { Other: 9 },
    });
    const { headerText, ctaText } = presenter.ctaAndHeaderText;

    expect(`${headerText ?? ""} ${ctaText ?? ""}`).toMatch(/None of the/);
  });
});

describe("refreshCounts", () => {
  function managerSpy() {
    const search = vi.fn();
    return { search, countsByType: {}, peopleByType: {}, alertsByType: {} };
  }

  test("re-runs the search under the gate", () => {
    // Called on every mount of the homepage; see `refreshCounts`.
    const manager = managerSpy();
    makePresenter({
      searchStore: {
        isTypesenseHomepageEnabled: true,
        opportunitySearchManager: manager,
      },
    }).refreshCounts();

    expect(manager.search).toHaveBeenCalledTimes(1);
  });

  test("does nothing off the gate", () => {
    // The Firestore path re-renders from the person's own subscription; a
    // search here would be a request for counts nothing reads.
    const manager = managerSpy();
    makePresenter({
      searchStore: {
        isTypesenseHomepageEnabled: false,
        opportunitySearchManager: manager,
      },
    }).refreshCounts();

    expect(manager.search).not.toHaveBeenCalled();
  });
});

describe("what the presenter hands the components", () => {
  function presenter(state: Record<string, unknown>) {
    return makePresenter({
      searchStore: {
        isTypesenseHomepageEnabled: true,
        opportunitySearchManager: {
          countsByType: {},
          peopleByType: {},
          alertsByType: {},
          ...state,
        },
      },
    });
  }

  test("people and alerts come from the manager under the gate", () => {
    const p = presenter({
      countsByType: { usTnLSU: { "Eligible Now": 1 } },
      peopleByType: { usTnLSU: [{ recordId: "r1" }] },
      alertsByType: { usTnLSU: { eligibleStale: 2, pendingOverdue: 1 } },
    });

    expect(p.summaryByType[LSU_TYPE]?.people).toEqual([{ recordId: "r1" }]);
    expect(p.summaryByType[LSU_TYPE]?.alerts).toEqual({
      eligibleStale: 2,
      pendingOverdue: 1,
    });
  });
});

describe("hasOpportunities under the gate", () => {
  // It gates the ENTIRE summaries block in WorkflowsHomepage.
  function presenterWith(countsByType: Record<string, Record<string, number>>) {
    return new WorkflowsHomepagePresenter(
      {
        searchStore: {
          isTypesenseHomepageEnabled: true,
          opportunitySearchManager: { countsByType },
        },
      } as unknown as WorkflowsStore,
      {
        opportunities: {
          usNeGoodTimeRestoration: {
            tabGroups: { "ELIGIBILITY STATUS": ["Eligible Now"] },
          },
        },
      } as unknown as OpportunityConfigurationStore,
    );
  }

  test("is true when a displayable tab has a count", () => {
    expect(
      presenterWith({ usNeGoodTimeRestoration: { "Eligible Now": 3 } })
        .hasOpportunities,
    ).toBe(true);
  });

  test("is false with no counts at all", () => {
    expect(presenterWith({}).hasOpportunities).toBe(false);
  });

  test("is false when the only counts sit on undisplayed tabs", () => {
    expect(
      presenterWith({ usNeGoodTimeRestoration: { Other: 7 } }).hasOpportunities,
    ).toBe(false);
  });
});

describe("tasks under the typesenseHomepage gate", () => {
  const OFFICER_SEARCH = { search: [{ searchField: ["officerId"] }] };
  const DISTRICT_SEARCH = {
    search: [{ searchField: ["officerId"] }, { searchField: ["district"] }],
  };
  const supervisionSearch = (config: unknown) => () => config;

  const gated = {
    searchStore: { ...managerWith(), isTypesenseHomepageEnabled: true },
    activeSystem: "SUPERVISION",
    systemConfigFor: supervisionSearch(OFFICER_SEARCH),
    hasSupervisionTasks: true,
    rootStore: {
      userStore: { canUserAccessTasks: true },
      tenantStore: {
        currentTenantConfig: { navigation: { workflows: ["tasks"] } },
      },
    },
  };

  test("hydrate, because the caseload is still fetched from Firestore", () => {
    expect(makePresenter(gated).shouldHydrateTasks).toBe(true);
  });

  test("and the card renders with its real counts", () => {
    expect(makePresenter(gated).showTasksSummary).toBe(true);
  });

  test("but NOT for a search that selects anything other than officers", () => {
    // THE boundary. A task record is keyed by `officerId`, so a district
    // selection cannot produce a task caseload.
    const presenter = makePresenter({
      ...gated,
      systemConfigFor: supervisionSearch(DISTRICT_SEARCH),
    });

    expect(presenter.shouldHydrateTasks).toBe(false);
  });

  test('and YES while the active system is "ALL"', () => {
    // A multi-system tenant lands here whenever the officer has not narrowed
    // to one system, and `activeSystemConfig` is undefined in that state.
    const presenter = makePresenter({ ...gated, activeSystem: "ALL" });

    expect(presenter.shouldHydrateTasks).toBe(true);
    expect(presenter.showTasksSummary).toBe(true);
  });

  test('but still NO while the active system is "INCARCERATION"', () => {
    const presenter = makePresenter({
      ...gated,
      activeSystem: "INCARCERATION",
    });

    expect(presenter.shouldHydrateTasks).toBe(false);
  });

  test("and not when the caseload reports no tasks", () => {
    const presenter = makePresenter({ ...gated, hasSupervisionTasks: false });

    expect(presenter.showTasksSummary).toBe(false);
  });

  test("and not when the tenant has no tasks at all", () => {
    const presenter = makePresenter({
      ...gated,
      rootStore: {
        ...gated.rootStore,
        tenantStore: { currentTenantConfig: { navigation: { workflows: [] } } },
      },
    });

    expect(presenter.showTasksSummary).toBe(false);
  });

  test("with the gate off, the search type does not matter", () => {
    const presenter = makePresenter({
      ...gated,
      systemConfigFor: supervisionSearch(DISTRICT_SEARCH),
      searchStore: { ...managerWith(), isTypesenseHomepageEnabled: false },
    });

    expect(presenter.shouldHydrateTasks).toBe(true);
  });
});
