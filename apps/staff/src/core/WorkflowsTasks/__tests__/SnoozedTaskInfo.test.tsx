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

import { SnoozeInfo, SupervisionTask } from "../../../WorkflowsStore";
import { SnoozedTaskInfo } from "../PreviewTasks";

vi.mock("../../../assets/static/images/stopwatch.svg?react", () => ({
  default: () => <span data-testid="stopwatch-icon" />,
}));

function makeTask(
  options: { snoozeInfo?: SnoozeInfo; isSnoozed?: boolean } = {},
): SupervisionTask {
  return {
    isSnoozed: options.isSnoozed ?? Boolean(options.snoozeInfo),
    snoozeInfo: options.snoozeInfo,
  } as unknown as SupervisionTask;
}

describe("SnoozedTaskInfo", () => {
  test("renders nothing when the task is not snoozed", () => {
    const { container } = render(
      <SnoozedTaskInfo task={makeTask({ isSnoozed: false })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing when snoozeInfo is missing", () => {
    const { container } = render(
      <SnoozedTaskInfo task={makeTask({ isSnoozed: true })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the existing hidden-until / marked-by text without a reason", () => {
    render(
      <SnoozedTaskInfo
        task={makeTask({
          snoozeInfo: {
            snoozedBy: "officer@example.gov",
            snoozedOn: "2026-04-01",
            snoozedUntil: new Date("2026-04-08"),
          },
        })}
      />,
    );
    expect(screen.getByText(/This task is hidden until/)).toBeInTheDocument();
    expect(
      screen.getByText(/Marked as hidden by officer@example\.gov/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Reason:/)).toBeNull();
  });

  test("renders the reason line in addition when snoozeReason is present", () => {
    render(
      <SnoozedTaskInfo
        task={makeTask({
          snoozeInfo: {
            snoozedBy: "officer@example.gov",
            snoozedOn: "2026-04-01",
            snoozedUntil: new Date("2026-04-08"),
            snoozeReason: "Client is currently moving.",
          },
        })}
      />,
    );
    expect(screen.getByText(/This task is hidden until/)).toBeInTheDocument();
    expect(
      screen.getByText("Reason: Client is currently moving."),
    ).toBeInTheDocument();
  });
});
