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
import { ReactDatePickerCustomHeaderProps } from "react-datepicker";

import { MonthYearHeader } from "../MonthYearHeader";

function makeHeaderProps(
  overrides: Partial<ReactDatePickerCustomHeaderProps> = {},
): ReactDatePickerCustomHeaderProps {
  return {
    date: new Date(2026, 5, 18),
    changeYear: vi.fn(),
    changeMonth: vi.fn(),
    decreaseMonth: vi.fn(),
    increaseMonth: vi.fn(),
    decreaseYear: vi.fn(),
    increaseYear: vi.fn(),
    prevMonthButtonDisabled: false,
    nextMonthButtonDisabled: false,
    prevYearButtonDisabled: false,
    nextYearButtonDisabled: false,
    customHeaderCount: 0,
    monthDate: new Date(2026, 5, 1),
    ...overrides,
  } as ReactDatePickerCustomHeaderProps;
}

describe("MonthYearHeader", () => {
  test("renders the current year", () => {
    render(<MonthYearHeader {...makeHeaderProps()} />);
    expect(screen.getByText("2026")).toBeVisible();
  });

  test("Previous year button invokes decreaseYear", () => {
    const decreaseYear = vi.fn();
    render(<MonthYearHeader {...makeHeaderProps({ decreaseYear })} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous year" }));
    expect(decreaseYear).toHaveBeenCalledTimes(1);
  });

  test("Next year button invokes increaseYear", () => {
    const increaseYear = vi.fn();
    render(<MonthYearHeader {...makeHeaderProps({ increaseYear })} />);
    fireEvent.click(screen.getByRole("button", { name: "Next year" }));
    expect(increaseYear).toHaveBeenCalledTimes(1);
  });

  test("both buttons expose accessible names", () => {
    render(<MonthYearHeader {...makeHeaderProps()} />);
    expect(screen.getByRole("button", { name: "Previous year" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next year" })).toBeVisible();
  });
});
