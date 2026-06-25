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
import { axe } from "jest-axe";
import { MemoryRouter, useLocation } from "react-router-dom";

import * as StoreProvider from "../../../components/StoreProvider";
import TasksFilterStore from "../../../FilterStore/TasksFilterStore";
import MyCaseload from "..";
import { MyCaseloadPresenter } from "../MyCaseloadPresenter";

vi.mock("../../../components/StoreProvider");
// CaseloadSelect drags in deep search-store APIs; stub it for these tests.
vi.mock("../../CaseloadSelect", () => ({
  CaseloadSelect: () => (
    <div data-testid="caseload-select">Caseload select</div>
  ),
}));

// PersonLookup reads deep search-store APIs (selectedSearchables / searchPersons)
// and gates its own visibility; its behavior is covered against the real store
// elsewhere, so stub it here to keep this suite focused on the page shell.
vi.mock("../../PersonLookup", () => ({
  PersonLookup: () => <div data-testid="person-lookup">Person lookup</div>,
}));

// Lets each test choose which hydrator branch renders. Defaults to hydrated.
let hydratorBranch: "hydrated" | "loading" = "hydrated";
vi.mock("../../TasksHydrator/TasksHydrator", () => ({
  CaseloadTasksHydrator: ({
    hydrated,
    loading,
  }: {
    hydrated: React.ReactNode;
    loading?: React.ReactNode;
  }) => (hydratorBranch === "loading" ? <>{loading}</> : <>{hydrated}</>),
}));

// The body is exercised via its own test file; keep this suite focused on URL
// ↔ presenter sync, link hrefs, and filter sharing. We mock MyCaseloadBody to
// surface the callbacks (tabHref / rowLinkUrl) as DOM hrefs. The skeleton is
// rendered real so we can assert its loading-branch behavior here.
vi.mock("../MyCaseloadBody", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    MyCaseloadBody: ({
      presenter,
      tabHref,
      rowLinkUrl,
    }: {
      presenter: MyCaseloadPresenter;
      tabHref?: (tab: string) => string;
      rowLinkUrl?: (entity: { person: { profileUrl: string } }) => string;
    }) => (
      <div data-testid="body">
        <div data-testid="active-category">
          {presenter.selectedTaskCategory}
        </div>
        {tabHref && (
          <>
            <a data-testid="tab-overdue-href" href={tabHref("OVERDUE")}>
              Overdue
            </a>
            <a data-testid="tab-all-href" href={tabHref("ALL_TASKS")}>
              All Clients
            </a>
          </>
        )}
        {rowLinkUrl && (
          <a
            data-testid="row-link-href"
            href={rowLinkUrl({
              person: { profileUrl: "/profile/abc-123" },
            } as never)}
          >
            Row
          </a>
        )}
      </div>
    ),
  };
});

const useRootStoreMock = vi.mocked(StoreProvider.useRootStore);
const useFeatureVariantsMock = vi.mocked(StoreProvider.useFeatureVariants);

function setupStoreMock(
  filterStore: TasksFilterStore = {} as TasksFilterStore,
) {
  useFeatureVariantsMock.mockReturnValue({ usMoMyCaseload: {} });
  useRootStoreMock.mockReturnValue({
    workflowsStore: {},
    tenantStore: {},
    analyticsStore: {},
    firestoreStore: {},
    tasksFilterStore: filterStore,
  } as never);
}

function renderApp(initialEntries: string[] = ["/"]) {
  let location: ReturnType<typeof useLocation> | null = null;
  function LocationProbe() {
    location = useLocation();
    return null;
  }
  const utils = render(
    <MemoryRouter initialEntries={initialEntries}>
      <MyCaseload />
      <LocationProbe />
    </MemoryRouter>,
  );
  return { ...utils, getLocation: () => location };
}

// Tracks the last value the shell wrote to `presenter.selectedTaskCategory`.
const lastSetCategory = { value: undefined as string | undefined };

describe("MyCaseload (URL ↔ presenter sync)", () => {
  beforeEach(() => {
    hydratorBranch = "hydrated";
    lastSetCategory.value = undefined;
    vi.spyOn(
      MyCaseloadPresenter.prototype,
      "selectedTaskCategory",
      "set",
    ).mockImplementation(function (_v: string) {
      lastSetCategory.value = _v;
    });
    vi.spyOn(
      MyCaseloadPresenter.prototype,
      "selectedTaskCategory",
      "get",
    ).mockImplementation(function () {
      // Return a non-ALL_TASKS value until something is explicitly selected, so
      // the shell's effect always differs from its ALL_TASKS target and fires
      // the setter — letting us verify it forces ALL_TASKS for missing /
      // unknown slugs.
      return (lastSetCategory.value ?? "DUE_THIS_MONTH") as never;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the page heading and subtitle", () => {
    setupStoreMock();
    renderApp();
    expect(
      screen.getByRole("heading", { level: 1, name: "My Caseload" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Use this list of clients to plan your week and prepare for upcoming touchpoints\./,
      ),
    ).toBeInTheDocument();
  });

  it("renders the caseload selector and the client search bar in the header", () => {
    setupStoreMock();
    renderApp();
    expect(screen.getByTestId("caseload-select")).toBeInTheDocument();
    expect(screen.getByTestId("person-lookup")).toBeInTheDocument();
  });

  it("sets the presenter category from ?tab=overdue on mount", () => {
    setupStoreMock();
    renderApp(["/?tab=overdue"]);
    // The shell's useEffect should write OVERDUE to the presenter setter.
    expect(lastSetCategory.value).toBe("OVERDUE");
  });

  it("defaults the presenter to ALL_TASKS when ?tab= is unknown", () => {
    setupStoreMock();
    renderApp(["/?tab=meeting-this-week"]);
    // Unknown slug → shell falls back to ALL_TASKS rather than the presenter's
    // own first-non-empty default.
    expect(lastSetCategory.value).toBe("ALL_TASKS");
  });

  it("defaults to ALL_TASKS for stale Tasks-page slugs like ?tab=due-next-month", () => {
    setupStoreMock();
    renderApp(["/?tab=due-next-month"]);
    // due-next-month is a Tasks-page category, not a MyCaseload one — the shell
    // treats it as unknown and falls back to ALL_TASKS.
    expect(lastSetCategory.value).toBe("ALL_TASKS");
  });

  it("defaults the presenter to ALL_TASKS when ?tab= is missing", () => {
    setupStoreMock();
    renderApp(["/"]);
    expect(lastSetCategory.value).toBe("ALL_TASKS");
  });

  it("upserts ?tab= into the tab hrefs while preserving other query params", () => {
    setupStoreMock();
    renderApp(["/?tenantId=US_MO&tab=all-clients"]);

    const overdueHref = screen
      .getByTestId("tab-overdue-href")
      .getAttribute("href");
    expect(overdueHref).toContain("tenantId=US_MO");
    expect(overdueHref).toContain("tab=overdue");

    const allHref = screen.getByTestId("tab-all-href").getAttribute("href");
    expect(allHref).toContain("tenantId=US_MO");
    expect(allHref).toContain("tab=all-clients");
  });

  it("uses the bare profile path as the row link target", () => {
    // tenantId + previousPage are now added by the shared `Link` inside
    // CaseloadTable, not by rowLinkUrl — see the Link / CaseloadTable suites.
    setupStoreMock();
    renderApp(["/?tenantId=US_MO"]);
    const rowHref = screen.getByTestId("row-link-href").getAttribute("href");
    expect(rowHref).toBe("/profile/abc-123");
  });

  it("renders the body once the store mock returns a singleton tasksFilterStore", () => {
    // The shell pulls `tasksFilterStore` from RootStore (singleton) and passes
    // it to `MyCaseloadPresenter`. We verify the body renders, which
    // proves construction succeeded with the supplied filter store.
    const filterStore = {} as unknown as TasksFilterStore;
    setupStoreMock(filterStore);
    renderApp(["/"]);
    expect(screen.getByTestId("body")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    setupStoreMock();
    const { container } = renderApp(["/?tab=overdue"]);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("loading branch", () => {
    it("renders the body-shaped skeleton (NOT the generic Loading spinner)", () => {
      hydratorBranch = "loading";
      setupStoreMock();
      renderApp(["/?tab=overdue"]);
      // aria-busy container with tabs — the skeleton, not the generic spinner.
      const busy = screen.getByLabelText("Loading clients");
      expect(busy).toHaveAttribute("aria-busy", "true");
      expect(screen.getAllByRole("tab")).toHaveLength(4);
      // No real body rendered while loading.
      expect(screen.queryByTestId("body")).not.toBeInTheDocument();
    });

    it("highlights the URL-derived tab in the skeleton", () => {
      hydratorBranch = "loading";
      setupStoreMock();
      renderApp(["/?tab=overdue"]);
      const tabs = screen.getAllByRole("tab");
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    it("defaults the skeleton's active tab to ALL_TASKS when ?tab= is missing", () => {
      hydratorBranch = "loading";
      setupStoreMock();
      renderApp(["/"]);
      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    });

    it("keeps the skeleton tabs clickable and updates the URL ?tab= on click", () => {
      hydratorBranch = "loading";
      setupStoreMock();
      const { getLocation } = renderApp(["/?tenantId=US_MO"]);
      const overdue = screen.getAllByRole("tab")[1];
      fireEvent.click(overdue);
      const loc = getLocation();
      expect(loc?.search).toContain("tab=overdue");
      expect(loc?.search).toContain("tenantId=US_MO");
    });
  });
});
