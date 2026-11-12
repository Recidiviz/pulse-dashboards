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
import { axe } from "jest-axe";
import { useState } from "react";

import type { CalendarMonthRef, CalendarWeekday } from "~@parole-board/common";

import { isAllowedDay } from "../../model/isAllowedDay";
import { DayPicker, type DayPickerProps } from "../DayPicker";

const SEPTEMBER_2026: CalendarMonthRef = { year: 2026, month: 9 };

const MONDAY_TO_FRIDAY: CalendarWeekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

const weekendsDisabled = (date: string) =>
  !isAllowedDay(date, MONDAY_TO_FRIDAY);

function ControlledDayPicker({
  initial = null,
  onChange,
  ...props
}: Partial<DayPickerProps> & { initial?: string | null }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <button type="button">Before</button>
      <DayPicker
        month={SEPTEMBER_2026}
        legend="Day"
        {...props}
        value={value}
        onChange={(date) => {
          setValue(date);
          onChange?.(date);
        }}
      />
    </>
  );
}

describe("DayPicker", () => {
  it.each([
    [{ year: 2026, month: 9 }, 30, "September 30"],
    [{ year: 2027, month: 2 }, 28, "February 28"],
    [{ year: 2028, month: 2 }, 29, "February 29"],
  ])("shows one tile per day of %o", (month, count, lastName) => {
    render(<ControlledDayPicker month={month} />);

    const days = screen.getAllByRole("radio");
    expect(days).toHaveLength(count);
    expect(days.at(-1)).toHaveAccessibleName(lastName);
  });

  it("names each tile with the month and day while showing only the number", () => {
    render(<ControlledDayPicker />);

    const day = screen.getByRole("radio", { name: "September 14" });
    expect(day).toHaveAttribute("value", "2026-09-14");
    expect(screen.getByText("14")).toBeVisible();
    expect(screen.getByRole("radiogroup", { name: "Day" })).toBeInTheDocument();
  });

  it("names the group with a visible label when labelledBy is set", () => {
    render(
      <>
        <span id="day-label">Day of the hearing</span>
        <ControlledDayPicker labelledBy="day-label" />
      </>,
    );

    expect(
      screen.getByRole("radiogroup", { name: "Day of the hearing" }),
    ).toBeInTheDocument();
  });

  it("checks the day in value and reports a new choice as YYYY-MM-DD", async () => {
    const onChange = vi.fn();
    render(<ControlledDayPicker initial="2026-09-16" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: "September 16" })).toBeChecked();

    await userEvent.click(screen.getByRole("radio", { name: "September 4" }));

    expect(onChange).toHaveBeenCalledWith("2026-09-04");
    expect(screen.getByRole("radio", { name: "September 4" })).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "September 16" }),
    ).not.toBeChecked();
  });

  it("checks nothing when value is null", () => {
    render(<ControlledDayPicker />);

    for (const day of screen.getAllByRole("radio")) {
      expect(day).not.toBeChecked();
    }
  });

  it("disables the days isDisabled rejects and only those", async () => {
    const onChange = vi.fn();
    render(
      <ControlledDayPicker isDisabled={weekendsDisabled} onChange={onChange} />,
    );

    // September 2026 has 4 Saturdays and 4 Sundays.
    const disabled = screen
      .getAllByRole("radio")
      .filter((day) => (day as HTMLInputElement).disabled);
    expect(disabled.map((day) => day.getAttribute("value"))).toEqual([
      "2026-09-05",
      "2026-09-06",
      "2026-09-12",
      "2026-09-13",
      "2026-09-19",
      "2026-09-20",
      "2026-09-26",
      "2026-09-27",
    ]);

    await userEvent.click(screen.getByRole("radio", { name: "September 12" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables every day when disabled is set", () => {
    render(<ControlledDayPicker initial="2026-09-16" disabled />);

    for (const day of screen.getAllByRole("radio")) {
      expect(day).toBeDisabled();
    }
    expect(screen.getByRole("radio", { name: "September 16" })).toBeChecked();
  });

  it("tabs to the chosen day and moves with the arrow keys, skipping disabled days", async () => {
    const onChange = vi.fn();
    render(
      <ControlledDayPicker
        initial="2026-09-11"
        isDisabled={weekendsDisabled}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Before" }));
    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "September 11" })).toHaveFocus();

    // Friday the 11th to Monday the 14th, past the weekend.
    await userEvent.keyboard("{ArrowRight}");
    const monday = screen.getByRole("radio", { name: "September 14" });
    expect(monday).toHaveFocus();
    expect(monday).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith("2026-09-14");

    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "September 11" })).toBeChecked();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ControlledDayPicker
        initial="2026-09-14"
        isDisabled={weekendsDisabled}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
