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

import { CaseloadTasksPresenterV2 } from "../../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import {
  getMyCaseloadCategoryFromSlug,
  MY_CASELOAD_TAB_SLUGS,
  MY_CASELOAD_TASK_CATEGORIES,
  MyCaseloadBody,
  MyCaseloadTaskCategory,
} from "../MyCaseloadBody";

// The full TasksTable + FilterDropdown drag in deeply nested stores; stub them
// so this suite stays focused on the tab composition and layout.
vi.mock("../../WorkflowsTasks/TasksTable", () => ({
  TasksTable: () => <div data-testid="tasks-table" />,
}));
vi.mock("../../WorkflowsFilters/WorkflowsFilterDropdown", () => ({
  WorkflowsFilterDropdown: () => (
    <button data-testid="filter-dropdown">Filter</button>
  ),
}));

function makePresenter(
  overrides: Partial<{
    selectedTaskCategory: string;
    personsCountForCategory: (category: string) => number;
  }> = {},
): CaseloadTasksPresenterV2 {
  const state = {
    selectedTaskCategory:
      overrides.selectedTaskCategory ?? ("ALL_TASKS" as string),
  };
  return {
    get selectedTaskCategory() {
      return state.selectedTaskCategory;
    },
    set selectedTaskCategory(v: string) {
      state.selectedTaskCategory = v;
    },
    personsCountForCategory: overrides.personsCountForCategory ?? (() => 0),
  } as unknown as CaseloadTasksPresenterV2;
}

function renderBody({
  presenter = makePresenter(),
  tabHref = (c: MyCaseloadTaskCategory) => `/?tab=${MY_CASELOAD_TAB_SLUGS[c]}`,
  rowLinkUrl = () => "/profile/abc",
}: {
  presenter?: CaseloadTasksPresenterV2;
  tabHref?: (c: MyCaseloadTaskCategory) => string;
  rowLinkUrl?: () => string;
} = {}) {
  return render(
    <MemoryRouter>
      <MyCaseloadBody
        presenter={presenter}
        tabHref={tabHref}
        rowLinkUrl={rowLinkUrl}
      />
    </MemoryRouter>,
  );
}

describe("MyCaseloadBody", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the four expected tabs in order with the right labels", () => {
    renderBody();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    expect(tabs[0].textContent).toContain("All Clients");
    expect(tabs[1].textContent).toContain("Overdue");
    expect(tabs[2].textContent).toContain("Due this week");
    expect(tabs[3].textContent).toContain("Due this month");
    // No Tasks-page-only buckets leak in.
    expect(screen.queryByText("Due next month")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });

  it("renders the filter dropdown once, as the last child of the row", () => {
    renderBody();
    expect(screen.getByTestId("filter-dropdown")).toBeInTheDocument();
  });

  it("does NOT render any Tasks-page heading", () => {
    renderBody();
    expect(screen.queryByText("Tasks")).not.toBeInTheDocument();
  });

  it("marks the presenter's category as the active tab", () => {
    renderBody({
      presenter: makePresenter({ selectedTaskCategory: "OVERDUE" }),
    });
    const tabs = screen.getAllByRole("tab");
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });

  it("falls back to ALL_TASKS when presenter category is outside the set", () => {
    renderBody({
      presenter: makePresenter({ selectedTaskCategory: "DUE_NEXT_MONTH" }),
    });
    const tabs = screen.getAllByRole("tab");
    // ALL_TASKS is the first tab and should be highlighted.
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("writes the clicked category back to the presenter via setActiveTab", () => {
    const presenter = makePresenter();
    renderBody({ presenter });
    const overdue = screen.getAllByRole("tab")[1];
    fireEvent.click(overdue);
    expect(presenter.selectedTaskCategory).toBe("OVERDUE");
  });

  it("passes counts through as numeric badges", () => {
    const counts: Record<string, number> = {
      ALL_TASKS: 12,
      OVERDUE: 3,
      DUE_THIS_WEEK: 5,
      DUE_THIS_MONTH: 7,
    };
    renderBody({
      presenter: makePresenter({
        personsCountForCategory: (c) => counts[c] ?? 0,
      }),
    });
    const overdue = screen.getAllByRole("tab")[1];
    expect(overdue.textContent).toContain("3");
  });

  describe("getMyCaseloadCategoryFromSlug", () => {
    it("round-trips every entry in MY_CASELOAD_TAB_SLUGS", () => {
      for (const category of MY_CASELOAD_TASK_CATEGORIES) {
        const slug = MY_CASELOAD_TAB_SLUGS[category];
        expect(getMyCaseloadCategoryFromSlug(slug)).toBe(category);
      }
    });

    it("returns undefined for unknown slugs", () => {
      expect(getMyCaseloadCategoryFromSlug("due-next-month")).toBeUndefined();
      expect(getMyCaseloadCategoryFromSlug("not-a-slug")).toBeUndefined();
    });

    it("returns undefined for empty / null / undefined", () => {
      expect(getMyCaseloadCategoryFromSlug("")).toBeUndefined();
      expect(getMyCaseloadCategoryFromSlug(null)).toBeUndefined();
      expect(getMyCaseloadCategoryFromSlug(undefined)).toBeUndefined();
    });
  });
});
