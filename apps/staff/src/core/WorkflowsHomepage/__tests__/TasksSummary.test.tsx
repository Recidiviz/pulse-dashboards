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
import { addDays, subDays } from "date-fns";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";

import type { SupervisionTask } from "../../../WorkflowsStore/Task/types";
import { TasksSummary } from "../TasksSummary";

vi.mock("../../../components/StoreProvider", () => ({
  useRootStore: () => ({ tenantStore: { currentTenantId: "US_TN" } }),
}));

function task(overrides: Partial<SupervisionTask> = {}): SupervisionTask {
  return {
    person: { recordId: `p${Math.random()}`, fullName: {} },
    isOverdue: false,
    dueDate: addDays(new Date(), 3),
    ...overrides,
  } as unknown as SupervisionTask;
}

function renderSummary(props: Parameters<typeof TasksSummary>[0]) {
  return render(
    <BrowserRouter>
      <TasksSummary {...props} />
    </BrowserRouter>,
  );
}

describe("with counts available", () => {
  test("states how many clients have tasks", () => {
    renderSummary({
      tasks: [
        task({ isOverdue: true }),
        task({ dueDate: subDays(new Date(), 1) }),
      ],
    });

    expect(screen.getByText(/clients have tasks/i)).toBeInTheDocument();
  });

  test("shows the overdue count", () => {
    renderSummary({ tasks: [task({ isOverdue: true })] });

    expect(screen.getByText(/Overdue Tasks: 1/)).toBeInTheDocument();
  });
});

// TODO(OBT-52494): temporary. This whole block goes away when the counts come
// back.
describe("with counts unavailable", () => {
  // Set under the Typesense homepage gate, where the caseload these count from
  // is empty by design rather than because the officer has nothing to do.
  const props = { tasks: [] as SupervisionTask[], countsUnavailable: true };

  test("still renders the card, so the route to tasks survives", () => {
    renderSummary(props);

    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      expect.stringContaining("tasks"),
    );
  });

  test("never claims zero clients have tasks", () => {
    // THE point. "0 clients have tasks" is wrong AND reassuring, which is worse
    // than saying nothing — an officer would read it as "nothing to do".
    renderSummary(props);

    expect(screen.queryByText(/0 clients have tasks/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/client has tasks/i)).not.toBeInTheDocument();
  });

  test("shows no status counts", () => {
    renderSummary(props);

    expect(screen.queryByText(/Overdue Tasks/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Upcoming Tasks/)).not.toBeInTheDocument();
  });

  test("suppresses the counts even when tasks are present", () => {
    // The flag wins over the data. Otherwise a partially-populated caseload
    // would render a number that is real but not the whole caseload's.
    renderSummary({
      tasks: [task({ isOverdue: true }), task({ isOverdue: true })],
      countsUnavailable: true,
    });

    expect(screen.queryByText(/Overdue Tasks/)).not.toBeInTheDocument();
    expect(screen.queryByText(/clients have tasks/i)).not.toBeInTheDocument();
  });
});
