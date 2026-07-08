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

import * as StoreProvider from "../../../components/StoreProvider";
import useIsMobile from "../../../hooks/useIsMobile";
import { SupervisionTask } from "../../../WorkflowsStore";
import { SnoozeInfo } from "../../../WorkflowsStore/Task/types";
import { JusticeInvolvedPerson } from "../../../WorkflowsStore/types";
import {
  isSnoozeReasonRequired,
  PreviewTasks,
  SnoozedTaskInfo,
} from "../PreviewTasks";

vi.mock("../../../components/StoreProvider");
vi.mock("../../../hooks/useIsMobile");

function buildTask({
  isSnoozed,
  snoozeInfo,
}: {
  isSnoozed: boolean;
  snoozeInfo: SnoozeInfo | undefined;
}): SupervisionTask {
  return { isSnoozed, snoozeInfo } as unknown as SupervisionTask;
}

// Minimal task shape sufficient for the TaskPreviewV2 render path. The snooze
// dropdown short-circuits to null because tasksConfig is undefined.
function buildPreviewTask({
  displayName,
  isSnoozed,
}: {
  displayName: string;
  isSnoozed: boolean;
}): SupervisionTask {
  return {
    key: displayName,
    type: displayName,
    displayName,
    isSnoozed,
    isOverdue: false,
    snoozeInfo: undefined,
    additionalDetails: "",
    dueDateDisplayShort: "in 1 day",
    contactWindow: "",
    frequency: "monthly",
    supplementaryContacts: [],
    futureScheduledContacts: [],
    person: { supervisionTasks: { tasksConfig: undefined } },
  } as unknown as SupervisionTask;
}

// Build a person whose supervisionTasks exposes both orderedTasks (all tasks,
// including snoozed) and readyOrderedTasks (non-snoozed only), mirroring
// TasksBase.
function buildPerson(tasks: SupervisionTask[]): JusticeInvolvedPerson {
  return {
    supervisionTasks: {
      orderedTasks: tasks,
      readyOrderedTasks: tasks.filter((task) => !task.isSnoozed),
      needs: [],
    },
  } as unknown as JusticeInvolvedPerson;
}

function mockStores() {
  vi.mocked(useIsMobile).mockReturnValue({
    isMobile: false,
    isTablet: false,
  } as ReturnType<typeof useIsMobile>);
  vi.mocked(StoreProvider.useFeatureVariants).mockReturnValue({});
  vi.mocked(StoreProvider.useRootStore).mockReturnValue({
    workflowsStore: { isUsIdLegacyTasksEnabled: false },
  } as unknown as ReturnType<typeof StoreProvider.useRootStore>);
}

describe("isSnoozeReasonRequired", () => {
  test("never requires a reason when the threshold is unset", () => {
    expect(isSnoozeReasonRequired(30, undefined)).toBe(false);
    expect(isSnoozeReasonRequired("FOREVER", undefined)).toBe(false);
  });

  test("requires a reason only for durations over the threshold", () => {
    expect(isSnoozeReasonRequired(7, 7)).toBe(false);
    expect(isSnoozeReasonRequired(30, 7)).toBe(true);
    expect(isSnoozeReasonRequired(90, 7)).toBe(true);
  });

  test("always requires a reason for permanent snoozes", () => {
    expect(isSnoozeReasonRequired("FOREVER", 7)).toBe(true);
  });
});

describe("SnoozedTaskInfo", () => {
  test("renders nothing when the task is not snoozed", () => {
    const { container } = render(
      <SnoozedTaskInfo
        task={buildTask({ isSnoozed: false, snoozeInfo: undefined })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing when snoozeInfo is missing", () => {
    const { container } = render(
      <SnoozedTaskInfo
        task={buildTask({ isSnoozed: true, snoozeInfo: undefined })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the 'hidden until <date>' copy for numeric snoozes", () => {
    const task = buildTask({
      isSnoozed: true,
      snoozeInfo: {
        snoozedBy: "officer@example.com",
        snoozedOn: "2026-05-01",
        snoozedUntil: new Date("2026-05-31"),
      },
    });
    render(<SnoozedTaskInfo task={task} />);

    expect(
      screen.getByText(
        (text) =>
          text.startsWith("This task is hidden until ") &&
          text.includes("officer@example.com"),
      ),
    ).toBeInTheDocument();
  });

  test("renders the 'hidden permanently' copy when snoozedUntil is FOREVER", () => {
    const task = buildTask({
      isSnoozed: true,
      snoozeInfo: {
        snoozedBy: "officer@example.com",
        snoozedOn: "2026-05-01",
        snoozedUntil: "FOREVER",
      },
    });
    render(<SnoozedTaskInfo task={task} />);

    const node = screen.getByText((text) =>
      text.startsWith("This task is hidden permanently."),
    );
    expect(node).toBeInTheDocument();
    expect(node.textContent).toContain("officer@example.com");
    expect(node.textContent).not.toMatch(/hidden until/);
  });
});

describe("PreviewTasks (hideSnoozed)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const readyTask = buildPreviewTask({
    displayName: "Ready Task",
    isSnoozed: false,
  });
  const snoozedTask = buildPreviewTask({
    displayName: "Snoozed Task",
    isSnoozed: true,
  });

  test("renders snoozed tasks by default (no hideSnoozed prop)", () => {
    mockStores();
    render(
      <PreviewTasks
        person={buildPerson([readyTask, snoozedTask])}
        showSnoozeDropdown={false}
      />,
    );

    expect(screen.getByText("Ready Task")).toBeInTheDocument();
    expect(screen.getByText("Snoozed Task")).toBeInTheDocument();
  });

  test("excludes snoozed tasks when hideSnoozed is true", () => {
    mockStores();
    render(
      <PreviewTasks
        person={buildPerson([readyTask, snoozedTask])}
        showSnoozeDropdown={false}
        hideSnoozed
      />,
    );

    expect(screen.getByText("Ready Task")).toBeInTheDocument();
    expect(screen.queryByText("Snoozed Task")).not.toBeInTheDocument();
  });
});
