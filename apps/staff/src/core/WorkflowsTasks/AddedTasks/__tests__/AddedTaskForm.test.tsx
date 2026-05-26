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

// Day 15 of today's month next year — always a valid future date that's
// reachable via one "Next year" click on the calendar header. Stable across
// CI runs (no fixed year that could become "the past").
const FUTURE_DATE = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(15);
  d.setHours(0, 0, 0, 0);
  return d;
})();

const FUTURE_BUTTON_LABEL = formatPickerValue(FUTURE_DATE);

function formatPickerValue(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${date.getFullYear()}`;
}

/**
 * Open the date popper, advance one year, and click day 15 of the visible
 * month. The custom input is a button (Figma 7661-2835), so direct typed
 * entry isn't supported — the user opens the calendar and picks a day,
 * which is what we exercise here.
 */
function pickFutureDate() {
  fireEvent.click(screen.getByRole("button", { name: /enter date/i }));
  fireEvent.click(screen.getByRole("button", { name: "Next year" }));
  const monthName = FUTURE_DATE.toLocaleString("en-US", { month: "long" });
  const dayLabel = new RegExp(
    `Choose .*${monthName} 15.*${FUTURE_DATE.getFullYear()}`,
  );
  fireEvent.click(screen.getByLabelText(dayLabel));
}

describe("AddedTaskForm", () => {
  describe("add mode", () => {
    test("renders with empty fields and Save disabled", () => {
      render(<AddedTaskForm mode="add" onSave={vi.fn()} onCancel={vi.fn()} />);
      expect(
        screen.getByLabelText("Task title", { selector: "input" }),
      ).toHaveValue("");
      // Date affordance shows the "Enter Date" placeholder copy.
      expect(screen.getByRole("button", { name: "Enter Date" })).toBeVisible();
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
      pickFutureDate();
      expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    });

    test("Save remains disabled when the title is whitespace-only", () => {
      render(<AddedTaskForm mode="add" onSave={vi.fn()} onCancel={vi.fn()} />);
      fireEvent.change(screen.getByLabelText("Task title"), {
        target: { value: "   " },
      });
      pickFutureDate();
      expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    });

    test("Save becomes enabled with valid inputs and calls onSave with parsed values", () => {
      const onSave = vi.fn();
      render(<AddedTaskForm mode="add" onSave={onSave} onCancel={vi.fn()} />);

      fireEvent.change(screen.getByLabelText("Task title"), {
        target: { value: "  Call client  " },
      });
      pickFutureDate();

      const submit = screen.getByRole("button", { name: /^save$/i });
      expect(submit).not.toBeDisabled();
      fireEvent.click(submit);

      expect(onSave).toHaveBeenCalledTimes(1);
      const args = onSave.mock.calls[0][0];
      expect(args.title).toBe("Call client");
      expect(args.dueDate).toBeInstanceOf(Date);
      expect(args.dueDate.getFullYear()).toBe(FUTURE_DATE.getFullYear());
      expect(args.dueDate.getMonth()).toBe(FUTURE_DATE.getMonth());
      expect(args.dueDate.getDate()).toBe(15);
    });

    test("Cancel calls onCancel and does not call onSave", () => {
      const onSave = vi.fn();
      const onCancel = vi.fn();
      render(<AddedTaskForm mode="add" onSave={onSave} onCancel={onCancel} />);
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSave).not.toHaveBeenCalled();
    });

    test("clicking the due-date affordance opens the calendar popper", () => {
      const { container } = render(
        <AddedTaskForm mode="add" onSave={vi.fn()} onCancel={vi.fn()} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Enter Date" }));
      expect(container.querySelector(".react-datepicker")).not.toBeNull();
    });
  });

  describe("edit mode", () => {
    test("pre-populates fields from initialTitle and initialDueDate", () => {
      render(
        <AddedTaskForm
          mode="edit"
          initialTitle="Send reminder"
          initialDueDate={FUTURE_DATE}
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByLabelText("Task title")).toHaveValue("Send reminder");
      // The date affordance now renders the formatted date as its label.
      expect(
        screen.getByRole("button", { name: FUTURE_BUTTON_LABEL }),
      ).toBeVisible();
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
          initialDueDate={FUTURE_DATE}
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
