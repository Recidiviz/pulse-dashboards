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
import userEvent from "@testing-library/user-event";

import { ReportMonthInput } from "../ReportMonthInput";

describe("ReportMonthInput", () => {
  // The picker opens on the current year when no month is picked.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 10));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Enter Date until a month is picked, then saves the month as YYYY-MM", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ReportMonthInput value={null} onChange={onChange} label="Date" />);

    await user.click(screen.getByRole("button", { name: "Enter Date" }));
    await user.click(screen.getByText("Mar"));

    expect(onChange).toHaveBeenCalledWith("2026-03");
  });

  it("shows the picked month, and clears it to null", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ReportMonthInput value="2015-03" onChange={onChange} label="Date" />,
    );

    expect(
      screen.getByRole("button", { name: "Date: Mar 2015" }),
    ).toHaveTextContent("Mar 2015");
    await user.click(screen.getByRole("button", { name: "Clear Date" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("has no clear button while disabled", () => {
    render(
      <ReportMonthInput
        value="2015-03"
        onChange={vi.fn()}
        label="Date"
        disabled
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Clear Date" }),
    ).not.toBeInTheDocument();
  });
});
