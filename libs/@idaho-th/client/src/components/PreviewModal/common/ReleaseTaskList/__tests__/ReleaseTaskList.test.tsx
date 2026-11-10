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
import userEvent from "@testing-library/user-event";

import {
  RELEASE_TASK_DATE_INVALID_ERROR,
  RELEASE_TASK_DETAILS,
  ReleaseTaskOwnerRole,
} from "~@idaho-th/shared";

import { ReleaseTaskList } from "../ReleaseTaskList";
import { buildReleaseTaskDetails } from "../ReleaseTaskList.utils";
import type { ReleaseTaskDetailUpdate, ReleaseTaskRow } from "../types";

const DATE_LABEL = "Date bed is available";
const BED_DAY = new Date("2026-11-05T00:00:00Z");

const renderList = ({
  viewerRole = ReleaseTaskOwnerRole.PROVIDER,
  bedDate = null,
  bedCompleted = false,
  onDetailChange = vi.fn(),
}: {
  viewerRole?: ReleaseTaskOwnerRole;
  bedDate?: Date | null;
  bedCompleted?: boolean;
  onDetailChange?: (taskType: string, detail: ReleaseTaskDetailUpdate) => void;
} = {}) => {
  const tasks: ReleaseTaskRow[] = [
    { taskType: "BED_CONFIRMED", completed: bedCompleted, date: bedDate },
  ];
  render(
    <ReleaseTaskList
      tasks={tasks}
      viewerRole={viewerRole}
      disabled={false}
      isToggling={false}
      onToggle={vi.fn()}
      details={buildReleaseTaskDetails(tasks, {
        viewerRole,
        canToggle: true,
        onChange: onDetailChange,
      })}
    />,
  );
  return { onDetailChange };
};

const typeDate = (value: string) =>
  fireEvent.change(screen.getByLabelText(DATE_LABEL), { target: { value } });

beforeEach(() => {
  // Frozen so "today" and the calendar's month never depend on the wall clock.
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date("2026-10-30T18:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ReleaseTaskList bed available date", () => {
  it("renders a date field only for the date task", () => {
    renderList();

    expect(screen.getAllByLabelText(DATE_LABEL)).toHaveLength(1);
    expect(screen.getByLabelText(DATE_LABEL)).toHaveAttribute(
      "placeholder",
      "When is the bed available?",
    );
  });

  it("saves a fully typed date once, as yyyy-MM-dd", () => {
    const { onDetailChange } = renderList();

    typeDate("11/0");
    expect(onDetailChange).not.toHaveBeenCalled();

    typeDate("11/05/2026");
    expect(onDetailChange).toHaveBeenCalledExactlyOnceWith("BED_CONFIRMED", {
      type: "date",
      date: "2026-11-05",
    });
  });

  it("saves a date picked from the calendar, including past days", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { onDetailChange } = renderList();

    await user.click(screen.getByLabelText(DATE_LABEL));

    expect(
      await screen.findByRole("gridcell", { name: /October 20th, 2026/ }),
    ).not.toHaveAttribute("aria-disabled", "true");

    await user.click(
      screen.getByRole("gridcell", { name: /October 20th, 2026/ }),
    );
    expect(onDetailChange).toHaveBeenCalledExactlyOnceWith("BED_CONFIRMED", {
      type: "date",
      date: "2026-10-20",
    });
  });

  it("saves null when a saved date is cleared", () => {
    const { onDetailChange } = renderList({ bedDate: BED_DAY });

    typeDate("");

    expect(onDetailChange).toHaveBeenCalledExactlyOnceWith("BED_CONFIRMED", {
      type: "date",
      date: null,
    });
  });

  it("saves a typed past date", () => {
    const { onDetailChange } = renderList();

    typeDate("10/20/2026");

    expect(onDetailChange).toHaveBeenCalledExactlyOnceWith("BED_CONFIRMED", {
      type: "date",
      date: "2026-10-20",
    });
  });

  it("rejects an impossible typed date without saving it", () => {
    const { onDetailChange } = renderList();

    typeDate("02/31/2026");

    expect(screen.getByRole("alert")).toHaveTextContent(
      RELEASE_TASK_DATE_INVALID_ERROR,
    );
    expect(onDetailChange).not.toHaveBeenCalled();
  });

  describe("for a case manager", () => {
    const originalTz = process.env["TZ"];

    beforeAll(() => {
      // West of UTC, where a UTC-midnight day would render a day early.
      process.env["TZ"] = "America/Boise";
    });

    afterAll(() => {
      process.env["TZ"] = originalTz;
    });

    it("shows the provider's date read-only, on the day they entered", () => {
      renderList({ viewerRole: ReleaseTaskOwnerRole.STAFF, bedDate: BED_DAY });

      expect(screen.queryByLabelText(DATE_LABEL)).not.toBeInTheDocument();
      expect(
        screen.getByText("Bed available: November 5, 2026"),
      ).toBeInTheDocument();
    });

    it("says when the provider has not provided a date", () => {
      renderList({ viewerRole: ReleaseTaskOwnerRole.STAFF });

      expect(
        screen.getByText(
          "The Provider has not provided a bed available date yet.",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("when the date is required", () => {
    const bedDetail = RELEASE_TASK_DETAILS.BED_CONFIRMED;
    if (!bedDetail) throw new Error("BED_CONFIRMED has no detail definition");

    beforeEach(() => {
      bedDetail.required = true;
    });

    afterEach(() => {
      bedDetail.required = false;
    });

    it("disables the checkbox with a hint until the date is entered", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderList();

      const checkbox = screen.getByRole("checkbox", { name: "Bed Confirmed" });
      expect(checkbox).toBeDisabled();

      await user.hover(checkbox);
      expect(
        await screen.findByText("Enter the date bed is available first."),
      ).toBeInTheDocument();
    });

    it("keeps a completed task uncheckable even without a date", () => {
      renderList({ bedCompleted: true });

      expect(
        screen.getByRole("checkbox", { name: "Bed Confirmed" }),
      ).toBeEnabled();
    });
  });
});
