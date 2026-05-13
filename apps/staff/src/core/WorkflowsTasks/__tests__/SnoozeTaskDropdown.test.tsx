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
import { Mock } from "vitest";

import { useFeatureVariants } from "../../../components/StoreProvider";
import { FeatureVariantRecord } from "../../../RootStore/types";
import { SupervisionTask, SupervisionTaskType } from "../../../WorkflowsStore";
import { WorkflowsTasksConfig } from "../../models/types";
import { SnoozeTaskDropdown } from "../SnoozeTaskDropdown";

vi.mock("../../../components/StoreProvider");

const useFeatureVariantsMock = useFeatureVariants as Mock;

function setActiveFeatureVariants(variants: FeatureVariantRecord = {}) {
  useFeatureVariantsMock.mockReturnValue(variants);
}

function makeTask(
  overrides: Partial<SupervisionTask<SupervisionTaskType>> = {},
): SupervisionTask<SupervisionTaskType> {
  return {
    type: "homeVisit" as SupervisionTaskType,
    displayName: "Positive Home Visit",
    isSnoozed: false,
    person: { displayName: "Test Client", pseudonymizedId: "abc" },
    updateSupervisionTask: vi.fn(),
    ...overrides,
  } as unknown as SupervisionTask<SupervisionTaskType>;
}

const taskConfig = {
  snoozeForOptionsInDays: [7, 30, 90],
} as unknown as WorkflowsTasksConfig["tasks"][SupervisionTaskType];

const taskConfigWithForever = {
  snoozeForOptionsInDays: [7, 30, "FOREVER"],
} as unknown as WorkflowsTasksConfig["tasks"][SupervisionTaskType];

function findKebabButton(): HTMLElement {
  const button = document
    .querySelector(".SnoozeTaskDropdownButton")
    ?.closest("button");
  if (!button) throw new Error("kebab button not found");
  return button as HTMLElement;
}

describe("SnoozeTaskDropdown", () => {
  beforeEach(() => {
    setActiveFeatureVariants();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("renders nothing if taskConfig has no snoozeForOptionsInDays", () => {
    const { container } = render(
      <SnoozeTaskDropdown
        task={makeTask()}
        taskConfig={undefined}
        onSelectSnoozeDays={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("clicking a day option always delegates to onSelectSnoozeDays and never writes itself", () => {
    const task = makeTask();
    const onSelectSnoozeDays = vi.fn();
    render(
      <SnoozeTaskDropdown
        task={task}
        taskConfig={taskConfig}
        onSelectSnoozeDays={onSelectSnoozeDays}
      />,
    );
    fireEvent.click(findKebabButton());
    fireEvent.click(screen.getByText("30 days"));
    expect(onSelectSnoozeDays).toHaveBeenCalledWith(30);
    expect(task.updateSupervisionTask).not.toHaveBeenCalled();
  });

  test("snoozed task shows Unhide which calls updateSupervisionTask(undefined) and skips onSelectSnoozeDays", () => {
    const task = makeTask({ isSnoozed: true });
    const onSelectSnoozeDays = vi.fn();
    render(
      <SnoozeTaskDropdown
        task={task}
        taskConfig={taskConfig}
        onSelectSnoozeDays={onSelectSnoozeDays}
      />,
    );
    fireEvent.click(findKebabButton());
    fireEvent.click(screen.getByText("Unhide"));
    expect(task.updateSupervisionTask).toHaveBeenCalledWith(undefined);
    expect(onSelectSnoozeDays).not.toHaveBeenCalled();
  });

  describe("kebab orientation", () => {
    test("renders horizontal when the flag is OFF", () => {
      render(
        <SnoozeTaskDropdown
          task={makeTask()}
          taskConfig={taskConfig}
          onSelectSnoozeDays={vi.fn()}
        />,
      );
      const button = findKebabButton();
      expect(button).toHaveStyleRule("flex-direction", "row");
    });

    test("renders vertical when the flag is ON", () => {
      setActiveFeatureVariants({ taskSnoozeReason: {} });
      render(
        <SnoozeTaskDropdown
          task={makeTask()}
          taskConfig={taskConfig}
          onSelectSnoozeDays={vi.fn()}
        />,
      );
      const button = findKebabButton();
      expect(button).toHaveStyleRule("flex-direction", "column");
    });
  });

  describe("FOREVER (tasksPermasnooze)", () => {
    test("filters FOREVER out of the menu when the flag is OFF", () => {
      render(
        <SnoozeTaskDropdown
          task={makeTask()}
          taskConfig={taskConfigWithForever}
          onSelectSnoozeDays={vi.fn()}
        />,
      );
      expect(screen.getByText("7 days")).toBeInTheDocument();
      expect(screen.getByText("30 days")).toBeInTheDocument();
      expect(screen.queryByText("Forever")).not.toBeInTheDocument();
    });

    test("renders a 'Forever' item when the flag is ON", () => {
      setActiveFeatureVariants({ tasksPermasnooze: {} });
      render(
        <SnoozeTaskDropdown
          task={makeTask()}
          taskConfig={taskConfigWithForever}
          onSelectSnoozeDays={vi.fn()}
        />,
      );
      expect(screen.getByText("Forever")).toBeInTheDocument();
    });

    test("clicking 'Forever' delegates FOREVER to onSelectSnoozeDays", () => {
      setActiveFeatureVariants({ tasksPermasnooze: {} });
      const task = makeTask();
      const onSelectSnoozeDays = vi.fn();
      render(
        <SnoozeTaskDropdown
          task={task}
          taskConfig={taskConfigWithForever}
          onSelectSnoozeDays={onSelectSnoozeDays}
        />,
      );
      fireEvent.click(findKebabButton());
      fireEvent.click(screen.getByText("Forever"));
      expect(onSelectSnoozeDays).toHaveBeenCalledWith("FOREVER");
      expect(task.updateSupervisionTask).not.toHaveBeenCalled();
    });
  });
});
