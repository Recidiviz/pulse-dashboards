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

import { fireEvent, render, screen, within } from "@testing-library/react";
import * as React from "react";
import { createRef } from "react";
import ReactDatePicker from "react-datepicker";

import { DatePicker } from "../DatePicker";

const JUNE_18_2026 = new Date(2026, 5, 18);

describe("DatePicker", () => {
  describe("rendering + value display", () => {
    test("renders a textbox with the placeholder text", () => {
      render(
        <DatePicker
          selected={null}
          onChange={vi.fn()}
          placeholderText="Pick a date"
        />,
      );
      const input = screen.getByPlaceholderText("Pick a date");
      expect(input).toBeVisible();
      expect(input).toHaveValue("");
    });

    test("selected populates the input as MM/dd/yyyy", () => {
      render(
        <DatePicker
          selected={JUNE_18_2026}
          onChange={vi.fn()}
          placeholderText="Pick a date"
        />,
      );
      expect(screen.getByPlaceholderText("Pick a date")).toHaveValue(
        "06/18/2026",
      );
    });

    test("renders showIcon + icon adjacent to the input", () => {
      render(
        <DatePicker
          selected={null}
          onChange={vi.fn()}
          showIcon
          icon={<span data-testid="my-icon" />}
        />,
      );
      expect(screen.getByTestId("my-icon")).toBeInTheDocument();
    });
  });

  describe("opening and selecting", () => {
    test("focusing the input opens the calendar popper with the default header", () => {
      const { container } = render(
        <DatePicker
          selected={JUNE_18_2026}
          onChange={vi.fn()}
          placeholderText="Pick a date"
        />,
      );
      fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
      // Popper should be present with the default header text
      expect(container.querySelector(".react-datepicker")).not.toBeNull();
      expect(screen.getByText("June 2026")).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Previous month" }),
      ).toBeVisible();
    });

    test("clicking a day fires onChange with that Date", () => {
      const onChange = vi.fn();
      render(
        <DatePicker
          selected={JUNE_18_2026}
          onChange={onChange}
          placeholderText="Pick a date"
        />,
      );
      fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
      // react-datepicker labels days as "Choose Monday, June 22nd, 2026"; we
      // just need a day in the visible June grid that isn't the selected one.
      const dayButton = screen.getByLabelText(/Choose .*June 22.*, 2026/);
      fireEvent.click(dayButton);
      expect(onChange).toHaveBeenCalledTimes(1);
      const picked = onChange.mock.calls[0][0] as Date;
      expect(picked.getFullYear()).toBe(2026);
      expect(picked.getMonth()).toBe(5);
      expect(picked.getDate()).toBe(22);
    });

    test("popper stays open after a day is picked (shouldCloseOnSelect=false default)", () => {
      const { container } = render(
        <DatePicker
          selected={JUNE_18_2026}
          onChange={vi.fn()}
          placeholderText="Pick a date"
        />,
      );
      fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
      expect(container.querySelector(".react-datepicker")).not.toBeNull();
      fireEvent.click(screen.getByLabelText(/Choose .*June 22.*, 2026/));
      // Calendar should still be in the DOM so users can keep interacting
      // (navigate months, pick a recurrence chip in the wrapper, etc.).
      expect(container.querySelector(".react-datepicker")).not.toBeNull();
    });

    test("caller can opt back into close-on-select by passing shouldCloseOnSelect", () => {
      const { container } = render(
        <DatePicker
          selected={JUNE_18_2026}
          onChange={vi.fn()}
          placeholderText="Pick a date"
          shouldCloseOnSelect
        />,
      );
      fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
      fireEvent.click(screen.getByLabelText(/Choose .*June 22.*, 2026/));
      expect(container.querySelector(".react-datepicker")).toBeNull();
    });

    test("minDate marks earlier days as disabled", () => {
      const { container } = render(
        <DatePicker
          selected={JUNE_18_2026}
          onChange={vi.fn()}
          minDate={JUNE_18_2026}
        />,
      );
      fireEvent.focus(screen.getByRole("textbox"));
      const earlierDay = container.querySelector(
        '[aria-label*="June 15"]',
      ) as HTMLElement | null;
      expect(earlierDay).not.toBeNull();
      expect(
        earlierDay?.classList.contains("react-datepicker__day--disabled"),
      ).toBe(true);
    });
  });

  describe("override slots", () => {
    test("caller-supplied dateFormat overrides the default", () => {
      render(
        <DatePicker
          selected={JUNE_18_2026}
          onChange={vi.fn()}
          dateFormat="yyyy-MM-dd"
          placeholderText="Pick a date"
        />,
      );
      expect(screen.getByPlaceholderText("Pick a date")).toHaveValue(
        "2026-06-18",
      );
    });

    test("caller-supplied renderCustomHeader replaces the default header", () => {
      render(
        <DatePicker
          selected={JUNE_18_2026}
          onChange={vi.fn()}
          renderCustomHeader={() => <div>custom-header-marker</div>}
          placeholderText="Pick a date"
        />,
      );
      fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
      expect(screen.getByText("custom-header-marker")).toBeVisible();
      // The default header's accessible labels should NOT be present.
      expect(
        screen.queryByRole("button", { name: "Previous month" }),
      ).toBeNull();
    });

    test("caller-supplied customInput replaces the default input", () => {
      const CustomInput = React.forwardRef<
        HTMLInputElement,
        React.InputHTMLAttributes<HTMLInputElement>
      >(function CustomInput(props, ref) {
        return <input ref={ref} data-testid="custom-input" {...props} />;
      });
      render(
        <DatePicker
          selected={JUNE_18_2026}
          onChange={vi.fn()}
          customInput={<CustomInput />}
          placeholderText="Pick a date"
        />,
      );
      const input = screen.getByTestId("custom-input") as HTMLInputElement;
      expect(input).toBeVisible();
      expect(input).toHaveValue("06/18/2026");
    });

    test("caller-supplied calendarContainer wraps the calendar (footer-injection slot)", () => {
      const CustomContainer: React.FC<{ children?: React.ReactNode }> = ({
        children,
      }) => (
        <div data-testid="calendar-shell">
          {children}
          <div data-testid="footer-injection">Footer</div>
        </div>
      );

      render(
        <DatePicker
          selected={JUNE_18_2026}
          onChange={vi.fn()}
          calendarContainer={CustomContainer}
          placeholderText="Pick a date"
        />,
      );
      fireEvent.focus(screen.getByPlaceholderText("Pick a date"));
      const shell = screen.getByTestId("calendar-shell");
      expect(shell).toBeVisible();
      expect(within(shell).getByTestId("footer-injection")).toBeVisible();
    });
  });

  describe("prop forwarding", () => {
    test("input-level props (name, id, autoComplete) land on the underlying input", () => {
      render(
        <DatePicker
          selected={null}
          onChange={vi.fn()}
          name="due_date"
          id="due-date-input"
          autoComplete="off"
          placeholderText="Pick a date"
        />,
      );
      const input = screen.getByPlaceholderText(
        "Pick a date",
      ) as HTMLInputElement;
      expect(input.tagName).toBe("INPUT");
      expect(input.name).toBe("due_date");
      expect(input.id).toBe("due-date-input");
      expect(input.autocomplete).toBe("off");
    });

    test("forwards ref to the underlying ReactDatePicker instance", () => {
      const ref = createRef<ReactDatePicker>();
      render(<DatePicker selected={null} onChange={vi.fn()} ref={ref} />);
      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.setOpen).toBe("function");
      expect(typeof ref.current?.setFocus).toBe("function");
    });
  });

  describe("disabled state", () => {
    test("disabled flag disables the input", () => {
      render(
        <DatePicker
          selected={null}
          onChange={vi.fn()}
          disabled
          placeholderText="Pick a date"
        />,
      );
      expect(screen.getByPlaceholderText("Pick a date")).toBeDisabled();
    });
  });
});
