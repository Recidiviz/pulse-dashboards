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
import { useState } from "react";

import {
  DatePickerWithRecurrence,
  DateWithRecurrence,
} from "../DatePickerWithRecurrence";
import { buildRecurrenceRule } from "../recurrence";

const JUNE_18_2026 = new Date(2026, 5, 18); // Thursday
const JUNE_19_2026 = new Date(2026, 5, 19); // Friday

// Mounts the component as a controlled child of a tiny stateful host, so the
// roundtrip semantics (value -> chip click -> onChange -> new value) can be
// asserted as a real interaction rather than a single onChange snapshot.
function Host({
  initial,
  spy,
}: {
  initial: DateWithRecurrence;
  spy?: (next: DateWithRecurrence) => void;
}) {
  const [value, setValue] = useState<DateWithRecurrence>(initial);
  return (
    <DatePickerWithRecurrence
      placeholderText="Pick a date"
      value={value}
      onChange={(next) => {
        spy?.(next);
        setValue(next);
      }}
    />
  );
}

describe("DatePickerWithRecurrence", () => {
  test("renders the picker input and (on focus) the Repeat footer", () => {
    render(
      <Host initial={{ date: JUNE_18_2026, recurrence: null }} spy={vi.fn()} />,
    );
    const input = screen.getByPlaceholderText("Pick a date");
    expect(input).toHaveValue("06/18/2026");
    fireEvent.focus(input);
    expect(screen.getByRole("button", { name: "Every week" })).toBeVisible();
  });

  test("hint reflects the initial weekly recurrence on a Friday", () => {
    render(
      <Host
        initial={{
          date: JUNE_19_2026,
          recurrence: buildRecurrenceRule("WEEKLY", JUNE_19_2026),
        }}
        spy={vi.fn()}
      />,
    );
    fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
    expect(screen.getByText(/will repeat.*friday/i)).toBeVisible();
  });

  test("clicking a chip emits a DateWithRecurrence with the matching RRULE", () => {
    const spy = vi.fn();
    render(
      <Host initial={{ date: JUNE_19_2026, recurrence: null }} spy={spy} />,
    );
    fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
    fireEvent.click(screen.getByRole("button", { name: "Every week" }));
    expect(spy).toHaveBeenCalledTimes(1);
    const emitted = spy.mock.calls[0][0];
    expect(emitted.date).toEqual(JUNE_19_2026);
    expect(emitted.recurrence).toContain("FREQ=WEEKLY");
    expect(emitted.recurrence).toContain("BYDAY=FR");
  });

  test("picking a new date re-derives the RRULE against the new anchor", () => {
    const spy = vi.fn();
    render(
      <Host
        initial={{
          date: JUNE_18_2026,
          recurrence: buildRecurrenceRule("WEEKLY", JUNE_18_2026),
        }}
        spy={spy}
      />,
    );
    fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
    // Type a Friday in directly; react-datepicker parses it on change.
    fireEvent.change(screen.getByPlaceholderText("Pick a date"), {
      target: { value: "06/19/2026" },
    });
    expect(spy).toHaveBeenCalled();
    const last = spy.mock.calls.at(-1)?.[0];
    if (!last) throw new Error("expected at least one onChange call");
    expect(last.date?.getDate()).toBe(19);
    // Anchor moved Thu -> Fri; rrule must follow.
    expect(last.recurrence).toContain("BYDAY=FR");
  });

  test("clearing the date defaults the date to today and resets recurrence to null", () => {
    const spy = vi.fn();
    render(
      <Host
        initial={{
          date: JUNE_18_2026,
          recurrence: buildRecurrenceRule("MONTHLY", JUNE_18_2026),
        }}
        spy={spy}
      />,
    );
    fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
    fireEvent.change(screen.getByPlaceholderText("Pick a date"), {
      target: { value: "" },
    });
    const last = spy.mock.calls.at(-1)?.[0];
    if (!last) throw new Error("expected at least one onChange call");
    // The picker never emits a null date; it falls back to "today" so the form
    // always has a usable anchor. The rrule still resets to null because the
    // user cleared the explicit anchor that was driving it.
    expect(last.date).toBeInstanceOf(Date);
    expect(last.recurrence).toBeNull();
    // Chip should still read as Every month because the user's freq choice
    // is preserved across the intermediate state where rrule resolves to null.
    expect(screen.getByRole("button", { name: "Every month" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("picking a chip before a date defaults the date to today and keeps the chip selected", () => {
    const spy = vi.fn();
    render(<Host initial={{ date: null, recurrence: null }} spy={spy} />);
    fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
    fireEvent.click(screen.getByRole("button", { name: "Every week" }));
    expect(spy).toHaveBeenCalledTimes(1);
    // Chip click with no anchor falls back to today's date; rrule stays null
    // because it's derived against the original (null) anchor that the user
    // hadn't explicitly chosen yet.
    expect(spy.mock.calls[0][0].date).toBeInstanceOf(Date);
    expect(spy.mock.calls[0][0].recurrence).toBeNull();
    expect(screen.getByRole("button", { name: "Every week" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("forwards picker props (minDate, placeholderText) through to the underlying DatePicker", () => {
    const { container } = render(
      <DatePickerWithRecurrence
        value={{ date: JUNE_18_2026, recurrence: null }}
        onChange={vi.fn()}
        placeholderText="Pick a date"
        minDate={JUNE_18_2026}
      />,
    );
    fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
    const earlierDay = container.querySelector('[aria-label*="June 15"]');
    expect(
      earlierDay?.classList.contains("react-datepicker__day--disabled"),
    ).toBe(true);
  });
});
