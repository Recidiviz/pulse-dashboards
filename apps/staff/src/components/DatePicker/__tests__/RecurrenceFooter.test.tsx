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

describe("RecurrenceFooter", () => {
  test("renders all five frequency chips", () => {
    render(
      <RecurrenceFooter
        selectedFreq="NONE"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "None" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Every day" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Every week" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Every month" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Every year" })).toBeVisible();
  });

  test("marks the selected chip with aria-pressed=true; others false", () => {
    render(
      <RecurrenceFooter
        selectedFreq="WEEKLY"
        anchorDate={FRIDAY}
        onFreqChange={vi.fn()}
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
      />,
    );
    expect(screen.queryByText(/will repeat/i)).toBeNull();
  });
});
