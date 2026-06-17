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

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { observable, runInAction } from "mobx";
import React, { Suspense } from "react";

import { CustomTaskRecord } from "../../../../FirestoreStore";
import { Client } from "../../../../WorkflowsStore";
import { CustomTasks } from "../../../../WorkflowsStore/Task/CustomTasks";
import AddedTasksSection from "../AddedTasksSection";
import { handleMutationFailure } from "../mutationErrors";

vi.mock("../mutationErrors", () => ({
  handleMutationFailure: vi.fn(),
}));

const handleMutationFailureMock = vi.mocked(handleMutationFailure);

function makeRecord(
  overrides: Partial<CustomTaskRecord> = {},
): CustomTaskRecord {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Default title",
    dueDate: new Date(2026, 5, 1),
    createdOn: new Date("2026-05-14"),
    recurrence: null,
    deletedOn: null,
    stateCode: "us_mo",
    ...overrides,
  };
}

type CustomTasksMock = {
  hydrate: ReturnType<typeof vi.fn>;
  retry: ReturnType<typeof vi.fn>;
  addCustomTask: ReturnType<typeof vi.fn>;
  editCustomTask: ReturnType<typeof vi.fn>;
  deleteCustomTask: ReturnType<typeof vi.fn>;
  toggleCustomTaskCompleted: ReturnType<typeof vi.fn>;
  hydrationState: CustomTasks["hydrationState"];
  outstandingOrderedTasks: CustomTaskRecord[];
  allOrderedTasks: CustomTaskRecord[];
};

function makeCustomTasksMock(
  overrides: Partial<CustomTasksMock> = {},
): CustomTasksMock {
  return observable(
    {
      hydrate: vi.fn(),
      retry: vi.fn(),
      addCustomTask: vi.fn().mockResolvedValue(undefined),
      editCustomTask: vi.fn().mockResolvedValue(undefined),
      deleteCustomTask: vi.fn().mockResolvedValue(undefined),
      toggleCustomTaskCompleted: vi.fn().mockResolvedValue(undefined),
      hydrationState: { status: "hydrated" } as const,
      outstandingOrderedTasks: [] as CustomTaskRecord[],
      allOrderedTasks: [] as CustomTaskRecord[],
      ...overrides,
    },
    {
      hydrate: false,
      retry: false,
      addCustomTask: false,
      editCustomTask: false,
      deleteCustomTask: false,
      toggleCustomTaskCompleted: false,
    },
  );
}

function makePerson(customTasks: CustomTasksMock | undefined): Client {
  return { customTasks } as unknown as Client;
}

type TinyBoundaryState = { error: unknown };

class TinyBoundary extends React.Component<
  { children: React.ReactNode },
  TinyBoundaryState
> {
  state: TinyBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): TinyBoundaryState {
    return { error };
  }

  render(): React.ReactNode {
    if (this.state.error) return <div role="alert">caught</div>;
    return this.props.children;
  }
}

function renderInBoundary(node: React.ReactElement) {
  return render(
    <TinyBoundary>
      <Suspense fallback={<div data-testid="suspense">loading</div>}>
        {node}
      </Suspense>
    </TinyBoundary>,
  );
}

beforeEach(() => {
  handleMutationFailureMock.mockReset();
});

describe("AddedTasksSection", () => {
  test("renders null when person.customTasks is undefined", () => {
    const { container } = render(
      <AddedTasksSection
        person={makePerson(undefined)}
        showCompleted={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("suspends to the parent Suspense fallback when hydrationState is 'needs hydration'", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "needs hydration" },
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    expect(screen.getByTestId("suspense")).toBeInTheDocument();
  });

  test("suspends to the parent Suspense fallback when hydrationState is 'loading'", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "loading" },
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    expect(screen.getByTestId("suspense")).toBeInTheDocument();
  });

  test("throws to the parent ErrorBoundary when hydrationState is 'failed'", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "failed", error: new Error("boom") },
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("caught");
  });

  test("resumes from Suspense once hydration completes", async () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "loading" },
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    expect(screen.getByTestId("suspense")).toBeInTheDocument();

    runInAction(() => {
      customTasks.hydrationState = { status: "hydrated" };
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /\+ add new task/i }),
      ).toBeInTheDocument(),
    );
  });

  test("renders an empty state and the add CTA when hydrated with no tasks", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      outstandingOrderedTasks: [],
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    expect(screen.getByText(/no added tasks yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /\+ add new task/i }),
    ).toBeInTheDocument();
  });

  test("renders task rows when hydrated with data", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      outstandingOrderedTasks: [
        makeRecord({ id: "a", title: "First" }),
        makeRecord({ id: "b", title: "Second" }),
      ],
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  test("with showCompleted=false renders only outstandingOrderedTasks and hides completed", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      outstandingOrderedTasks: [makeRecord({ id: "a", title: "Outstanding" })],
      allOrderedTasks: [
        makeRecord({ id: "a", title: "Outstanding" }),
        makeRecord({ id: "b", title: "Completed" }),
      ],
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    expect(screen.getByText("Outstanding")).toBeInTheDocument();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();
  });

  test("with showCompleted=true renders allOrderedTasks including completed", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      outstandingOrderedTasks: [makeRecord({ id: "a", title: "Outstanding" })],
      allOrderedTasks: [
        makeRecord({ id: "a", title: "Outstanding" }),
        makeRecord({ id: "b", title: "Completed" }),
      ],
    });
    renderInBoundary(
      <AddedTasksSection person={makePerson(customTasks)} showCompleted />,
    );
    expect(screen.getByText("Outstanding")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  test("clicking '+ Add New Task' opens an inline form and keeps the CTA visible", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      outstandingOrderedTasks: [],
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /\+ add new task/i }));
    expect(screen.getByLabelText("Added task form")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /\+ add new task/i }),
    ).toBeInTheDocument();
  });

  test("clicking '+ Add New Task' twice mounts two independent forms", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      outstandingOrderedTasks: [],
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    const cta = screen.getByRole("button", { name: /\+ add new task/i });
    fireEvent.click(cta);
    fireEvent.click(cta);
    expect(screen.getAllByLabelText("Added task form")).toHaveLength(2);
  });

  test("saving the form calls addCustomTask and closes the form on success", async () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      outstandingOrderedTasks: [],
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /\+ add new task/i }));
    fireEvent.change(screen.getByLabelText("Task title"), {
      target: { value: "New task" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enter Date" }));
    fireEvent.click(screen.getByRole("button", { name: "Next year" }));
    const nextYear = new Date().getFullYear() + 1;
    const nextYearMonth = new Date().toLocaleString("en-US", { month: "long" });
    fireEvent.click(
      screen.getByLabelText(
        new RegExp(`Choose .*${nextYearMonth} 15.*${nextYear}`),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(customTasks.addCustomTask).toHaveBeenCalledTimes(1),
    );
    const arg = customTasks.addCustomTask.mock.calls[0][0];
    expect(arg.title).toBe("New task");
    expect(arg.dueDate).toBeInstanceOf(Date);
    expect(arg.recurrence).toBeNull();

    await waitFor(() =>
      expect(
        screen.queryByLabelText("Added task form"),
      ).not.toBeInTheDocument(),
    );
  });

  test("saving the form leaves the form open and reports on Firestore failure", async () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      outstandingOrderedTasks: [],
      addCustomTask: vi.fn().mockRejectedValue(new Error("network")),
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /\+ add new task/i }));
    fireEvent.change(screen.getByLabelText("Task title"), {
      target: { value: "Doomed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enter Date" }));
    fireEvent.click(screen.getByRole("button", { name: "Next year" }));
    const nextYear = new Date().getFullYear() + 1;
    const nextYearMonth = new Date().toLocaleString("en-US", { month: "long" });
    fireEvent.click(
      screen.getByLabelText(
        new RegExp(`Choose .*${nextYearMonth} 15.*${nextYear}`),
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(handleMutationFailureMock).toHaveBeenCalledTimes(1),
    );
    expect(handleMutationFailureMock).toHaveBeenCalledWith(
      "save",
      expect.any(Error),
    );
    // Form is still open so the user can retry without retyping.
    expect(screen.getByLabelText("Added task form")).toBeInTheDocument();
  });

  test("cancelling the form closes it without calling addCustomTask", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      outstandingOrderedTasks: [],
    });
    renderInBoundary(
      <AddedTasksSection
        person={makePerson(customTasks)}
        showCompleted={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /\+ add new task/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(customTasks.addCustomTask).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /\+ add new task/i }),
    ).toBeInTheDocument();
  });
});
