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

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { observable, runInAction } from "mobx";
import React from "react";

import { Client } from "../../../../WorkflowsStore";
import { CustomTasks } from "../../../../WorkflowsStore/Task/CustomTasks";
import AddedTasks from "../index";

type CustomTasksMock = {
  hydrate: ReturnType<typeof vi.fn>;
  retry: ReturnType<typeof vi.fn>;
  hydrationState: CustomTasks["hydrationState"];
  orderedTasks: never[];
  addCustomTask: ReturnType<typeof vi.fn>;
  editCustomTask: ReturnType<typeof vi.fn>;
  deleteCustomTask: ReturnType<typeof vi.fn>;
  toggleCustomTaskCompleted: ReturnType<typeof vi.fn>;
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
      orderedTasks: [] as never[],
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

function makeClient(customTasks: CustomTasksMock | undefined): Client {
  return { customTasks } as unknown as Client;
}

const renderShell = (body: React.ReactNode) => (
  <>
    <h2>Added Tasks</h2>
    {body}
  </>
);

describe("AddedTasks container", () => {
  test("renders the heading + Suspense fallback while the section is loading", async () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "loading" },
    });

    render(
      <AddedTasks client={makeClient(customTasks)} renderShell={renderShell} />,
    );

    // Suspense fallback is the section's skeleton.
    await waitFor(
      () =>
        expect(
          screen.getByRole("status", { name: /loading added tasks/i }),
        ).toBeInTheDocument(),
      { timeout: 5000 },
    );
    expect(screen.getByText("Added Tasks")).toBeInTheDocument();
  });

  test("renders the heading + AddedTasksError when hydration fails", async () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "failed", error: new Error("boom") },
    });

    render(
      <AddedTasks client={makeClient(customTasks)} renderShell={renderShell} />,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument(), {
      timeout: 5000,
    });
    expect(screen.getByText("Added Tasks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  test("clicking Retry from the failed fallback calls customTasks.retry()", async () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "failed", error: new Error("boom") },
    });

    render(
      <AddedTasks client={makeClient(customTasks)} renderShell={renderShell} />,
    );

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument(), {
      timeout: 5000,
    });

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    });

    expect(customTasks.retry).toHaveBeenCalledTimes(1);
  });

  test("renders the section once hydration completes", async () => {
    const customTasks = makeCustomTasksMock({
      hydrationState: { status: "loading" },
    });

    render(
      <AddedTasks client={makeClient(customTasks)} renderShell={renderShell} />,
    );

    await waitFor(
      () => expect(screen.getByRole("status")).toBeInTheDocument(),
      { timeout: 5000 },
    );

    runInAction(() => {
      customTasks.hydrationState = { status: "hydrated" };
    });

    await waitFor(
      () =>
        expect(
          screen.getByRole("button", { name: /\+ add new task/i }),
        ).toBeInTheDocument(),
      { timeout: 5000 },
    );
  });
});
