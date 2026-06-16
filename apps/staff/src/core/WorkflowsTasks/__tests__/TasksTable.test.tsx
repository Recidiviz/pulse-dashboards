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
import { addDays, subDays } from "date-fns";
import { MemoryRouter } from "react-router-dom";

import {
  ClientTasksSummary,
  CustomTaskItem,
  SupervisionTask,
} from "../../../WorkflowsStore/Task/types";
import { TasksTable, TasksTablePresenter } from "../TasksTable";

function makeTask(displayName: string, dueDate: Date): SupervisionTask {
  return { displayName, dueDate } as unknown as SupervisionTask;
}

function makeCustomTaskItem(
  overrides: Partial<CustomTaskItem> = {},
): CustomTaskItem {
  return {
    type: "customTask",
    key: "cust-1",
    dueDate: new Date(),
    isOverdue: false,
    isSnoozed: false,
    displayName: "Pickup paperwork",
    frequency: "One-time",
    dueDateFromToday: "today",
    dueDateDisplayLong: "Pickup paperwork due today",
    dueDateDisplayShort: "Due today",
    ...overrides,
  } as unknown as CustomTaskItem;
}

function makeSummary(
  displayName: string,
  tasks: SupervisionTask[],
): ClientTasksSummary {
  return {
    person: { displayName, displayId: "id" } as never,
    tasks,
  };
}

function makePresenter(
  rowEntities: ClientTasksSummary[],
  overrides: Partial<TasksTablePresenter> = {},
): TasksTablePresenter {
  return {
    rowEntitiesForSelectedCategory: rowEntities,
    tasksTableColumns: ["tasks"],
    displayIdHeader: "ID",
    showOneRowPerClient: true,
    selectPerson: vi.fn(),
    shouldHighlightRow: () => false,
    emptyTabText: "No tasks",
    ...overrides,
  } as unknown as TasksTablePresenter;
}

function renderTable(
  rows: ClientTasksSummary[],
  options?: {
    rowLinkUrl?: (entity: ClientTasksSummary) => string;
    selectPerson?: ReturnType<typeof vi.fn>;
  },
) {
  const presenter = makePresenter(
    rows,
    options?.selectPerson
      ? ({
          selectPerson: options.selectPerson,
        } as unknown as Partial<TasksTablePresenter>)
      : {},
  );
  return {
    presenter,
    ...render(
      <MemoryRouter>
        <TasksTable
          presenter={presenter}
          rowLinkUrl={options?.rowLinkUrl as never}
        />
      </MemoryRouter>,
    ),
  };
}

describe("TasksTable empty state", () => {
  it("renders the default EmptyTasksTabView when no renderEmptyState is given", () => {
    const presenter = makePresenter([]);
    render(
      <MemoryRouter>
        <TasksTable presenter={presenter} />
      </MemoryRouter>,
    );
    // EmptyTasksTabView shows presenter.emptyTabText + a contact-support link.
    expect(screen.getByText("No tasks")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /feedback@recidiviz\.org/ }),
    ).toBeInTheDocument();
  });

  it("renders a custom empty state from renderEmptyState when the tab is empty", () => {
    const presenter = makePresenter([]);
    render(
      <MemoryRouter>
        <TasksTable
          presenter={presenter}
          renderEmptyState={() => <div>No clients here</div>}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("No clients here")).toBeInTheDocument();
    // Default copy / support link should NOT render.
    expect(screen.queryByText("No tasks")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /feedback@recidiviz\.org/ }),
    ).not.toBeInTheDocument();
  });

  it("does not call renderEmptyState when the tab has rows", () => {
    const presenter = makePresenter([makeSummary("Doe, J", [])]);
    const renderEmptyState = vi.fn(() => <div>should not show</div>);
    render(
      <MemoryRouter>
        <TasksTable presenter={presenter} renderEmptyState={renderEmptyState} />
      </MemoryRouter>,
    );
    expect(renderEmptyState).not.toHaveBeenCalled();
    expect(screen.queryByText("should not show")).not.toBeInTheDocument();
  });
});

describe("TasksTable tasks column cell rendering", () => {
  it('renders "None" when the row has zero tasks', () => {
    renderTable([makeSummary("Doe, J", [])]);
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("renders one overdue task without a +n suffix", () => {
    const yesterday = subDays(new Date(), 1);
    renderTable([
      makeSummary("Doe, J", [makeTask("Risk Assessment", yesterday)]),
    ]);
    expect(
      screen.getByText(/Risk Assessment due 1 day ago/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it("renders one upcoming task without a +n suffix", () => {
    const inThreeDays = addDays(new Date(), 3);
    renderTable([makeSummary("Doe, J", [makeTask("Home Visit", inThreeDays)])]);
    expect(screen.getByText(/Home Visit due in 3 days/)).toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it('renders the first task plus a "+n more" suffix when there are multiple', () => {
    const t1 = subDays(new Date(), 2);
    const t2 = addDays(new Date(), 1);
    const t3 = addDays(new Date(), 7);
    renderTable([
      makeSummary("Doe, J", [
        makeTask("Risk Assessment", t1),
        makeTask("Home Visit", t2),
        makeTask("Contact", t3),
      ]),
    ]);
    expect(
      screen.getByText(/Risk Assessment due 2 days ago/),
    ).toBeInTheDocument();
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });

  it("renders a custom-task-only client row with title + due copy", () => {
    const inTwoDays = addDays(new Date(), 2);
    renderTable([
      makeSummary("Doe, J", [
        makeCustomTaskItem({
          displayName: "Pickup paperwork",
          dueDate: inTwoDays,
        }) as never,
      ]),
    ]);
    expect(
      screen.getByText(/Pickup paperwork due in 2 days/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/more/)).not.toBeInTheDocument();
  });

  it("renders a mixed-row client showing the earliest-due item first with +n more", () => {
    // Supervision task in 5 days, custom task in 1 day → custom comes first.
    const inOneDay = addDays(new Date(), 1);
    const inFiveDays = addDays(new Date(), 5);
    renderTable([
      makeSummary("Doe, J", [
        makeCustomTaskItem({
          displayName: "Bring tax forms",
          dueDate: inOneDay,
        }) as never,
        makeTask("Home Visit", inFiveDays),
      ]),
    ]);
    expect(
      screen.getByText(/Bring tax forms due in 1 day/),
    ).toBeInTheDocument();
    expect(screen.getByText("+1 more")).toBeInTheDocument();
  });
});

describe("TasksTable row click behavior", () => {
  it("calls presenter.selectPerson when no rowLinkUrl is provided (Tasks page default)", () => {
    const selectPerson = vi.fn();
    const inThreeDays = addDays(new Date(), 3);
    const summary = makeSummary("Doe, J", [
      makeTask("Home Visit", inThreeDays),
    ]);
    renderTable([summary], { selectPerson });

    // Click the row cell.
    fireEvent.click(screen.getByText(/Home Visit due in 3 days/));
    expect(selectPerson).toHaveBeenCalledWith(summary.person);
  });

  it("renders rows as anchors and skips selectPerson when rowLinkUrl is provided", () => {
    const selectPerson = vi.fn();
    const inThreeDays = addDays(new Date(), 3);
    const summary = makeSummary("Doe, J", [
      makeTask("Home Visit", inThreeDays),
    ]);
    renderTable([summary], {
      selectPerson,
      rowLinkUrl: () => "/profile/abc",
    });

    // The row contains anchors pointing to the link URL.
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute(
      "href",
      expect.stringContaining("/profile/abc") as unknown as string,
    );

    // selectPerson is not called on row click in this mode.
    fireEvent.click(screen.getByText(/Home Visit due in 3 days/));
    expect(selectPerson).not.toHaveBeenCalled();
  });
});
