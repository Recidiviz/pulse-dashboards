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
import { Timestamp } from "firebase/firestore";

import { palette } from "~design-system";

import { CustomTaskRecord } from "../../../../FirestoreStore";
import { CustomTasks } from "../../../../WorkflowsStore/Task/CustomTasks";
import { AddedTaskRow } from "../AddedTaskRow";
import { handleMutationFailure } from "../mutationErrors";

vi.mock("../mutationErrors", () => ({
  handleMutationFailure: vi.fn(),
}));

const handleMutationFailureMock = vi.mocked(handleMutationFailure);

beforeEach(() => {
  handleMutationFailureMock.mockReset();
});

function makeRecord(
  overrides: Partial<CustomTaskRecord> = {},
): CustomTaskRecord {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Default title",
    dueDate: new Date(2026, 5, 1), // June 1, 2026 (local)
    createdOn: new Date("2026-05-14"),
    recurrence: null,
    deletedOn: null,
    stateCode: "us_mo",
    ...overrides,
  };
}

function makeCustomTasksMock(): CustomTasks {
  return {
    toggleCustomTaskCompleted: vi.fn().mockResolvedValue(undefined),
    deleteCustomTask: vi.fn().mockResolvedValue(undefined),
    editCustomTask: vi.fn().mockResolvedValue(undefined),
  } as unknown as CustomTasks;
}

function findKebabButton(): HTMLElement {
  const button = document
    .querySelector(".AddedTaskKebabButton")
    ?.closest("button");
  if (!button) throw new Error("kebab button not found");
  return button as HTMLElement;
}

describe("AddedTaskRow", () => {
  test("renders title, due date, and the kebab", () => {
    render(
      <AddedTaskRow
        task={makeRecord({ title: "Call client" })}
        customTasks={makeCustomTasksMock()}
        isEditing={false}
        onEditStart={vi.fn()}
        onEditEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("Call client")).toBeInTheDocument();
    expect(screen.getByText(/^Due Jun 1, 2026$/)).toBeInTheDocument();
    expect(findKebabButton()).toBeInTheDocument();
  });

  test("non-recurring task does NOT render a Repeats caption", () => {
    render(
      <AddedTaskRow
        task={makeRecord({ recurrence: null })}
        customTasks={makeCustomTasksMock()}
        isEditing={false}
        onEditStart={vi.fn()}
        onEditEnd={vi.fn()}
      />,
    );
    expect(screen.queryByText(/repeats/i)).toBeNull();
  });

  test("recurring task renders a Repeats caption derived from the stored RRULE", () => {
    render(
      <AddedTaskRow
        task={makeRecord({ recurrence: "FREQ=WEEKLY;BYDAY=FR" })}
        customTasks={makeCustomTasksMock()}
        isEditing={false}
        onEditStart={vi.fn()}
        onEditEnd={vi.fn()}
      />,
    );
    expect(screen.getByText(/repeats.*friday/i)).toBeInTheDocument();
  });

  describe("derived completion state for recurring tasks", () => {
    beforeEach(() => {
      // Fake just the Date constructor so React's scheduler timers are
      // untouched. Anchor "now" at Mon Jun 22, 2026.
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 5, 22));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    test("recurring task completed in the current cycle renders as completed and shows the next cycle's date", () => {
      // Weekly on Friday; dueDate = Jun 19; completedOn = Jun 19 17:00.
      // Current cycle (Jun 19) is done; next cycle is Jun 26.
      render(
        <AddedTaskRow
          task={makeRecord({
            id: "task-1",
            dueDate: new Date(2026, 5, 19),
            recurrence: "FREQ=WEEKLY;BYDAY=FR",
            completedOn: new Date(2026, 5, 19, 17),
          })}
          customTasks={makeCustomTasksMock()}
          isEditing={false}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
        />,
      );
      expect(screen.getByRole("checkbox")).toBeChecked();
      expect(screen.getByText(/Due Jun 26, 2026/)).toBeInTheDocument();
    });

    test("recurring task with completedOn from a past cycle auto-resets to incomplete", () => {
      // Weekly on Friday; completedOn = Jun 12 (last week). Today is Jun 22,
      // past the Jun 19 cycle. Task should display incomplete with the most
      // recently passed due date.
      render(
        <AddedTaskRow
          task={makeRecord({
            id: "task-1",
            dueDate: new Date(2026, 5, 12),
            recurrence: "FREQ=WEEKLY;BYDAY=FR",
            completedOn: new Date(2026, 5, 12, 17),
          })}
          customTasks={makeCustomTasksMock()}
          isEditing={false}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
        />,
      );
      expect(screen.getByRole("checkbox")).not.toBeChecked();
      // The "next due" after Jun 12 17:00 is Jun 19; row shows that cycle.
      expect(screen.getByText(/Due Jun 19, 2026/)).toBeInTheDocument();
    });
  });

  test("checks Timestamp-valued dueDate the same as Date-valued", () => {
    render(
      <AddedTaskRow
        task={makeRecord({ dueDate: Timestamp.fromDate(new Date(2026, 5, 1)) })}
        customTasks={makeCustomTasksMock()}
        isEditing={false}
        onEditStart={vi.fn()}
        onEditEnd={vi.fn()}
      />,
    );
    expect(screen.getByText(/Due Jun 1, 2026/)).toBeInTheDocument();
  });

  test("toggling the checkbox calls customTasks.toggleCustomTaskCompleted with the new state", () => {
    const customTasks = makeCustomTasksMock();
    const task = makeRecord({ id: "task-1" });
    render(
      <AddedTaskRow
        task={task}
        customTasks={customTasks}
        isEditing={false}
        onEditStart={vi.fn()}
        onEditEnd={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(customTasks.toggleCustomTaskCompleted).toHaveBeenCalledWith(
      "task-1",
      true,
    );
  });

  test("toggling the checkbox reports on Firestore failure", async () => {
    const customTasks = {
      ...makeCustomTasksMock(),
      toggleCustomTaskCompleted: vi
        .fn()
        .mockRejectedValue(new Error("network")),
    } as unknown as CustomTasks;
    render(
      <AddedTaskRow
        task={makeRecord({ id: "task-1" })}
        customTasks={customTasks}
        isEditing={false}
        onEditStart={vi.fn()}
        onEditEnd={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() =>
      expect(handleMutationFailureMock).toHaveBeenCalledWith(
        "update",
        expect.any(Error),
      ),
    );
  });

  test("renders completed tasks with the muted color treatment", () => {
    render(
      <AddedTaskRow
        task={makeRecord({
          title: "Done",
          completedOn: new Date("2026-05-15"),
        })}
        customTasks={makeCustomTasksMock()}
        isEditing={false}
        onEditStart={vi.fn()}
        onEditEnd={vi.fn()}
      />,
    );
    const title = screen.getByText("Done");
    expect(title).toHaveStyleRule("color", palette.slate70);
  });

  test("clicking Edit task invokes onEditStart", () => {
    const onEditStart = vi.fn();
    render(
      <AddedTaskRow
        task={makeRecord()}
        customTasks={makeCustomTasksMock()}
        isEditing={false}
        onEditStart={onEditStart}
        onEditEnd={vi.fn()}
      />,
    );
    fireEvent.click(findKebabButton());
    fireEvent.click(screen.getByText("Edit task"));
    expect(onEditStart).toHaveBeenCalledTimes(1);
  });

  test("hides the Edit task option for completed tasks", () => {
    render(
      <AddedTaskRow
        task={makeRecord({ completedOn: new Date("2026-05-15") })}
        customTasks={makeCustomTasksMock()}
        isEditing={false}
        onEditStart={vi.fn()}
        onEditEnd={vi.fn()}
      />,
    );
    fireEvent.click(findKebabButton());
    expect(screen.queryByText("Edit task")).not.toBeInTheDocument();
    expect(screen.getByText("Delete task")).toBeInTheDocument();
  });

  test("when isEditing, renders the edit form (instead of the row)", () => {
    render(
      <AddedTaskRow
        task={makeRecord({ title: "Original" })}
        customTasks={makeCustomTasksMock()}
        isEditing
        onEditStart={vi.fn()}
        onEditEnd={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Added task form")).toBeInTheDocument();
    expect(screen.getByLabelText("Task title")).toHaveValue("Original");
  });

  test("saving the edit form calls customTasks.editCustomTask and onEditEnd on success", async () => {
    const customTasks = makeCustomTasksMock();
    const onEditEnd = vi.fn();
    render(
      <AddedTaskRow
        task={makeRecord({
          id: "task-1",
          title: "Old",
          dueDate: new Date(2026, 5, 1),
        })}
        customTasks={customTasks}
        isEditing
        onEditStart={vi.fn()}
        onEditEnd={onEditEnd}
      />,
    );
    fireEvent.change(screen.getByLabelText("Task title"), {
      target: { value: "New title" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(customTasks.editCustomTask).toHaveBeenCalledTimes(1);
    const [taskId, patch] = (customTasks.editCustomTask as any).mock.calls[0];
    expect(taskId).toBe("task-1");
    expect(patch.title).toBe("New title");
    expect(patch.dueDate).toBeInstanceOf(Date);
    // Non-recurring task being edited — recurrence stays null in the patch.
    expect(patch.recurrence).toBeNull();
    await waitFor(() => expect(onEditEnd).toHaveBeenCalledTimes(1));
    expect(handleMutationFailureMock).not.toHaveBeenCalled();
  });

  test("saving the edit form keeps the row in edit mode and reports on Firestore failure", async () => {
    const customTasks = {
      ...makeCustomTasksMock(),
      editCustomTask: vi.fn().mockRejectedValue(new Error("network")),
    } as unknown as CustomTasks;
    const onEditEnd = vi.fn();
    render(
      <AddedTaskRow
        task={makeRecord({ id: "task-1", title: "Old" })}
        customTasks={customTasks}
        isEditing
        onEditStart={vi.fn()}
        onEditEnd={onEditEnd}
      />,
    );
    fireEvent.change(screen.getByLabelText("Task title"), {
      target: { value: "New title" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(handleMutationFailureMock).toHaveBeenCalledWith(
        "save",
        expect.any(Error),
      ),
    );
    expect(onEditEnd).not.toHaveBeenCalled();
  });

  test("editing a recurring task pre-selects the matching chip and round-trips the RRULE", () => {
    const customTasks = makeCustomTasksMock();
    render(
      <AddedTaskRow
        task={makeRecord({
          id: "task-1",
          dueDate: new Date(2026, 5, 19), // Friday
          recurrence: "FREQ=WEEKLY;BYDAY=FR",
        })}
        customTasks={customTasks}
        isEditing
        onEditStart={vi.fn()}
        onEditEnd={vi.fn()}
      />,
    );
    // Open the date popper. The affordance label is the formatted date when
    // a value is present (06/19/2026 for the seeded Friday).
    fireEvent.click(screen.getByRole("button", { name: "06/19/2026" }));
    expect(screen.getByRole("button", { name: "Every week" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    const [, patch] = (customTasks.editCustomTask as any).mock.calls[0];
    expect(patch.recurrence).toContain("FREQ=WEEKLY");
    expect(patch.recurrence).toContain("BYDAY=FR");
  });

  test("cancelling the edit form calls onEditEnd without writing", () => {
    const customTasks = makeCustomTasksMock();
    const onEditEnd = vi.fn();
    render(
      <AddedTaskRow
        task={makeRecord()}
        customTasks={customTasks}
        isEditing
        onEditStart={vi.fn()}
        onEditEnd={onEditEnd}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onEditEnd).toHaveBeenCalledTimes(1);
    expect(customTasks.editCustomTask).not.toHaveBeenCalled();
  });

  describe("delete confirmation", () => {
    test("selecting Delete task swaps the row for a confirm prompt", () => {
      render(
        <AddedTaskRow
          task={makeRecord()}
          customTasks={makeCustomTasksMock()}
          isEditing={false}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
        />,
      );
      fireEvent.click(findKebabButton());
      fireEvent.click(screen.getByText("Delete task"));
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText("Delete this task?")).toBeInTheDocument();
    });

    test("Confirm calls customTasks.deleteCustomTask with the task id", () => {
      const customTasks = makeCustomTasksMock();
      render(
        <AddedTaskRow
          task={makeRecord({ id: "task-1" })}
          customTasks={customTasks}
          isEditing={false}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
        />,
      );
      fireEvent.click(findKebabButton());
      fireEvent.click(screen.getByText("Delete task"));
      fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
      expect(customTasks.deleteCustomTask).toHaveBeenCalledWith("task-1");
    });

    test("Confirm reports on Firestore failure", async () => {
      const customTasks = {
        ...makeCustomTasksMock(),
        deleteCustomTask: vi.fn().mockRejectedValue(new Error("network")),
      } as unknown as CustomTasks;
      render(
        <AddedTaskRow
          task={makeRecord({ id: "task-1" })}
          customTasks={customTasks}
          isEditing={false}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
        />,
      );
      fireEvent.click(findKebabButton());
      fireEvent.click(screen.getByText("Delete task"));
      fireEvent.click(screen.getByRole("button", { name: /confirm/i }));

      await waitFor(() =>
        expect(handleMutationFailureMock).toHaveBeenCalledWith(
          "delete",
          expect.any(Error),
        ),
      );
    });

    test("Cancel returns to the row without deleting", () => {
      const customTasks = makeCustomTasksMock();
      render(
        <AddedTaskRow
          task={makeRecord({ title: "Keep me" })}
          customTasks={customTasks}
          isEditing={false}
          onEditStart={vi.fn()}
          onEditEnd={vi.fn()}
        />,
      );
      fireEvent.click(findKebabButton());
      fireEvent.click(screen.getByText("Delete task"));
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(customTasks.deleteCustomTask).not.toHaveBeenCalled();
      expect(screen.getByText("Keep me")).toBeInTheDocument();
    });
  });
});
