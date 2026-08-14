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

import { RecurrenceFooter } from "../RecurrenceFooter";

// Friday, June 19, 2026 — stable weekly anchor across the suite.
const FRIDAY = new Date(2026, 5, 19);

// Placeholder values for the tests in the `describe` block below, none of
// which exercise the custom-recurrence section (see the second `describe`
// block for that) — just here to satisfy the now-required controlled props.
const customProps = {
  customInterval: 1,
  customUnit: "WEEKLY" as const,
  onCustomFreqChange: vi.fn(),
};

describe("RecurrenceFooter", () => {
  test("renders all five frequency chips", () => {
    render(
      <RecurrenceFooter
        selectedFreq="NONE"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
        {...customProps}
      />,
    );
    expect(screen.getByRole("button", { name: "None" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Every week" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Every month" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Every year" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Custom" })).toBeVisible();
  });

  test("marks the selected chip with aria-pressed=true; others false", () => {
    render(
      <RecurrenceFooter
        selectedFreq="WEEKLY"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
        {...customProps}
      />,
    );
    expect(screen.getByRole("button", { name: "Every week" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "None" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("clicking a chip emits the new freq label", () => {
    const onFreqChange = vi.fn();
    render(
      <RecurrenceFooter
        selectedFreq="NONE"
        anchorDate={FRIDAY}
        onFreqChange={onFreqChange}
        {...customProps}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Every week" }));
    expect(onFreqChange).toHaveBeenCalledWith("WEEKLY");
  });

  test("clicking None emits the NONE label", () => {
    const onFreqChange = vi.fn();
    render(
      <RecurrenceFooter
        selectedFreq="DAILY"
        anchorDate={FRIDAY}
        onFreqChange={onFreqChange}
        {...customProps}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "None" }));
    expect(onFreqChange).toHaveBeenCalledWith("NONE");
  });

  test("hint line matches rrule.toText() when both a freq and anchor are present", () => {
    render(
      <RecurrenceFooter
        selectedFreq="WEEKLY"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
        {...customProps}
      />,
    );
    expect(screen.getByText(/will repeat.*friday/i)).toBeVisible();
  });

  test("hint line is hidden when freq is NONE", () => {
    render(
      <RecurrenceFooter
        selectedFreq="NONE"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
        {...customProps}
      />,
    );
    expect(screen.queryByText(/will repeat/i)).toBeNull();
  });

  test("hint line is hidden when freq is set but no anchor date (rrule pending)", () => {
    render(
      <RecurrenceFooter
        selectedFreq="WEEKLY"
        anchorDate={null}
        onFreqChange={vi.fn()}
        {...customProps}
      />,
    );
    expect(screen.queryByText(/will repeat/i)).toBeNull();
  });
});

describe("RecurrenceFooter custom recurrence section", () => {
  test("is hidden when selectedFreq is not CUSTOM", () => {
    render(
      <RecurrenceFooter
        selectedFreq="WEEKLY"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
        {...customProps}
      />,
    );
    expect(screen.queryByLabelText("Repeat interval")).toBeNull();
  });

  test("renders the interval stepper and unit dropdown when selectedFreq is CUSTOM", () => {
    render(
      <RecurrenceFooter
        selectedFreq="CUSTOM"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
        customInterval={3}
        customUnit="WEEKLY"
        onCustomFreqChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Repeat interval")).toHaveValue(3);
    expect(screen.getByRole("button", { name: "week(s)" })).toBeVisible();
  });

  test("clicking a unit in the dropdown emits it with the current interval", () => {
    const onCustomFreqChange = vi.fn();
    render(
      <RecurrenceFooter
        selectedFreq="CUSTOM"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
        customInterval={3}
        customUnit="DAILY"
        onCustomFreqChange={onCustomFreqChange}
      />,
    );
    // The unit dropdown's menu items are disabled until the toggle opens it.
    fireEvent.click(screen.getByRole("button", { name: "day(s)" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "week(s)" }));
    expect(onCustomFreqChange).toHaveBeenCalledWith("WEEKLY", 3);
  });

  test("bumping the interval stepper emits the current unit with the new interval", () => {
    const onCustomFreqChange = vi.fn();
    render(
      <RecurrenceFooter
        selectedFreq="CUSTOM"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
        customInterval={3}
        customUnit="WEEKLY"
        onCustomFreqChange={onCustomFreqChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Increase" }));
    expect(onCustomFreqChange).toHaveBeenCalledWith("WEEKLY", 4);
  });

  test("hint reflects the custom unit and interval, not the plain CUSTOM freq", () => {
    render(
      <RecurrenceFooter
        selectedFreq="CUSTOM"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
        customInterval={3}
        customUnit="WEEKLY"
        onCustomFreqChange={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/will repeat every 3 weeks.*friday/i),
    ).toBeVisible();
  });
});
