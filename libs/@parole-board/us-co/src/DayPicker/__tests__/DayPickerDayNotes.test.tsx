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
import { axe } from "jest-axe";

import { DayPicker } from "../DayPicker";

function renderDayPicker(
  props: Pick<Parameters<typeof DayPicker>[0], "renderDayCaption" | "dayNote">,
) {
  return render(
    <DayPicker
      month={{ year: 2026, month: 9 }}
      value="2026-09-15"
      onChange={vi.fn()}
      legend="Day"
      {...props}
    />,
  );
}

describe("DayPicker day captions and notes", () => {
  it("shows a caption only on the days renderDayCaption returns one for", () => {
    renderDayPicker({
      renderDayCaption: (date) => (date === "2026-09-15" ? "Now" : null),
    });

    expect(screen.getByText("Now")).toBeVisible();
    expect(screen.getAllByText("Now")).toHaveLength(1);
    expect(
      screen.getByRole("radio", { name: "September 15 Now" }),
    ).toBeChecked();
  });

  it("adds each day's note to its name without showing it", () => {
    renderDayPicker({
      dayNote: (date) =>
        date === "2026-09-16" ? "already has CCF" : undefined,
    });

    expect(
      screen.getByRole("radio", { name: "September 16 (already has CCF)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "September 17" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations with a caption and a note", async () => {
    const { container } = renderDayPicker({
      renderDayCaption: (date) => (date === "2026-09-15" ? "Now" : null),
      dayNote: (date) =>
        date === "2026-09-16" ? "already has CCF" : undefined,
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
