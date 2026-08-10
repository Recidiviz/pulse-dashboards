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
import { format, subYears } from "date-fns";

import { MonthYearPicker } from "../MonthYearPicker";

describe("MonthYearPicker", () => {
  const noop = () => {
    // intentionally empty for tests that don't assert on this callback
  };

  it("renders the calendar inline with year navigation and a month grid, no text input", () => {
    render(<MonthYearPicker selected={null} onChange={noop} />);

    expect(
      screen.getByRole("button", { name: "Previous year" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next year" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows the current year by default, with no month selected", () => {
    render(<MonthYearPicker selected={null} onChange={noop} />);

    expect(
      screen.getByText(String(new Date().getFullYear())),
    ).toBeInTheDocument();
    expect(
      document.querySelector(".react-datepicker__month-text--selected"),
    ).not.toBeInTheDocument();
  });

  it("calls onChange with the picked month/year", () => {
    const onChange = vi.fn();
    render(<MonthYearPicker selected={null} onChange={onChange} />);

    const currentMonthLabel = format(new Date(), "MMM");
    fireEvent.click(screen.getByText(currentMonthLabel));

    expect(onChange).toHaveBeenCalled();
    const [calledWithDate] = onChange.mock.calls[0];
    expect(calledWithDate.getMonth()).toBe(new Date().getMonth());
    expect(calledWithDate.getFullYear()).toBe(new Date().getFullYear());
  });

  it("disables navigating to years before minDate", () => {
    const today = new Date();
    render(
      <MonthYearPicker
        selected={null}
        onChange={noop}
        minDate={subYears(today, 5)}
        maxDate={today}
      />,
    );

    const prevYearButton = screen.getByRole("button", {
      name: "Previous year",
    });
    for (let i = 0; i < 8 && !prevYearButton.hasAttribute("disabled"); i++) {
      fireEvent.click(prevYearButton);
    }

    expect(prevYearButton).toBeDisabled();
  });
});
