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
import { observable } from "mobx";

import { CustomTaskRecord } from "../../../../FirestoreStore";
import { Client } from "../../../../WorkflowsStore";
import { CustomTasks } from "../../../../WorkflowsStore/Task/CustomTasks";
import AddedTasksSection from "../AddedTasksSection";

function makeRecord(
  overrides: Partial<CustomTaskRecord> = {},
): CustomTaskRecord {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Default title",
    dueDate: new Date(2026, 5, 1),
    createdOn: new Date("2026-05-14"),
    deletedOn: null,
    stateCode: "us_mo",
    ...overrides,
  };
}

type CustomTasksMock = {
  hydrate: ReturnType<typeof vi.fn>;
  addCustomTask: ReturnType<typeof vi.fn>;
  editCustomTask: ReturnType<typeof vi.fn>;
  deleteCustomTask: ReturnType<typeof vi.fn>;
  toggleCustomTaskCompleted: ReturnType<typeof vi.fn>;
  hydrationState: CustomTasks["hydrationState"];
  orderedTasks: CustomTaskRecord[];
};

function makeCustomTasksMock(
  overrides: Partial<CustomTasksMock> = {},
): CustomTasksMock {
  return observable(
    {
      hydrate: vi.fn(),
      addCustomTask: vi.fn().mockResolvedValue(undefined),
      editCustomTask: vi.fn().mockResolvedValue(undefined),
      deleteCustomTask: vi.fn().mockResolvedValue(undefined),
      toggleCustomTaskCompleted: vi.fn().mockResolvedValue(undefined),
      hydrationState: { status: "needs hydration" } as const,
      orderedTasks: [] as CustomTaskRecord[],
      ...overrides,
    },
    {
      hydrate: false,
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

describe("AddedTasksSection", () => {
  test("renders null when person.customTasks is undefined", () => {
    const { container } = render(
      <AddedTasksSection person={makePerson(undefined)} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("hydrates the subscription on mount", () => {
    const customTasks = makeCustomTasksMock();
    render(<AddedTasksSection person={makePerson(customTasks)} />);
    expect(customTasks.hydrate).toHaveBeenCalled();
  });

  test("renders the skeleton when hydrationState is 'needs hydration'", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "needs hydration" },
    });
    render(<AddedTasksSection person={makePerson(customTasks)} />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Loading added tasks",
    );
  });

  test("renders the skeleton when hydrationState is 'loading'", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "loading" },
    });
    render(<AddedTasksSection person={makePerson(customTasks)} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("renders the error + retry when hydrationState is 'failed'", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "failed", error: new Error("boom") },
    });
    render(<AddedTasksSection person={makePerson(customTasks)} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Retry resets the call count, then re-invokes hydrate
    customTasks.hydrate.mockClear();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(customTasks.hydrate).toHaveBeenCalledTimes(1);
  });

  test("renders an empty state and the add CTA when hydrated with no tasks", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      orderedTasks: [],
    });
    render(<AddedTasksSection person={makePerson(customTasks)} />);
    expect(screen.getByText(/no added tasks yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /\+ add new task/i }),
    ).toBeInTheDocument();
  });

  test("renders task rows when hydrated with data", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      orderedTasks: [
        makeRecord({ id: "a", title: "First" }),
        makeRecord({ id: "b", title: "Second" }),
      ],
    });
    render(<AddedTasksSection person={makePerson(customTasks)} />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  test("clicking '+ Add New Task' opens an inline form and keeps the CTA visible", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      orderedTasks: [],
    });
    render(<AddedTasksSection person={makePerson(customTasks)} />);
    fireEvent.click(screen.getByRole("button", { name: /\+ add new task/i }));
    expect(screen.getByLabelText("Added task form")).toBeInTheDocument();
    // CTA stays visible so POs can stack multiple in-flight creations.
    expect(
      screen.getByRole("button", { name: /\+ add new task/i }),
    ).toBeInTheDocument();
  });

  test("clicking '+ Add New Task' twice mounts two independent forms", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      orderedTasks: [],
    });
    render(<AddedTasksSection person={makePerson(customTasks)} />);
    const cta = screen.getByRole("button", { name: /\+ add new task/i });
    fireEvent.click(cta);
    fireEvent.click(cta);
    expect(screen.getAllByLabelText("Added task form")).toHaveLength(2);
  });

  test("saving the form calls customTasks.addCustomTask and closes the form", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      orderedTasks: [],
    });
    render(<AddedTasksSection person={makePerson(customTasks)} />);
    fireEvent.click(screen.getByRole("button", { name: /\+ add new task/i }));
    fireEvent.change(screen.getByLabelText("Task title"), {
      target: { value: "New task" },
    });
    fireEvent.change(screen.getByLabelText("Enter Date"), {
      target: { value: "2026-07-04" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(customTasks.addCustomTask).toHaveBeenCalledTimes(1);
    const arg = customTasks.addCustomTask.mock.calls[0][0];
    expect(arg.title).toBe("New task");
    expect(arg.dueDate).toBeInstanceOf(Date);

    // form closed; CTA back
    expect(
      screen.getByRole("button", { name: /\+ add new task/i }),
    ).toBeInTheDocument();
  });

  test("cancelling the form closes it without calling addCustomTask", () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "hydrated" },
      orderedTasks: [],
    });
    render(<AddedTasksSection person={makePerson(customTasks)} />);
    fireEvent.click(screen.getByRole("button", { name: /\+ add new task/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(customTasks.addCustomTask).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /\+ add new task/i }),
    ).toBeInTheDocument();
  });
});
