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

import { DndContext } from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import * as StoreProvider from "../../../components/StoreProvider";
import useIsMobile from "../../../hooks/useIsMobile";
import { CaseloadTasksPresenterV2 } from "../../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { ManagedComponent as WorkflowsTasksBodyV2 } from "../WorkflowsTasksBodyV2";

vi.mock("../../../components/StoreProvider");
vi.mock("../../../hooks/useIsMobile");
// The full TasksTable, TableViewToggle, FilterDropdown, etc. drag in deeply
// nested stores. Mock them out — these tests focus on the tab labels.
vi.mock("../TasksTable", () => ({
  TasksTable: () => <div data-testid="tasks-table" />,
}));
vi.mock("../../OpportunityCaseloadView/TableViewToggle", () => ({
  TableViewToggle: () => <div />,
}));
vi.mock("../../WorkflowsFilters/WorkflowsFilterDropdown", () => ({
  WorkflowsFilterDropdown: () => <div />,
}));
vi.mock("../TaskPreviewModal", () => ({
  TaskPreviewModal: () => <div />,
}));
vi.mock("../TasksDescription", () => ({
  TasksDescription: () => <div />,
}));
vi.mock("../TasksList", () => ({
  TasksList: () => <div />,
}));
vi.mock("../../WorkflowsUnderstaffed", () => ({
  WorkflowsUnderstaffedPill: () => null,
}));

function makePresenter(): CaseloadTasksPresenterV2 {
  return {
    displayedTaskCategories: ["ALL_TASKS", "OVERDUE"] as const,
    selectedTaskCategory: "ALL_TASKS",
    showListView: false,
    showRoutePlannerLink: false,
    pageDescriptionMarkdown: "",
    countForCategory: () => 0,
  } as unknown as CaseloadTasksPresenterV2;
}

function renderBody() {
  vi.mocked(useIsMobile).mockReturnValue({
    isMobile: false,
    isTablet: false,
  } as ReturnType<typeof useIsMobile>);
  vi.mocked(StoreProvider.useFeatureVariants).mockReturnValue({});
  return render(
    <MemoryRouter>
      <DndContext>
        <SortableContext
          items={["ALL_TASKS", "OVERDUE"]}
          strategy={horizontalListSortingStrategy}
        >
          <WorkflowsTasksBodyV2 presenter={makePresenter()} />
        </SortableContext>
      </DndContext>
    </MemoryRouter>,
  );
}

describe("WorkflowsTasksBodyV2 (tab labels)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the static TASK_SELECTOR_LABELS (no flag-aware override)", () => {
    renderBody();
    // The Tasks page always uses the canonical "All tasks" label — the
    // MyCaseload-only "All Clients" rename no longer leaks here.
    expect(screen.getByText("All tasks")).toBeInTheDocument();
    expect(screen.queryByText("All Clients")).not.toBeInTheDocument();
  });
});

describe("WorkflowsTasksBodyV2 (tabs render in button mode)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders button-mode tabs (no anchors, no tablist)", () => {
    renderBody();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
