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
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "../Checkbox";
import { DatePickerInput } from "../DatePickerInput";
import { SearchableSelect } from "../SearchableSelect";
import { Select } from "../Select";
import { SelectableChip } from "../SelectableChip";
import { TextInput } from "../TextInput";

vi.mock("../../../assets/check.svg?react", () => ({
  default: () => <svg data-testid="check-icon" />,
}));

describe("Checkbox", () => {
  it("renders unchecked with no tick", () => {
    render(
      <Checkbox
        checked={false}
        onChange={vi.fn()}
        aria-label="Include closed"
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: "Include closed" }),
    ).not.toBeChecked();
    expect(screen.queryByTestId("check-icon")).not.toBeInTheDocument();
  });

  it("renders checked with a tick", () => {
    render(<Checkbox checked onChange={vi.fn()} aria-label="Include closed" />);

    expect(
      screen.getByRole("checkbox", { name: "Include closed" }),
    ).toBeChecked();
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
  });

  it("reports a click to the caller", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox checked={false} onChange={onChange} aria-label="Pick" />);

    await user.click(screen.getByRole("checkbox", { name: "Pick" }));

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("ignores a click while disabled", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Checkbox
        checked={false}
        onChange={onChange}
        disabled
        aria-label="Pick"
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "Pick" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("associates a supplied id with the input, so an external label can target it", () => {
    render(
      <>
        <label htmlFor="include-closed">Include closed</label>
        <Checkbox checked={false} onChange={vi.fn()} id="include-closed" />
      </>,
    );

    expect(
      screen.getByRole("checkbox", { name: "Include closed" }),
    ).toHaveAttribute("id", "include-closed");
  });

  it("is reachable and operable from the keyboard", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox checked={false} onChange={onChange} aria-label="Pick" />);

    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Pick" })).toHaveFocus();

    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Checkbox checked onChange={vi.fn()} aria-label="Include closed" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("SelectableChip", () => {
  function renderChip(
    overrides: Partial<Parameters<typeof SelectableChip>[0]> = {},
  ) {
    const onSelect = vi.fn();
    const result = render(
      <SelectableChip
        name="gender"
        value="MALE"
        label="Men"
        checked={false}
        onSelect={onSelect}
        {...overrides}
      />,
    );
    return { onSelect, ...result };
  }

  it("renders as a radio labelled by its text", () => {
    renderChip();

    const radio = screen.getByRole("radio", { name: "Men" });
    expect(radio).not.toBeChecked();
    expect(radio).toHaveAttribute("name", "gender");
    expect(radio).toHaveAttribute("value", "MALE");
  });

  it("renders selected when checked", () => {
    renderChip({ checked: true });

    expect(screen.getByRole("radio", { name: "Men" })).toBeChecked();
  });

  it("reports a selection to the caller", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderChip();

    await user.click(screen.getByRole("radio", { name: "Men" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("ignores a click while disabled", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderChip({ disabled: true });

    await user.click(screen.getByRole("radio", { name: "Men" }));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("groups chips that share a name into one radio group", async () => {
    const user = userEvent.setup();
    const onSelectMen = vi.fn();
    const onSelectWomen = vi.fn();
    render(
      <>
        <SelectableChip
          name="gender"
          value="MALE"
          label="Men"
          checked
          onSelect={onSelectMen}
        />
        <SelectableChip
          name="gender"
          value="FEMALE"
          label="Women"
          checked={false}
          onSelect={onSelectWomen}
        />
      </>,
    );

    await user.click(screen.getByRole("radio", { name: "Women" }));

    expect(onSelectWomen).toHaveBeenCalledTimes(1);
    expect(onSelectMen).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderChip({ checked: true });

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DatePickerInput", () => {
  beforeEach(() => {
    // Frozen so the calendar's month never depends on the wall clock.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-09-10T16:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("leaves every day selectable when no minimum date is given", async () => {
    // The guard that keeps date of birth — and the other application form
    // dates — working: the cutoff is opt-in, never a default.
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <DatePickerInput
        value={null}
        onChange={vi.fn()}
        aria-label="Date of birth"
      />,
    );

    await user.click(screen.getByLabelText("Date of birth"));

    const days = await screen.findAllByRole("gridcell");
    expect(days.length).toBeGreaterThan(0);
    expect(
      days.filter((day) => day.getAttribute("aria-disabled") !== "false"),
    ).toEqual([]);
  });
});

describe("TextInput", () => {
  it("reports a typed value to the caller", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextInput value="" onChange={onChange} aria-label="Name" />);

    await user.type(screen.getByRole("textbox", { name: "Name" }), "a");

    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("shows the error text only when hasError is set", () => {
    const { rerender } = render(
      <TextInput value="" onChange={vi.fn()} aria-label="Name" />,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(
      <TextInput
        value=""
        onChange={vi.fn()}
        aria-label="Name"
        hasError
        errorText="Required"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  it("ignores typing while disabled", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <TextInput value="" onChange={onChange} aria-label="Name" disabled />,
    );

    await user.type(screen.getByRole("textbox", { name: "Name" }), "a");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <TextInput value="Jordan Lee" onChange={vi.fn()} aria-label="Name" />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Select", () => {
  const OPTIONS = [
    { value: "ID", label: "Idaho" },
    { value: "CA", label: "California" },
  ];

  it("renders every option and reflects the current value", () => {
    render(
      <Select
        value="ID"
        onChange={vi.fn()}
        options={OPTIONS}
        aria-label="State"
      />,
    );

    const select = screen.getByRole("combobox", { name: "State" });
    expect(select).toHaveValue("ID");
    expect(screen.getByRole("option", { name: "Idaho" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "California" }),
    ).toBeInTheDocument();
  });

  it("reports a selection to the caller", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select
        value="ID"
        onChange={onChange}
        options={OPTIONS}
        aria-label="State"
      />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: "State" }),
      "California",
    );

    expect(onChange).toHaveBeenCalledWith("CA");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Select
        value="ID"
        onChange={vi.fn()}
        options={OPTIONS}
        aria-label="State"
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("SearchableSelect", () => {
  const OPTIONS = [
    { value: "ALL", label: "All" },
    { value: "MALE", label: "Men only" },
    { value: "FEMALE", label: "Women only" },
  ];

  it("shows the label of the current value", () => {
    render(
      <SearchableSelect
        value="MALE"
        onChange={vi.fn()}
        options={OPTIONS}
        aria-label="Population"
      />,
    );

    expect(screen.getByText("Men only")).toBeInTheDocument();
  });

  it("reports a selection to the caller", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchableSelect
        value="MALE"
        onChange={onChange}
        options={OPTIONS}
        aria-label="Population"
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Population" }));
    await user.click(screen.getByRole("option", { name: "Women only" }));

    expect(onChange).toHaveBeenCalledWith("FEMALE");
  });

  it("cannot be cleared by default", () => {
    render(
      <SearchableSelect
        value="MALE"
        onChange={vi.fn()}
        options={OPTIONS}
        aria-label="Population"
      />,
    );

    expect(
      screen.queryByRole("button", { name: /clear/i }),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <SearchableSelect
        value="MALE"
        onChange={vi.fn()}
        options={OPTIONS}
        aria-label="Population"
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
