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
