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

import { DatePickerHeader } from "../DatePickerHeader";

// react-datepicker passes a lot of fields to renderCustomHeader; the header
// component only reads a handful, so we synthesise just those.
function makeHeaderProps(
  overrides: Partial<ReactDatePickerCustomHeaderProps> = {},
): ReactDatePickerCustomHeaderProps {
  return {
    date: new Date(2026, 5, 18), // June 18, 2026
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

describe("DatePickerHeader", () => {
  test("renders the current month name and year", () => {
    render(<DatePickerHeader {...makeHeaderProps()} />);
    expect(screen.getByText("June 2026")).toBeVisible();
  });

  test("Previous month button invokes decreaseMonth", () => {
    const decreaseMonth = vi.fn();
    render(<DatePickerHeader {...makeHeaderProps({ decreaseMonth })} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(decreaseMonth).toHaveBeenCalledTimes(1);
  });

  test("Next month button invokes increaseMonth", () => {
    const increaseMonth = vi.fn();
    render(<DatePickerHeader {...makeHeaderProps({ increaseMonth })} />);
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(increaseMonth).toHaveBeenCalledTimes(1);
  });

  test("Next year caret invokes changeYear(year + 1)", () => {
    const changeYear = vi.fn();
    render(<DatePickerHeader {...makeHeaderProps({ changeYear })} />);
    fireEvent.click(screen.getByRole("button", { name: "Next year" }));
    expect(changeYear).toHaveBeenCalledWith(2027);
  });

  test("Previous year caret invokes changeYear(year - 1)", () => {
    const changeYear = vi.fn();
    render(<DatePickerHeader {...makeHeaderProps({ changeYear })} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous year" }));
    expect(changeYear).toHaveBeenCalledWith(2025);
  });

  test("all four icon buttons expose accessible names", () => {
    render(<DatePickerHeader {...makeHeaderProps()} />);
    expect(
      screen.getByRole("button", { name: "Previous month" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Next month" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Previous year" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Next year" })).toBeVisible();
  });
});
