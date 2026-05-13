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

import { SupervisionTask } from "../../../WorkflowsStore";
import { SnoozeInfo } from "../../../WorkflowsStore/Task/types";
import { SnoozedTaskInfo } from "../PreviewTasks";

function buildTask({
  isSnoozed,
  snoozeInfo,
}: {
  isSnoozed: boolean;
  snoozeInfo: SnoozeInfo | undefined;
}): SupervisionTask {
  return { isSnoozed, snoozeInfo } as unknown as SupervisionTask;
}

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
