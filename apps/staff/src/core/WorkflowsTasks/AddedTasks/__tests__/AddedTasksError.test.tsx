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

import { CustomTasks } from "../../../../WorkflowsStore/Task/CustomTasks";
import { AddedTasksError } from "../AddedTasksError";

describe("AddedTasksError", () => {
  test("renders an alert role with the error message", () => {
    render(<AddedTasksError />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/couldn’t load added tasks/i)).toBeInTheDocument();
  });

  test("clicking Retry calls customTasks.retry() then resetError()", () => {
    const retry = vi.fn();
    const resetError = vi.fn();
    const customTasks = { retry } as unknown as CustomTasks;

    render(
      <AddedTasksError customTasks={customTasks} resetError={resetError} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(resetError).toHaveBeenCalledTimes(1);
  });

  test("Retry tolerates missing customTasks / resetError", () => {
    render(<AddedTasksError />);
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /retry/i })),
    ).not.toThrow();
  });
});
