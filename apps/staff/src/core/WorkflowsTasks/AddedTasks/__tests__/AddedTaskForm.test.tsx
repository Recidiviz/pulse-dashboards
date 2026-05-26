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

import { AddedTaskForm } from "../AddedTaskForm";

describe("AddedTaskForm", () => {
  describe("add mode", () => {
    test("renders with empty fields and Save disabled", () => {
      render(<AddedTaskForm mode="add" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(
        screen.getByLabelText("Task title", { selector: "input" }),
      ).toHaveValue("");
      expect(
        screen.getByLabelText("Enter Date", { selector: "input" }),
      ).toHaveValue("");
      expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    });

    test("Save remains disabled when only the title is filled", () => {
      render(<AddedTaskForm mode="add" onSave={vi.fn()} onCancel={vi.fn()} />);
      fireEvent.change(screen.getByLabelText("Task title"), {
        target: { value: "Call client" },
      });
      expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    });

    test("Save remains disabled when only the due date is filled", () => {
      render(<AddedTaskForm mode="add" onSave={vi.fn()} onCancel={vi.fn()} />);
      fireEvent.change(screen.getByLabelText("Enter Date"), {
        target: { value: "2026-07-04" },
      });
      expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    });

    test("Save remains disabled when the title is whitespace-only", () => {
      render(<AddedTaskForm mode="add" onSave={vi.fn()} onCancel={vi.fn()} />);
      fireEvent.change(screen.getByLabelText("Task title"), {
        target: { value: "   " },
      });
      fireEvent.change(screen.getByLabelText("Enter Date"), {
        target: { value: "2026-07-04" },
      });
      expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    });

    test("Save becomes enabled with valid inputs and calls onSave with parsed values", () => {
      const onSave = vi.fn();
      render(<AddedTaskForm mode="add" onSave={onSave} onCancel={vi.fn()} />);

      fireEvent.change(screen.getByLabelText("Task title"), {
        target: { value: "  Call client  " },
      });
      fireEvent.change(screen.getByLabelText("Enter Date"), {
        target: { value: "2026-07-04" },
      });

      const submit = screen.getByRole("button", { name: /^save$/i });
      expect(submit).not.toBeDisabled();
      fireEvent.click(submit);

      expect(onSave).toHaveBeenCalledTimes(1);
      const args = onSave.mock.calls[0][0];
      expect(args.title).toBe("Call client");
      expect(args.dueDate).toBeInstanceOf(Date);
      // Parsed as local midnight on 2026-07-04
      expect(args.dueDate.getFullYear()).toBe(2026);
      expect(args.dueDate.getMonth()).toBe(6); // July, zero-indexed
      expect(args.dueDate.getDate()).toBe(4);
    });

    test("Cancel calls onCancel and does not call onSave", () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      render(<AddedTaskForm mode="add" onSave={onSave} onCancel={onCancel} />);
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("edit mode", () => {
    test("pre-populates fields from initialTitle and initialDueDate", () => {
      render(
        <AddedTaskForm
          mode="edit"
          initialTitle="Send reminder"
          initialDueDate={new Date(2026, 6, 4)}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByLabelText("Task title")).toHaveValue("Send reminder");
      expect(screen.getByLabelText("Enter Date")).toHaveValue("2026-07-04");
      expect(
        screen.getByRole("button", { name: /^save$/i }),
      ).not.toBeDisabled();
    });

    test("submitting edits calls onSave with the updated values", () => {
      const onSave = vi.fn();
      render(
        <AddedTaskForm
          mode="edit"
          initialTitle="Send reminder"
          initialDueDate={new Date(2026, 6, 4)}
          onSave={onSave}
          onCancel={vi.fn()}
        />,
      );
      fireEvent.change(screen.getByLabelText("Task title"), {
        target: { value: "Updated title" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave.mock.calls[0][0].title).toBe("Updated title");
    });
  });
});
